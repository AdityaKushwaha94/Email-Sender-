const Redis = require('ioredis');
const Bull = require('bull');

// Redis connection
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

let redis = null;
let emailQueue = null;

// Function to safely create Redis connection
async function createRedisConnection() {
  try {
    const testRedis = new Redis(redisUrl, {
      maxRetriesPerRequest: 0, // Disable retries to fail fast
      retryDelayOnFailover: 100,
      connectTimeout: 2000,
      lazyConnect: true,
      enableReadyCheck: false,
    });

    // Test connection
    await testRedis.ping();
    
    // If ping succeeds, create the actual Redis instance
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      connectTimeout: 5000,
      lazyConnect: false,
    });

    // Create email queue
    emailQueue = new Bull('email processing', redisUrl, {
      redis: {
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        connectTimeout: 5000,
      },
      defaultJobOptions: {
        removeOnComplete: 10,
        removeOnFail: 20,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    });

    redis.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });

    redis.on('error', (err) => {
      console.warn('⚠️ Redis connection error, disabling Redis:', err.message);
      redis = null;
      emailQueue = null;
    });

    emailQueue.on('ready', () => {
      console.log('📧 Email queue is ready');
    });

    emailQueue.on('error', (err) => {
      console.warn('📧 Email queue error, disabling queue:', err.message);
      emailQueue = null;
    });

    await testRedis.disconnect();
    console.log('✅ Redis connection test successful, Redis enabled');
    
  } catch (error) {
    console.warn('⚠️ Redis connection failed, running without Redis:', error.message);
    redis = null;
    emailQueue = null;
  }
}

// Initialize Redis connection (but don't await it to avoid blocking server startup)
createRedisConnection().catch(() => {
  console.warn('⚠️ Redis initialization failed, continuing without Redis');
});

module.exports = {
  redis,
  emailQueue,
  redisUrl,
  // Helper function to check if Redis is available
  isRedisAvailable: () => redis !== null,
  // Helper function to get Redis connection safely
  getRedis: () => redis,
  // Helper function to get email queue safely
  getEmailQueue: () => emailQueue
};