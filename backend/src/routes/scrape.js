import express from 'express';
import * as cheerio from 'cheerio';
import axios from 'axios';
import Anthropic from '@anthropic-ai/sdk';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Tool definitions given to Claude ────────────────────────────────────────

const TOOLS = [
  {
    name: 'fetch_page',
    description:
      'Fetches the HTML of a URL. Returns the cleaned HTML body text with tag structure preserved ' +
      'so you can identify elements and build CSS selectors. Call this first.',
    input_schema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'The full URL to fetch (must include https://)' },
      },
      required: ['url'],
    },
  },
  {
    name: 'submit_elements',
    description:
      'Call this when you have finished analyzing the page. Submit all personalizable elements ' +
      'you identified. This terminates the analysis.',
    input_schema: {
      type: 'object',
      properties: {
        page_title: { type: 'string', description: 'The page <title> or main heading' },
        elements: {
          type: 'array',
          description: 'All personalizable elements found on the page',
          items: {
            type: 'object',
            properties: {
              tag:          { type: 'string', description: 'HTML tag in uppercase, e.g. H1, H2, BUTTON, P' },
              type:         { type: 'string', enum: ['headline', 'subheadline', 'cta', 'paragraph'], description: 'Semantic type' },
              text_preview: { type: 'string', description: 'The visible text of this element, max 150 chars' },
              selector:     { type: 'string', description: 'A specific CSS selector that uniquely targets this element on the page' },
              label:        { type: 'string', description: 'A short marketer-friendly label, e.g. "Hero Headline", "Primary CTA"' },
              reasoning:    { type: 'string', description: 'One sentence on why a growth marketer would want to personalise this' },
            },
            required: ['tag', 'type', 'text_preview', 'selector', 'label', 'reasoning'],
          },
        },
      },
      required: ['page_title', 'elements'],
    },
  },
];

const SYSTEM_PROMPT = `You are a conversion rate optimization (CRO) expert analyzing a website for a growth marketer.
Your job is to identify which elements on the page are worth personalizing for different audience segments.

WHAT TO LOOK FOR:
- The main hero headline (H1) — almost always worth personalizing
- Supporting subheadlines (H2, H3) that describe value or benefits
- CTA buttons and links ("Get Started", "Book Demo", "Sign Up", "Try Free")
- Hero paragraph text that explains what the product does
- Benefit statements or value proposition text

WHAT TO IGNORE:
- Navigation menu items
- Footer links
- Cookie banners, popups, modals
- Social proof numbers (unless they're in a headline)
- Blog post titles, generic list items
- Copyright text

CSS SELECTOR RULES:
- Prefer ID selectors (#hero-title) when an id exists
- Use tag + class for elements with meaningful class names (h1.hero__title)
- Use :nth-of-type() as a fallback for positional targeting
- Keep selectors specific enough to be unique but not so fragile they break on minor HTML changes

After fetching the page, think about what a growth marketer selling to different segments (enterprise vs SMB, or different industries) would want to change. Only submit elements that would actually move the needle if swapped.`;

// ─── Tool executor ────────────────────────────────────────────────────────────

async function executeTool(name, input) {
  if (name === 'fetch_page') {
    const { url } = input;

    let parsedUrl;
    try {
      parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
    } catch {
      return { error: 'Invalid URL' };
    }

    try {
      const response = await axios.get(parsedUrl.href, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        timeout: 12000,
        maxRedirects: 5,
      });

      const $ = cheerio.load(response.data);

      // Strip noise before handing to Claude — saves tokens
      $('script, style, noscript, svg, img, picture, video, iframe, link, meta, [aria-hidden="true"]').remove();
      $('nav, footer, .cookie, .popup, .modal, .banner[class*="cookie"]').remove();

      // Extract just the body HTML, condensed
      const bodyHtml = $('body').html() || $('html').html() || '';

      // Trim whitespace aggressively, cap at 25k chars (enough for most pages)
      const cleaned = bodyHtml
        .replace(/\s{2,}/g, ' ')
        .replace(/>\s+</g, '><')
        .slice(0, 25000);

      const title = $('title').text().trim();

      return {
        title,
        html: cleaned,
        note: bodyHtml.length > 25000
          ? `HTML was truncated to 25000 chars. Original: ${bodyHtml.length} chars.`
          : undefined,
      };
    } catch (err) {
      const status = err.response?.status;
      return { error: `Fetch failed: ${status ? `HTTP ${status}` : err.message}` };
    }
  }

  // submit_elements is handled by the loop — shouldn't be executed
  return { error: 'Unknown tool' };
}

// ─── Agent loop ───────────────────────────────────────────────────────────────

async function runScrapeAgent(url) {
  const messages = [
    {
      role: 'user',
      content: `Analyze this website and identify all elements a growth marketer would want to personalize for different audience segments.\n\nURL: ${url}\n\nFirst fetch the page, then submit the personalizable elements you find.`,
    },
  ];

  // Max 5 turns to prevent infinite loops
  for (let turn = 0; turn < 5; turn++) {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      tool_choice: { type: 'any' },
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      messages,
    });

    // Add Claude's response to history
    messages.push({ role: 'assistant', content: response.content });

    // Check if Claude called submit_elements — that's our termination signal
    const submitCall = response.content.find(
      (block) => block.type === 'tool_use' && block.name === 'submit_elements'
    );

    if (submitCall) {
      // Return the structured elements Claude identified
      const result = submitCall.input;
      return {
        page_title: result.page_title,
        elements: result.elements.map((el, i) => ({
          id: `el_${i}`,
          tag: el.tag.toUpperCase(),
          type: el.type,
          text_preview: el.text_preview,
          selector: el.selector,
          label: el.label,
          reasoning: el.reasoning,
          selected: ['headline', 'subheadline', 'cta'].includes(el.type),
        })),
      };
    }

    // If stop reason is end_turn with no tool call, Claude gave up — shouldn't happen
    if (response.stop_reason === 'end_turn') {
      throw new Error('Agent finished without submitting elements');
    }

    // Execute all tool calls and feed results back
    const toolResults = [];
    for (const block of response.content) {
      if (block.type !== 'tool_use') continue;

      const output = await executeTool(block.name, block.input);
      toolResults.push({
        type: 'tool_result',
        tool_use_id: block.id,
        content: JSON.stringify(output),
      });
    }

    messages.push({ role: 'user', content: toolResults });
  }

  throw new Error('Agent did not complete within turn limit');
}

// ─── Route ────────────────────────────────────────────────────────────────────

// @route   POST /api/scrape
// @desc    Claude agent fetches and analyzes a URL, returns personalizable elements
// @access  Private
router.post('/', protect, async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ message: 'url is required' });

  try {
    const result = await runScrapeAgent(url.trim());
    res.json({ url, page_title: result.page_title, elements: result.elements });
  } catch (err) {
    console.error('Scrape agent error:', err.message);
    const isUserError = err.message.includes('Fetch failed') || err.message.includes('Invalid URL');
    res.status(isUserError ? 422 : 500).json({ message: err.message });
  }
});

export default router;
