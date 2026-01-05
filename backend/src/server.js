const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
require('dotenv').config();

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  if (process.env.NODE_ENV === 'development') {
    console.error('Uncaught Exception:', err);
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  if (process.env.NODE_ENV === 'development') {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  }
  process.exit(1);
});

const { getRedis, getEmailQueue, isRedisAvailable } = require('../config/redis');

const authRoutes = require('./routes/authRoutes');
const emailRoutes = require('./routes/emailRoutes');
const userRoutes = require('./routes/userRoutes');
const { checkRedisHealth } = require('./utils/redisUtils');

const app = express();
app.set("trust proxy", 1);

// Security Headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// Compression middleware
app.use(compression());

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.ip === '127.0.0.1' || req.ip === '::1' // Skip for localhost in development
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit authentication attempts
  message: { error: 'Too many authentication attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 email campaigns per hour
  message: { error: 'Email limit exceeded, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);
app.use('/api/auth', authLimiter);
app.use('/api/emails/campaigns', emailLimiter);

// Input sanitization and security
app.use(mongoSanitize()); // Prevent NoSQL injection
app.use(hpp()); // Prevent HTTP Parameter Pollution

// CORS for local development
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

// Session Configuration with enhanced security
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'your_session_secret',
  resave: false,
  saveUninitialized: false,
  name: 'sessionId', // Change default session name
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax'
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

try {
  require('../config/passport');
  console.log('✅ Passport configuration loaded');
} catch (error) {
  console.error('❌ Passport configuration error:', error.message);
}

// MongoDB Connection
async function connectMongoDB() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/email-sender';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });
    console.log('✅ MongoDB connected successfully');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
}

connectMongoDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/users', userRoutes);

// Root route - API status
app.get('/', (req, res) => {
  res.json({
    message: 'Email Sender API is running locally!',
    status: 'healthy',
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    timestamp: new Date(),
    security: {
      helmet: '✅ Enabled',
      rateLimit: '✅ Enabled',
      mongoSanitize: '✅ Enabled',
      compression: '✅ Enabled'
    },
    endpoints: {
      auth: '/api/auth',
      emails: '/api/emails',
      users: '/api/users',
      health: '/health'
    }
  });
});

// Serve frontend routes (local development)
app.get('/dashboard', (req, res) => {
  res.redirect('http://localhost:3000/dashboard');
});

app.get('/login', (req, res) => {
  res.redirect('http://localhost:3000/login');
});

// Health check
app.get('/health', async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const dbStatus = dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : 'disconnected';
    
    let redisHealth = 'Not configured';
    if (isRedisAvailable()) {
      redisHealth = await checkRedisHealth();
    }
    
    res.json({ 
      status: 'healthy',
      database: dbStatus,
      redis: redisHealth,
      uptime: Math.floor(process.uptime()),
      memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal error'
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    method: req.method,
    path: req.originalUrl
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err.message);
    res.status(statusCode).json({ 
      error: err.message,
      stack: err.stack,
      path: req.path
    });
  } else {
    res.status(statusCode).json({ 
      error: statusCode === 500 ? 'Internal Server Error' : err.message
    });
  }
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🔒 Security features enabled: Helmet, Rate Limiting, Input Sanitization`);
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔗 Frontend: http://localhost:3000`);
    console.log(`🔗 Backend: http://localhost:${PORT}`);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🚫 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('💫 Process terminated');
    process.exit(0);
  });
});

module.exports = app;
