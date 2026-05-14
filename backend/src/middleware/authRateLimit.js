// Brute-force protection for auth endpoints.
//
// Backed by `rateLimitStore` — Redis when REDIS_URL is set, otherwise
// in-memory. Each limiter takes a `key` function that decides what to
// bucket on:
//
//   - IP-only is the cheap floor (catches spray attacks).
//   - Email-keyed buckets catch targeted attacks against one account
//     from a botnet (where rotating IPs would defeat IP-only limits).
//
// Endpoints that take an email always use BOTH: an IP cap and an
// email cap. Whichever trips first 429s.

const { check } = require('../services/rateLimitStore');

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function getIp(req) {
  return req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
}

function getEmail(req) {
  const raw = (req.body && typeof req.body.email === 'string' && req.body.email) || '';
  return raw.trim().toLowerCase() || null;
}

// Build a middleware that runs one or more keyed checks. If any one
// of them is over the limit, we 429 with the largest retry-after.
function build({ buckets }) {
  return async (req, res, next) => {
    let denied = null;
    for (const bucket of buckets) {
      const key = bucket.key(req);
      if (!key) continue;
      try {
        const result = await check(`${bucket.name}:${key}`, WINDOW_MS, bucket.max);
        if (!result.allowed) {
          if (!denied || result.retryAfterSec > denied.retryAfterSec) denied = result;
        }
      } catch (err) {
        console.error('[authRateLimit] check failed', err);
      }
    }
    if (denied) {
      res.set('Retry-After', String(denied.retryAfterSec));
      return res.status(429).json({
        error: 'Too many attempts. Please wait a few minutes and try again.',
        code: 'rate_limited',
        retry_after_seconds: denied.retryAfterSec,
      });
    }
    return next();
  };
}

const ipBucket = (name, max) => ({ name: `ip:${name}`, key: getIp, max });
const emailBucket = (name, max) => ({ name: `email:${name}`, key: getEmail, max });

const loginLimiter = build({
  buckets: [ipBucket('login', 10), emailBucket('login', 5)],
});

const registerLimiter = build({
  buckets: [ipBucket('register', 15), emailBucket('register', 5)],
});

const forgotPasswordLimiter = build({
  buckets: [ipBucket('forgot', 5), emailBucket('forgot', 3)],
});

const resendVerificationLimiter = build({
  buckets: [ipBucket('resend', 5), emailBucket('resend', 3)],
});

// Reset-password is keyed by IP only because the request body holds
// a one-time recovery token, not an email — and that token can be
// cycled by re-requesting forgot-password (already rate limited).
const resetPasswordLimiter = build({
  buckets: [ipBucket('reset', 10)],
});

const mfaChallengeLimiter = build({
  buckets: [ipBucket('mfa-challenge', 10)],
});

const mfaVerifyLimiter = build({
  buckets: [ipBucket('mfa-verify', 10)],
});

module.exports = {
  loginLimiter,
  registerLimiter,
  forgotPasswordLimiter,
  resendVerificationLimiter,
  resetPasswordLimiter,
  mfaChallengeLimiter,
  mfaVerifyLimiter,
};
