import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import User from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

const SYSTEM_PROMPT = `You are a friendly audience segmentation specialist built into a martech platform. Your job is to interview a growth marketer in a natural, conversational way to extract the information needed to build 2–4 audience segments for website personalization.

## GOAL
Build a complete picture of each segment:
- Who they are (company type, size, industry, buyer role)
- What drives them (pain points, purchase triggers)
- How to identify them on the website (behavioral/UTM signals)
- What message will land (segment-specific headline/CTA)

## HOW TO ASK QUESTIONS
- You may group 2–3 tightly related questions in one message when it feels natural (e.g. company name + what it does, buyer title + company size). Never exceed 3 per turn.
- Keep each question short — one sentence each.
- Move on once you have enough on a topic. Don't over-probe.
- Cover these areas across the conversation (adapt the order naturally):
  1. Company name + what it does
  2. Target buyer: role/title + company size/industry
  3. Primary pain point + what triggers the search
  4. Competitors they lose/win against
  5. Whether there are distinct buyer groups needing different messages
  6. How to identify each segment from website behavior (pages, UTMs, referrer)
  7. What outcome each segment cares most about (for headline/CTA)

## RULES
- Do NOT announce topics or number your questions.
- Skip any topic the user already covered in a prior answer.
- Once you have enough to define at least 2 segments with real signals, output the profile JSON.
- Do NOT output the JSON early — confirm segment signals and value props first.
- NEVER include <PROFILE_JSON> tags in a conversational message.

## OUTPUT
When ready, output ONLY this — no text before or after:
<PROFILE_JSON>
{
  "icp": "1–2 sentence summary of the ideal customer",
  "value_props": ["Outcome benefit 1", "Outcome benefit 2", "Differentiator"],
  "segments": [
    {
      "name": "Segment label",
      "description": "Who they are and why they buy",
      "firmographics": "e.g. company_size > 500, industry = SaaS",
      "persona": "e.g. VP of Engineering",
      "pain_point": "Specific problem this segment solves",
      "trigger": "Event that starts their search",
      "signals": "e.g. visited /enterprise, UTM = enterprise-q1, referrer = LinkedIn",
      "value_prop": "Headline or CTA tailored to this segment"
    }
  ]
}
</PROFILE_JSON>

## OPENER
Start with exactly this message (personalize only the first sentence):
"Hey! I'm your Setup Agent — I'll ask you a few quick questions to help personalize your website for different audience segments. Let's start: what's your company name, and what does it do?"`;

// @route   POST /api/agent/chat
// @desc    Conversation with Claude Setup Agent (buffers response, strips JSON before sending)
// @access  Private
router.post('/chat', protect, async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ message: 'Messages array is required' });
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const resolvedMessages = messages.length === 0
      ? [{ role: 'user', content: 'Hello, ready to start.' }]
      : messages;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: resolvedMessages,
      stream: true,
    });

    let fullText = '';

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.text) {
        fullText += chunk.delta.text;

        // Once JSON tag appears, stop streaming text — buffer the rest silently
        if (fullText.includes('<PROFILE_JSON>')) continue;

        res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`);
      }
    }

    // If response contains a profile, extract and emit it as a separate event
    const jsonMatch = fullText.match(/<PROFILE_JSON>([\s\S]*?)<\/PROFILE_JSON>/);
    if (jsonMatch) {
      try {
        const profile = JSON.parse(jsonMatch[1].trim());
        res.write(`data: ${JSON.stringify({ profile })}\n\n`);
      } catch {
        // malformed JSON — ignore, let frontend handle gracefully
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error) {
    console.error('Agent chat error:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error communicating with Agent API' });
    } else {
      res.write(`data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`);
      res.end();
    }
  }
});

// @route   POST /api/agent/save
// @desc    Save extracted agent profile to user document in MongoDB
// @access  Private
router.post('/save', protect, async (req, res) => {
  try {
    const { agentProfile } = req.body;

    if (!agentProfile || !agentProfile.segments || !agentProfile.value_props) {
      return res.status(400).json({ message: 'Invalid agent profile data' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { agentProfile, isProfileComplete: true },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      _id: user.id,
      agentProfile: user.agentProfile,
      isProfileComplete: user.isProfileComplete,
    });
  } catch (error) {
    console.error('Save agent profile error:', error);
    res.status(500).json({ message: 'Server error saving profile' });
  }
});

export default router;
