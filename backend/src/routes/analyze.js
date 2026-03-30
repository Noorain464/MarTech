import express from 'express';
import { MongoClient } from 'mongodb';
import User from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

async function getCollection() {
  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  return { client, collection: client.db('personalization').collection('page_scans') };
}

// CORS headers for public endpoints (called from any website)
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// Preflight
router.options('/scan', (req, res) => {
  setCorsHeaders(res);
  res.sendStatus(204);
});

// @route   POST /api/analyze/scan
// @desc    Receive DOM scan from the marketer's website script tag — public endpoint
// @access  Public
router.post('/scan', async (req, res) => {
  setCorsHeaders(res);
  const { customer_id, page_url, page_title, elements } = req.body;

  if (!customer_id || !Array.isArray(elements)) {
    return res.status(400).json({ message: 'customer_id and elements are required' });
  }

  // Verify the customer exists before saving
  const user = await User.findById(customer_id).catch(() => null);
  if (!user) return res.status(404).json({ message: 'Customer not found' });

  const { client, collection } = await getCollection();
  try {
    const doc = {
      customer_id,
      page_url: page_url || '',
      page_title: page_title || '',
      scanned_at: new Date().toISOString(),
      status: 'received',
      // Attach default labels and selected=false for each element
      elements: elements.map((el) => ({
        martech_id:   el.martech_id,
        tag:          el.tag,
        type:         el.type,
        text_preview: el.text_preview,
        selected:     false,
        label:        el.label || deriveLabel(el.type, el.tag),
      })),
    };

    // Upsert — re-scanning the same page updates in place
    await collection.updateOne(
      { customer_id, page_url: page_url || '' },
      { $set: doc },
      { upsert: true }
    );

    res.json({ ok: true, elements_received: elements.length });
  } catch (err) {
    console.error('Analyze scan error:', err);
    res.status(500).json({ message: 'Failed to save scan' });
  } finally {
    await client.close();
  }
});

// @route   GET /api/analyze/latest
// @desc    Return the most recent page scan for the logged-in marketer
// @access  Private
router.get('/latest', protect, async (req, res) => {
  const { client, collection } = await getCollection();
  try {
    const scan = await collection
      .find({ customer_id: req.user.id })
      .sort({ scanned_at: -1 })
      .limit(1)
      .next();

    res.json({ scan: scan || null });
  } catch (err) {
    console.error('Fetch scan error:', err);
    res.status(500).json({ message: 'Failed to fetch scan' });
  } finally {
    await client.close();
  }
});

// @route   PATCH /api/analyze/:scanId/confirm
// @desc    Save marketer's element selections and labels, lock them in
// @access  Private
router.patch('/:scanId/confirm', protect, async (req, res) => {
  const { elements } = req.body; // [{ martech_id, selected, label }]

  if (!Array.isArray(elements)) {
    return res.status(400).json({ message: 'elements array is required' });
  }

  const { client, collection } = await getCollection();
  const { ObjectId } = await import('mongodb');

  try {
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(req.params.scanId), customer_id: req.user.id },
      { $set: { elements, status: 'confirmed' } },
      { returnDocument: 'after' }
    );

    if (!result) return res.status(404).json({ message: 'Scan not found' });
    res.json({ scan: result });
  } catch (err) {
    console.error('Confirm scan error:', err);
    res.status(500).json({ message: 'Failed to confirm scan' });
  } finally {
    await client.close();
  }
});

function deriveLabel(type, tag) {
  if (type === 'headline' || tag === 'H1') return 'Hero Headline';
  if (type === 'subheadline' || tag === 'H2') return 'Subheadline';
  if (type === 'cta' || tag === 'BUTTON') return 'CTA Button';
  if (type === 'paragraph') return 'Hero Paragraph';
  if (type === 'nav_cta') return 'Nav CTA';
  return tag;
}

export default router;
