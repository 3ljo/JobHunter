// Brute-force protection for auth endpoints.
//
// In-memory rolling window — NOT a cluster-safe store. On a single
// Render instance (which is the current setup) this gets us a cheap
// floor on credential stuffing / email enumeration / verify-email
// spam. If the backend ever scales to multiple instances, swap the
// Map for Redis before counting on this.
//
// Keyed by IP. We intentionally don't key by email (an attacker can
// rotate emails; IP is the actual cost center). Trust-proxy is set
// in index.js so req.ip is the real client IP, not the Render LB.

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const hits = new Map(); // ip -> [{ ts }]

function clean(ip, now) {
  const list = hits.get(ip);
  if (!list) return [];
  const fresh = list.filter((h) => now - h.ts < WINDOW_MS);
  if (fresh.length === 0) hits.delete(ip);
  else hits.set(ip, fresh);
  return fresh;
}

function keyFor(req) {
  // Fall back to a stable placeholder when req.ip is undefined (e.g.
  // trust-proxy misconfigured in local dev) so we don't collapse all
  // anon calls into the same bucket.
  return req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
}

// Create a limiter with a maximum number of hits per window.
function createAuthRateLimit(maxHits) {
  return (req, res, next) => {
    const ip = keyFor(req);
    const now = Date.now();
    const list = clean(ip, now);
    if (list.length >= maxHits) {
      const oldest = list[0].ts;
      const retryAfterSec = Math.ceil((WINDOW_MS - (now - oldest)) / 1000);
      res.set('Retry-After', String(retryAfterSec));
      return res.status(429).json({
        error: 'Too many attempts. Please wait a few minutes and try again.',
        code: 'rate_limited',
        retry_after_seconds: retryAfterSec,
      });
    }
    list.push({ ts: now });
    hits.set(ip, list);
    next();
  };
}

// Ten hits per 15 minutes on failed flows (login / forgot-password /
// resend-verification). Password reset is capped tighter because it
// sends email — abusing it wastes our Supabase quota and annoys users.
const loginLimiter = createAuthRateLimit(10);
const registerLimiter = createAuthRateLimit(15);
const forgotPasswordLimiter = createAuthRateLimit(5);
const resendVerificationLimiter = createAuthRateLimit(5);
const resetPasswordLimiter = createAuthRateLimit(10);

module.exports = {
  loginLimiter,
  registerLimiter,
  forgotPasswordLimiter,
  resendVerificationLimiter,
  resetPasswordLimiter,
};
