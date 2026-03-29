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
  isOnboarded: {
    type: Boolean,
    default: false
  },
  onboardingData: {
    role: String,
    primaryGoal: [String],
    businessType: String,
    teamSize: String,
    referralSource: String
  },
  isProfileComplete: {
    type: Boolean,
    default: false
  },
  extendedProfileData: {
    companyWebsite: String,
    industry: String,
    companySize: String,
    channels: [String],
    cms: String,
    analyticsTool: String,
    crm: String,
    websiteTraffic: String,
    outcomes: [String],
    painPoint: String,
    targetCustomer: String,
    targetCompanySize: String,
    buyerPersonas: String
  }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;
