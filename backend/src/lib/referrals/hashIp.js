// SHA256 hash of the client IP + REFERRAL_SALT. Stored in referrals.ip_address_hash
// to detect self-referral (same IP trying to refer itself) without retaining
// the plaintext IP. If REFERRAL_SALT is missing, returns null — callers should
// tolerate that (degrades fraud detection, doesn't break the flow).
const crypto = require('crypto');

function hashIp(ip) {
  if (!ip) return null;
  const salt = process.env.REFERRAL_SALT;
  if (!salt) return null;
  return crypto.createHash('sha256').update(`${ip}|${salt}`).digest('hex');
}

// Extract the best-guess client IP from the request. Trusts the leftmost
// entry of X-Forwarded-For when present (standard for platform proxies
// like Render, Vercel, Cloudflare), falls back to req.ip.
function getClientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) {
    const first = String(xff).split(',')[0].trim();
    if (first) return first;
  }
  return req.ip || req.connection?.remoteAddress || null;
}

module.exports = { hashIp, getClientIp };
