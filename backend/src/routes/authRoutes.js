const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Base auth route
router.get('/', (req, res) => {
  res.json({ 
    message: 'Authentication API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health: 'GET /api/auth/health',
      google: 'GET /api/auth/google',
      googleCallback: 'GET /api/auth/google/callback',
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
    status: 'healthy',
    service: 'authentication',
    timestamp: new Date().toISOString()
  });
});

router.get('/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/login?error=oauth_not_configured`);
  }
  
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  
  passport.authenticate('google', {
    failureRedirect: `${frontendUrl}/login?error=auth_failed`
  }, (err, user, info) => {
    if (err) {
      return res.redirect(`${frontendUrl}/login?error=auth_error`);
    }
    
    if (!user) {
      return res.redirect(`${frontendUrl}/login?error=auth_failed`);
    }
    
    req.logIn(user, (loginErr) => {
      if (loginErr) {
        return res.redirect(`${frontendUrl}/login?error=login_failed`);
      }
      
      try {
        const token = jwt.sign(
          { userId: user._id },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );
        
        res.redirect(`${frontendUrl}/login?token=${token}`);
      } catch (error) {
        res.redirect(`${frontendUrl}/login?error=token_error`);
      }
    });
  })(req, res, next);
});

// Input validation middleware
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6, max: 128 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
    .withMessage('Password must be 6-128 characters with at least one uppercase, lowercase, and number'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name must be 2-50 characters and contain only letters and spaces')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 1 })
    .withMessage('Password is required')
];

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(err => err.msg)
    });
  }
  next();
};

// Email/Password Registration
router.post('/register', registerValidation, handleValidationErrors, async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists with this email' });
    }
    
    // Create new user
    const user = new User({
      email,
      password,
      name: name.trim()
    });
    
    await user.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Return success response (exclude password)
    res.status(201).json({ 
      token, 
      user: { 
        id: user._id, 
        email: user.email, 
        name: user.name 
      } 
    });
  } catch (error) {
    res.status(500).json({ 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Registration failed' 
    });
  }
});

// Email/Password Login
router.post('/login', loginValidation, handleValidationErrors, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Check if user is blacklisted
    if (user.isBlacklisted) {
      return res.status(403).json({ error: 'Account access denied' });
    }
    
    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Return success response (exclude password)
    res.json({ 
      token, 
      user: { 
        id: user._id, 
        email: user.email, 
        name: user.name 
      } 
    });
  } catch (error) {
    res.status(500).json({ 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Login failed' 
    });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Failed to fetch user data' 
    });
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
