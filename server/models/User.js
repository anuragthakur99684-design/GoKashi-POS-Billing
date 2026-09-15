const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  shopName: { type: String, required: true },
  ownerName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  
  // Subscription status for SaaS
  subscriptionPlan: { type: String, enum: ['Free Trial', 'Starter', 'Pro'], default: 'Free Trial' },
  isSubscribed: { type: Boolean, default: true },
  subscriptionEndDate: { 
    type: Date, 
    default: () => new Date(+new Date() + 7*24*60*60*1000) // 7 Days Free Trial default
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);