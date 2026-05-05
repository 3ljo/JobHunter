// Per-IP rate limiter for the public chatbot endpoint.
// Backed by rateLimitStore (Redis if REDIS_URL is set, in-memory otherwise).
// Cap is generous enough for a real conversation but blocks scrapers
// and runaway clients before they cost us real AI tokens.

const { check } = require('../services/rateLimitStore');

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_HITS = 12;         // 12 messages per IP per minute

const getIp = (req) =>
  req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';

const chatbotRateLimit = async (req, res, next) => {
  try {
    const key = `ip:chatbot:${getIp(req)}`;
    const result = await check(key, WINDOW_MS, MAX_HITS);
    if (!result.allowed) {
      res.set('Retry-After', String(result.retryAfterSec));
      return res.status(429).json({
        error: 'Too many messages. Please slow down for a moment.',
        code: 'rate_limited',
        retry_after_seconds: result.retryAfterSec,
      });
    }
    return next();
  } catch (err) {
    console.error('[chatbotRateLimit] check failed', err);
    // Fail open on internal limiter errors — chatbot is non-critical
    // and we don't want a Redis blip to take it offline entirely.
    return next();
  }
};

module.exports = chatbotRateLimit;
