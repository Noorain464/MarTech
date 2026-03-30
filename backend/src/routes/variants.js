import express from 'express';
import { MongoClient } from 'mongodb';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

async function getCollection() {
  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  return { client, collection: client.db('personalization').collection('variants') };
}

// @route   GET /api/variants
// @desc    Return all generated variants for the logged-in marketer
// @access  Private
router.get('/', protect, async (req, res) => {
  const { client, collection } = await getCollection();
  try {
    const variants = await collection
      .find({ customer_id: req.user.id })
      .toArray();
    res.json({ variants });
  } catch (err) {
    console.error('Fetch variants error:', err);
    res.status(500).json({ message: 'Failed to fetch variants' });
  } finally {
    await client.close();
  }
});

// @route   POST /api/variants/resolve
// @desc    Runtime waterfall — given visitor signals, return the right copy variant
// @access  Public (called by the marketer's website script tag)
router.post('/resolve', async (req, res) => {
  const { customer_id, utm_campaign, utm_source, utm_medium, referrer } = req.body;

  if (!customer_id) {
    return res.status(400).json({ message: 'customer_id is required' });
  }

  const { client, collection } = await getCollection();
  try {
    const variants = await collection.find({ customer_id }).toArray();

    if (!variants.length) {
      return res.json({ matched: false, slots: null });
    }

    // Priority waterfall: UTM campaign → UTM source → referrer → default
    const signals = [utm_campaign, utm_source, utm_medium, referrer]
      .filter(Boolean)
      .map((s) => s.toLowerCase());

    let matched = null;

    if (signals.length) {
      // Score each variant by how many of its signal keywords appear in the visitor's signals
      const scored = variants.map((v) => {
        const variantSignalWords = (v.signals + ' ' + v.segment_name)
          .toLowerCase()
          .split(/[\s,]+/)
          .filter((w) => w.length > 3); // skip short words

        const score = variantSignalWords.filter((word) =>
          signals.some((s) => s.includes(word) || word.includes(s.replace(/-/g, '_')))
        ).length;

        return { variant: v, score };
      });

      const best = scored.sort((a, b) => b.score - a.score)[0];
      if (best.score > 0) matched = best.variant;
    }

    // Fallback: return the first (default) variant
    const result = matched || variants[0];

    // Set CORS headers so any website can call this endpoint
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json({
      matched: !!matched,
      segment_id: result.segment_id,
      segment_name: result.segment_name,
      slots: result.slots,
    });
  } catch (err) {
    console.error('Resolve variant error:', err);
    res.status(500).json({ message: 'Resolution failed' });
  } finally {
    await client.close();
  }
});

// Handle preflight for CORS (script tag on external sites)
router.options('/resolve', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.sendStatus(204);
});

export default router;
