const { redis } = require('../../config/redis');

// Cache user session data
const cacheUserSession = async (userId, userData, ttl = 3600) => {
  try {
    const key = `user:${userId}:session`;
    await redis.setex(key, ttl, JSON.stringify(userData));
    console.log(`✅ Cached user session for user ${userId}`);
  } catch (error) {
    console.error('Error caching user session:', error);
  }
};

// Get cached user session
const getCachedUserSession = async (userId) => {
  try {
    const key = `user:${userId}:session`;
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting cached user session:', error);
    return null;
  }
};

// Set rate limiting data
const setRateLimit = async (key, value, ttl = 3600) => {
  try {
    await redis.setex(`rate_limit:${key}`, ttl, value);
  } catch (error) {
    console.error('Error setting rate limit:', error);
  }
};

// Get rate limiting data
const getRateLimit = async (key) => {
  try {
    const value = await redis.get(`rate_limit:${key}`);
    return value ? parseInt(value) : 0;
  } catch (error) {
    console.error('Error getting rate limit:', error);
    return 0;
  }
};

// Increment rate limit counter
const incrementRateLimit = async (key, ttl = 3600) => {
  try {
    const current = await redis.incr(`rate_limit:${key}`);
    if (current === 1) {
      await redis.expire(`rate_limit:${key}`, ttl);
    }
    return current;
  } catch (error) {
    console.error('Error incrementing rate limit:', error);
    return 0;
  }
};

// Cache campaign statistics
const cacheCampaignStats = async (campaignId, stats, ttl = 300) => {
  try {
    const key = `campaign:${campaignId}:stats`;
    await redis.setex(key, ttl, JSON.stringify(stats));
  } catch (error) {
    console.error('Error caching campaign stats:', error);
  }
};

// Get cached campaign statistics
const getCachedCampaignStats = async (campaignId) => {
  try {
    const key = `campaign:${campaignId}:stats`;
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting cached campaign stats:', error);
    return null;
  }
};

// Store email tracking data
const storeEmailTracking = async (campaignId, recipientEmail, event, data = {}) => {
  try {
    const key = `tracking:${campaignId}:${recipientEmail}:${event}`;
    const trackingData = {
      event,
      timestamp: new Date().toISOString(),
      ...data
    };
    await redis.setex(key, 86400 * 7, JSON.stringify(trackingData)); // 7 days TTL
  } catch (error) {
    console.error('Error storing email tracking:', error);
  }
};

// Get email tracking data
const getEmailTracking = async (campaignId, recipientEmail = null) => {
  try {
    const pattern = recipientEmail 
      ? `tracking:${campaignId}:${recipientEmail}:*` 
      : `tracking:${campaignId}:*:*`;
    
    const keys = await redis.keys(pattern);
    const trackingData = [];
    
    for (const key of keys) {
      const data = await redis.get(key);
      if (data) {
        trackingData.push(JSON.parse(data));
      }
    }
    
    return trackingData;
  } catch (error) {
    console.error('Error getting email tracking:', error);
    return [];
  }
};

// Clear cache for a specific pattern
const clearCache = async (pattern) => {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(` Cleared ${keys.length} cache entries for pattern: ${pattern}`);
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};

// Check Redis health
const checkRedisHealth = async () => {
  try {
    await redis.ping();
    return { status: 'healthy', timestamp: new Date() };
  } catch (error) {
    return { status: 'unhealthy', error: error.message, timestamp: new Date() };
  }
};

module.exports = {
  cacheUserSession,
  getCachedUserSession,
  setRateLimit,
  getRateLimit,
  incrementRateLimit,
  cacheCampaignStats,
  getCachedCampaignStats,
  storeEmailTracking,
  getEmailTracking,
  clearCache,
  checkRedisHealth
};