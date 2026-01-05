const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const path = require('path');
require('dotenv').config();

const { getRedis, getEmailQueue, isRedisAvailable } = require('../config/redis');

const authRoutes = require('./routes/authRoutes');
const emailRoutes = require('./routes/emailRoutes');
const userRoutes = require('./routes/userRoutes');
const { checkRedisHealth } = require('./utils/redisUtils');

const app = express();
app.set("trust proxy", 1);

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 email campaigns per hour
  message: 'Too many email campaigns, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);
app.use('/api/emails/campaigns', emailLimiter);

// Middleware
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000'
  ],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '../../frontend')));

// Session Configuration with Redis Store (if available)

const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'your_session_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
};

if (isRedisAvailable()) {
  sessionConfig.store = new RedisStore({ client: getRedis() });
  console.log('✅ Using Redis for session storage');
} else {
  console.warn('⚠️ Redis not available, using memory store for sessions (not suitable for production)');
}

app.use(session(sessionConfig));

// Passport Initialization
app.use(passport.initialize());
app.use(passport.session());
require('../config/passport');

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/email-sender')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/users', userRoutes);

// Root route - API status
app.get('/', (req, res) => {
  res.json({
    message: 'Email Sender API is running!',
    status: 'healthy',
    timestamp: new Date(),
    endpoints: {
      auth: '/api/auth',
      emails: '/api/emails',
      users: '/api/users',
      health: '/health'
    },
    frontend: process.env.FRONTEND_URL || 'http://localhost:3000'
  });
});

// Serve frontend routes (legacy support)
app.get('/dashboard', (req, res) => {
  res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`);
});

app.get('/login', (req, res) => {
  res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`);
});

// Health check
app.get('/health', async (req, res) => {
  try {
    let redisHealth = 'Redis not configured';
    if (isRedisAvailable()) {
      redisHealth = await checkRedisHealth();
    }
    
    res.json({ 
      status: 'Server is running',
      redis: redisHealth,
      timestamp: new Date(),
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'Server error',
      error: error.message 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {

  
  // Send different responses based on environment
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({ error: 'Internal Server Error' });
  } else {
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: err.message,
      stack: err.stack 
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
