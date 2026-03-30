import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
<<<<<<< HEAD
  isOnboarded: {
    type: Boolean,
    default: false
  },
  onboardingData: {
    role: String,
    primaryGoal: [String],
    businessType: String,
    teamSize: String,
    referralSource: String,
    companyName: String,
    companySize: String
=======
  agentProfile: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  isProfileComplete: {
    type: Boolean,
    default: false
>>>>>>> f3efbdc (Setup Agent)
  }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;
