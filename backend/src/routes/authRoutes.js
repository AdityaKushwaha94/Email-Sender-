const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Base auth route
router.get('/', (req, res) => {
  res.json({ 
    message: 'Auth API is working',
    endpoints: {
      health: '/api/auth/health',
      google: '/api/auth/google',
      googleCallback: '/api/auth/google/callback',
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      me: 'GET /api/auth/me',
      logout: 'POST /api/auth/logout'
    },
    timestamp: new Date().toISOString()
  });
});

// Health check for auth routes
router.get('/health', (req, res) => {
  res.json({ 
    message: 'Auth routes are working',
    timestamp: new Date().toISOString(),
    origin: req.get('origin')
  });
});

// Google OAuth configuration test
router.get('/google/config', (req, res) => {
  res.json({
    hasClientId: !!process.env.GOOGLE_CLIENT_ID,
    hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL,
    frontendUrl: process.env.FRONTEND_URL,
    backendUrl: process.env.BACKEND_URL,
    jwtSecretExists: !!process.env.JWT_SECRET
  });
});

router.get('/google', (req, res, next) => {
  try {
    console.log('Google OAuth initiation requested');
    console.log('GOOGLE_CLIENT_ID exists:', !!process.env.GOOGLE_CLIENT_ID);
    console.log('GOOGLE_CLIENT_SECRET exists:', !!process.env.GOOGLE_CLIENT_SECRET);
    console.log('GOOGLE_CALLBACK_URL:', process.env.GOOGLE_CALLBACK_URL);
    
    passport.authenticate('google', {
      scope: ['profile', 'email']
    })(req, res, next);
  } catch (error) {
    console.error('Google OAuth initiation error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_init_failed`);
  }
});

router.get('/google/callback', (req, res, next) => {
  console.log('Google OAuth callback received');
  console.log('Query params:', req.query);
  
  passport.authenticate('google', {
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=auth_failed`
  }, (err, user, info) => {
    if (err) {
      console.error('Google OAuth authentication error:', err);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=auth_error&details=${encodeURIComponent(err.message)}`);
    }
    
    if (!user) {
      console.error('Google OAuth: No user returned', info);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=no_user&info=${encodeURIComponent(JSON.stringify(info))}`);
    }
    
    // Manual login since we're using custom callback
    req.logIn(user, (loginErr) => {
      if (loginErr) {
        console.error('Login error after OAuth:', loginErr);
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=login_failed`);
      }
      
      try {
        console.log('Google OAuth successful for user:', user.email);
        
        if (!process.env.JWT_SECRET) {
          console.error('JWT_SECRET not found in environment variables');
          return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=config_error`);
        }
    
        const token = jwt.sign(
          { userId: user._id },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );
        
        const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?token=${token}`;
        console.log('Redirecting to:', redirectUrl);
        
        res.redirect(redirectUrl);
      } catch (error) {
        console.error('Token generation error:', error);
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=token_error`);
      }
    });
  })(req, res, next);
});

// Email/Password Registration
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    user = new User({
      email,
      password,
      name
    });
    
    await user.save();
    
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.status(201).json({ token, user: { id: user._id, email: user.email, name: user.name } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Email/Password Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    if (user.isBlacklisted) {
      return res.status(403).json({ error: 'Your account has been blacklisted' });
    }
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({ token, user: { id: user._id, email: user.email, name: user.name } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

module.exports = router;
