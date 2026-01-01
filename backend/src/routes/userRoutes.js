const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Update email credentials
router.put('/email-credentials', auth, async (req, res) => {
  try {
    const { smtpHost, smtpPort, senderEmail, senderPassword } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        emailCredentials: {
          smtpHost,
          smtpPort,
          senderEmail,
          senderPassword
        }
      },
      { new: true }
    );
    
    res.json({ message: 'Email credentials updated', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Blacklist user (requires admin privileges)
router.put('/:userId/blacklist', auth, async (req, res) => {
  try {
    // Check if requesting user is admin (you'll need to implement admin role)
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { isBlacklisted: true },
      { new: true }
    );
    
    res.json({ message: 'User blacklisted', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
