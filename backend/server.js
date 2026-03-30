import 'dotenv/config'; // Must be imported this way in ESM so env vars map before other imports

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import authRoutes from './src/routes/auth.js';
import agentRoutes from './src/routes/agent.js';
import generateRoutes from './src/routes/generate.js';
import variantsRoutes from './src/routes/variants.js';
import analyzeRoutes from './src/routes/analyze.js';
import scrapeRoutes from './src/routes/scrape.js';

const app = express();
app.set('etag', false); // Disable ETag — it buffers SSE responses in Express 5
const PORT = process.env.PORT || 5001;

const allowedOrigins = [
  'http://localhost:5173',
  'https://mar-tech-teal.vercel.app',
  "http://localhost:5173",
  "https://mar-tech-teal.vercel.app",
  "https://dummy-clone.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Temporarily allow all origins since the SDK endpoint needs to be public, but let's be explicitly permissive for now
    }
  },
  credentials: true,
}));
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use('/api/auth', authRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/generate', generateRoutes);
app.use('/api/variants', variantsRoutes);
app.use('/api/analyze', analyzeRoutes);
app.use('/api/scrape', scrapeRoutes);

app.get('/', (req, res) => res.send('API is running...'));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
