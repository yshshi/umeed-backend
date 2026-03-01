/**
 * Simple in-memory rate limiter for auth routes
 * For production consider redis-based rate limiting
 */
const store = new Map();
const WINDOW_MS = 15 * 60 * 1000; // 15 min
const MAX_REQUESTS = 50;

const rateLimiter = (req, res, next) => {
  const key = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  if (!store.has(key)) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }
  const entry = store.get(key);
  if (now > entry.resetAt) {
    entry.count = 1;
    entry.resetAt = now + WINDOW_MS;
    return next();
  }
  entry.count++;
  if (entry.count > MAX_REQUESTS) {
    return res.status(429).json({ success: false, message: 'Too many requests. Try again later.' });
  }
  next();
};

module.exports = rateLimiter;
