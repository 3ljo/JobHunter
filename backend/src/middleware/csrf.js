// Double-submit cookie CSRF protection.
//
// On any state-changing request authenticated by cookie, we require
// a header `X-CSRF-Token` whose value matches the `csrf_token`
// cookie. The cookie is readable by JS (NOT httpOnly) so the SPA
// can echo it on each request; an attacker on a different origin
// can't read the cookie due to the Same-Origin Policy and so can't
// forge the header.
//
// Requests authenticated only via the Authorization header are
// exempt — header-based auth isn't subject to CSRF because the
// browser doesn't auto-attach Authorization headers cross-origin.
//
// Safe (idempotent) methods are always exempt.

const crypto = require('crypto');

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const COOKIE_NAME = 'csrf_token';
const HEADER_NAME = 'x-csrf-token';
const COOKIE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days, matches access token rotation cadence

function generate() {
  return crypto.randomBytes(32).toString('base64url');
}

// Issue a fresh CSRF cookie. Called from /login and /logout.
function issueCookie(res) {
  const token = generate();
  res.cookie(COOKIE_NAME, token, {
    httpOnly: false, // JS must read it to echo on requests
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: COOKIE_TTL_MS,
    path: '/',
  });
  return token;
}

function clearCookie(res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  });
}

// Constant-time compare to avoid leaking the token through a timing
// side channel during forgery attempts.
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

function csrfMiddleware(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();

  // Only enforce when the request is authenticated by cookie. If
  // the Authorization header is present, we treat that as an
  // explicit token and skip CSRF (CSRF requires the browser to
  // implicitly attach credentials, which it does for cookies but
  // not for Authorization headers).
  const usedCookieAuth =
    !req.headers.authorization && req.cookies && req.cookies.auth_token;
  if (!usedCookieAuth) return next();

  const cookieToken = req.cookies[COOKIE_NAME];
  const headerToken = req.headers[HEADER_NAME];
  if (!cookieToken || !headerToken || !safeEqual(cookieToken, headerToken)) {
    return res.status(403).json({ error: 'CSRF token mismatch', code: 'csrf_failed' });
  }
  return next();
}

module.exports = { csrfMiddleware, issueCookie, clearCookie, COOKIE_NAME };
