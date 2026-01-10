const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const auth = require('../middleware/auth');
const User = require('../models/User');
const { generateOTPWithExpiry, sendOTPEmail } = require('../utils/otpUtils');

const router = express.Router();

// Rate limiting for email verification
const verificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 verification requests per windowMs
  message: { error: 'Too many verification attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log(`Rate limit exceeded for IP: ${req.ip}, User: ${req.userId || 'unknown'}`);
    res.status(429).json({
      error: 'Too many verification attempts, please try again later',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// Validation middleware
const emailValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage('Please provide a valid email address')
];

const otpValidation = [
  body('otp')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('Please provide a valid 6-digit OTP')
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

// Get user's email verification status
router.get('/status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    res.json({
      hasEmailCredentials: !!(user.emailCredentials?.senderEmail),
      isVerified: user.emailCredentials?.isVerified || false,
      verifiedAt: user.emailCredentials?.verifiedAt,
      senderEmail: user.emailCredentials?.senderEmail,
      canAttemptVerification: user.canAttemptVerification(),
      verificationAttempts: user.emailVerification?.verificationAttempts || 0
    });
  } catch (error) {
    res.status(500).json({
      error: process.env.NODE_ENV === 'development' ? error.message : 'Failed to get verification status'
    });
  }
});

// Test email configuration endpoint (for debugging)
router.get('/test-email', auth, async (req, res) => {
  try {
    // Check environment variables
    const hasEmailUser = !!process.env.EMAIL_USER;
    const hasEmailPassword = !!process.env.EMAIL_PASSWORD;
    
    if (!hasEmailUser || !hasEmailPassword) {
      return res.status(500).json({
        error: 'Email credentials not configured',
        details: {
          EMAIL_USER: hasEmailUser ? 'configured' : 'missing',
          EMAIL_PASSWORD: hasEmailPassword ? 'configured' : 'missing'
        }
      });
    }
    
    const nodemailer = require('nodemailer');
    
    // Test transporter configuration
    const transport = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
    
    // Verify connection
    await transport.verify();
    
    res.json({
      message: 'Email configuration is working properly',
      emailUser: process.env.EMAIL_USER,
      status: 'ready'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Email configuration test failed',
      details: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        code: error.code,
        command: error.command
      } : 'Please check server logs'
    });
  }
});

// Step 1: Submit email and send OTP
router.post('/send-otp', verificationLimiter, auth, emailValidation, handleValidationErrors, async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findById(req.userId).select('+emailVerification.otpExpiry');

    if (!user) {
      return res.status(404).json({
        error: 'User not found. Please login again.'
      });
    }

    // Check if user can attempt verification
    if (!user.canAttemptVerification()) {
      return res.status(429).json({
        error: 'Too many verification attempts. Please try again in 15 minutes.'
      });
    }

    // Check if there's a valid OTP still active (within last 2 minutes to prevent spam)
    const now = new Date();
    if (user.emailVerification?.otpExpiry && user.emailVerification.otpExpiry > now) {
      const timeRemaining = Math.ceil((user.emailVerification.otpExpiry - now) / 1000 / 60);
      if (timeRemaining > 3) { // If more than 3 minutes remaining, don't send new OTP
        return res.status(429).json({
          error: `OTP already sent. Please wait ${timeRemaining} minutes before requesting a new one, or use the resend option.`
        });
      }
    }

    // Generate OTP
    const { otp, expiry } = generateOTPWithExpiry();

    // Save email (not verified yet)
    user.emailCredentials = {
      senderEmail: email,
      isVerified: false
    };

    // Save OTP
    await user.setEmailVerificationOTP(otp, expiry);

    // Send OTP to user's email using system email
    const emailSent = await sendOTPEmail(email, otp, user.name || 'User');
    if (!emailSent) {
      return res.status(500).json({
        error: 'Failed to send verification email. Please try again.'
      });
    }

    res.json({
      message: 'OTP sent successfully to your email address',
      email: email,
      expiresIn: '5 minutes'
    });

  } catch (error) {
    console.error('Send OTP error:', error.message);
    
    
    res.status(500).json({
      error: 'Failed to send OTP. Please try again.'
    });
  }
});

