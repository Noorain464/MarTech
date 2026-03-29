import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Generate Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @route   POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      email,
      password: hashedPassword,
    });

    if (user) {
      res.status(201).json({
        _id: user.id,
        email: user.email,
        isOnboarded: user.isOnboarded,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/signin
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user.id,
        email: user.email,
        isOnboarded: user.isOnboarded,
        onboardingData: user.onboardingData,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/onboarding
router.post('/onboarding', protect, async (req, res) => {
  try {
    // req.user comes from the protect middleware
    const user = await User.findById(req.user.id);
    
    if (user) {
      user.onboardingData = req.body;
      user.isOnboarded = true;
      const updatedUser = await user.save();
      
      res.json({
        _id: updatedUser.id,
        email: updatedUser.email,
        isOnboarded: updatedUser.isOnboarded,
        onboardingData: updatedUser.onboardingData,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/profile
router.post('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (user) {
      user.extendedProfileData = req.body;
      user.isProfileComplete = true;
      const updatedUser = await user.save();
      
      res.json({
        _id: updatedUser.id,
        email: updatedUser.email,
        isOnboarded: updatedUser.isOnboarded,
        isProfileComplete: updatedUser.isProfileComplete,
        onboardingData: updatedUser.onboardingData,
        extendedProfileData: updatedUser.extendedProfileData,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
