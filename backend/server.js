import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './src/routes/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// Strip accidental trailing slashes from FRONTEND_URL to ensure exact CORS origin matching
// const originUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

app.use(cors({
    origin: "https://mar-tech-teal.vercel.app",
    credentials: true,
}));
app.use(express.json());
app.options("*", cors());

// Database connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);

// Base route
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