// Step 2: Verify OTP and confirm email credentials
router.post('/verify-otp', verificationLimiter, auth, otpValidation, handleValidationErrors, async (req, res) => {
  try {
    const { otp } = req.body;
    const user = await User.findById(req.userId).select('+emailVerification.otp +emailVerification.otpExpiry');

    // Check if user can attempt verification
    if (!user.canAttemptVerification()) {
      return res.status(429).json({
        error: 'Too many verification attempts. Please try again in 15 minutes.'
      });
    }

    // Verify OTP
    if (!user.verifyEmailOTP(otp)) {
      await user.incrementVerificationAttempts();
      return res.status(400).json({
        error: 'Invalid or expired OTP. Please request a new one.'
      });
    }

    // Mark email as verified
    await user.markEmailAsVerified();

    res.json({
      message: 'Email verified successfully! You can now send emails.',
      emailCredentials: {
        senderEmail: user.emailCredentials.senderEmail,
        isVerified: true,
        verifiedAt: user.emailCredentials.verifiedAt
      }
    });

  } catch (error) {
    res.status(500).json({
      error: process.env.NODE_ENV === 'development' ? error.message : 'Failed to verify OTP'
    });
  }
});

// Resend OTP
router.post('/resend-otp', verificationLimiter, auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user.emailCredentials?.senderEmail) {
      return res.status(400).json({
        error: 'No email found. Please submit your email address first.'
      });
    }

    if (user.emailCredentials.isVerified) {
      return res.status(400).json({
        error: 'Email is already verified.'
      });
    }

    // Check if user can attempt verification
    if (!user.canAttemptVerification()) {
      return res.status(429).json({
        error: 'Too many verification attempts. Please try again in 15 minutes.'
      });
    }

    // Generate new OTP
    const { otp, expiry } = generateOTPWithExpiry();
    await user.setEmailVerificationOTP(otp, expiry);

    // Send OTP
    const emailSent = await sendOTPEmail(user.emailCredentials.senderEmail, otp, user.name);
    if (!emailSent) {
      return res.status(500).json({
        error: 'Failed to resend verification email. Please check your email address and try again.'
      });
    }

    res.json({
      message: 'OTP resent successfully',
      email: user.emailCredentials.senderEmail,
      expiresIn: '5 minutes'
    });

  } catch (error) {
    res.status(500).json({
      error: process.env.NODE_ENV === 'development' ? error.message : 'Failed to resend OTP'
    });
  }
});

// Remove/Reset email credentials
router.delete('/remove', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    user.emailCredentials = {
      senderEmail: undefined,
      isVerified: false,
      verifiedAt: undefined
    };

    user.emailVerification = {
      otp: undefined,
      otpExpiry: undefined,
      verificationAttempts: 0,
      lastVerificationAttempt: undefined
    };

    await user.save();

    res.json({
      message: 'Email credentials removed successfully'
    });

  } catch (error) {
    res.status(500).json({
      error: process.env.NODE_ENV === 'development' ? error.message : 'Failed to remove email credentials'
    });
  }
});

// Quick debug endpoint to test email service in isolation
// ...existing code...

// Quick debug endpoint to test email service in isolation
router.get('/debug-email-service', auth, async (req, res) => {
  try {
    console.log('[DEBUG] Email service debug request initiated...');
    
    // Check environment variables
    const emailEnv = {
      EMAIL_USER: process.env.EMAIL_USER || 'NOT_SET',
      EMAIL_PASSWORD_LENGTH: process.env.EMAIL_PASSWORD?.length || 0,
      NODE_ENV: process.env.NODE_ENV || 'NOT_SET'
    };
    
    console.log('[DEBUG] Environment check:', emailEnv);
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      return res.status(500).json({
        error: 'Email credentials not configured in environment',
        details: emailEnv
      });
    }

    const nodemailer = require('nodemailer');

    const transport = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      connectionTimeout: 10000,
      socketTimeout: 10000
    });

    console.log('[DEBUG] Testing connection...');
    await transport.verify();
    console.log('[DEBUG] Connection successful');

    res.json({
      message: 'Email service is working properly',
      environment: emailEnv,
      status: 'connection_verified'
    });

  } catch (error) {
    console.error('[DEBUG] Email service error:', error);
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Test send email endpoint
router.post('/test-send-email', auth, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const { otp } = generateOTPWithExpiry();
    console.log('Attempting to send email to:', email);
    console.log('Generated OTP:', otp);
    
    const emailSent = await sendOTPEmail(email, otp, 'Test User');
    
    if (emailSent) {
      res.json({ 
        message: 'Test email sent successfully', 
        email: email,
        otp: otp, // Include OTP for testing purposes
        timestamp: new Date()
      });
    } else {
      res.status(500).json({ error: 'Failed to send test email' });
    }
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ...existing code...

module.exports = router;