const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jwt-simple');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'gokashi_secret_key_123';

// 1. SIGNUP ROUTE (Naya Dukaandar Register Karna)
router.post('/register', async (req, res) => {
  try {
    const { shopName, ownerName, email, password, phone } = req.body;

    let existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email pehle se registered hai' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      shopName,
      ownerName,
      email,
      password: hashedPassword,
      phone
    });

    await newUser.save();

    const token = jwt.encode({ userId: newUser._id }, JWT_SECRET);
    res.status(201).json({ 
      success: true, 
      token, 
      user: { id: newUser._id, shopName, ownerName, email } 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. LOGIN ROUTE (Existing Dukaandar Login)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Galat Email ya Password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Galat Email ya Password' });
    }

    const token = jwt.encode({ userId: user._id }, JWT_SECRET);
    res.json({ 
      success: true, 
      token, 
      user: { id: user._id, shopName: user.shopName, ownerName: user.ownerName, email: user.email } 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;