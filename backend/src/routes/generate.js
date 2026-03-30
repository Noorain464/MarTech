import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { MongoClient } from 'mongodb';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Convert a segment name to a stable slug ID, e.g. "Enterprise Buyers" + index 0 → "enterprise_buyers_01"
function toSegmentId(name, index) {
  const slug = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  return `${slug}_0${index + 1}`;
}

// @route   POST /api/generate
// @desc    Worker Agent — generate personalised copy variants for every segment
// @access  Private
router.post('/', protect, async (req, res) => {

  // ─── STEP 1: RECEIVE AND VALIDATE THE APPROVED PROFILE ───────────────────
  const { profile } = req.body;

  if (!profile?.segments?.length || !profile?.value_props?.length) {
    return res.status(400).json({
      success: false,
      message: 'Invalid profile: segments and value_props are required.',
    });
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const mongoClient = new MongoClient(process.env.MONGO_URI);

  try {
    await mongoClient.connect();
    const collection = mongoClient.db('personalization').collection('variants');

    const allVariants = [];

    // ─── STEP 2: LOOP THROUGH EVERY SEGMENT ────────────────────────────────
    for (const [index, segment] of profile.segments.entries()) {
      const slots = req.body.slots?.length ? req.body.slots : ['headline', 'subheadline', 'cta_text'];
      const segmentId = toSegmentId(segment.name, index);
      const tone = profile.tone || 'professional and direct';
      const valueProps = profile.value_props.join(', ');

      // ─── STEP 3: CALL CLAUDE CONCURRENTLY FOR ALL THREE SLOTS ────────────
      // All three slot calls for this segment fire at the same time via Promise.all
      const slotResults = await Promise.all(
        slots.map(async (slot) => {
          const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 256,
            messages: [
              {
                role: 'user',
                content:
                  `You are a conversion copywriter. ` +
                  `Generate a \`${slot}\` for the \`${segment.name}\` audience segment. ` +
                  `Their pain point is: \`${segment.pain_point || ''}\`. ` +
                  `Website signals that identify them: \`${segment.signals || ''}\`. ` +
                  `Value props to emphasise: \`${valueProps}\`. ` +
                  `Tone: \`${tone}\`. ` +
                  `Output ONLY a raw JSON object in this exact shape: { "${slot}": "your copy here" }. ` +
                  `No explanation, no markdown, no extra keys.`,
              },
            ],
          });

          // Strip any accidental markdown code fences Claude may add
          const raw = response.content[0].text.trim();
          const clean = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
          return JSON.parse(clean);
        })
      );

      // Merge { headline: "..." }, { subheadline: "..." }, { cta_text: "..." } → one object
      const slotsObj = Object.assign({}, ...slotResults);

      const variant = {
        customer_id: req.user.id,
        segment_id: segmentId,
        segment_name: segment.name,
        persona: segment.persona || '',
        firmographics: segment.firmographics || '',
        pain_point: segment.pain_point || '',
        signals: segment.signals || '',
        slots: slotsObj,
        generated_at: new Date().toISOString(),
      };

      // ─── STEP 4: UPSERT INTO MONGODB ──────────────────────────────────────
      // Scoped per customer — re-running never creates duplicates
      await collection.updateOne(
        { customer_id: req.user.id, segment_id: segmentId },
        { $set: variant },
        { upsert: true }
      );

      allVariants.push(variant);
    }

    res.json({
      success: true,
      segments_processed: allVariants.length,
      variants: allVariants,
    });

  } catch (error) {
    console.error('Worker Agent error:', error);
    res.status(500).json({ success: false, message: error.message || 'Generation failed.' });
  } finally {
    await mongoClient.close();
  }
});

export default router;
