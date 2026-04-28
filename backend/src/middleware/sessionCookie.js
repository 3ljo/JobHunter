// Helpers for setting / clearing the httpOnly session cookie.
//
// Cookie name is `auth_token`. Stored value is the Supabase access
// token JWT — we don't issue our own session id, we just shuttle
// Supabase's token in a safer container.
//
// Cookie attributes are derived from `req.secure` (which honors the
// `trust proxy` setting set in index.js), NOT from NODE_ENV. Reason:
// in production the frontend (e.g. cvclimber.lol) and backend
// (jobhunter-...onrender.com) are cross-site, so the browser will
// only send the cookie on subsequent XHR if it's `SameSite=None`;
// `SameSite=None` requires `Secure`, which only makes sense over
// HTTPS. `req.secure` reflects the *actual* TLS state, so it gives
// the right answer regardless of whether NODE_ENV is set.

const COOKIE_NAME = 'auth_token';
const ONE_HOUR_MS = 60 * 60 * 1000;

function cookieAttrs(req) {
  const isHttps = !!req?.secure;
  return {
    secure: isHttps,
    sameSite: isHttps ? 'none' : 'lax',
  };
}

function setSessionCookie(req, res, token, maxAgeMs = ONE_HOUR_MS) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    ...cookieAttrs(req),
    maxAge: maxAgeMs,
    path: '/',
  });
}

function clearSessionCookie(req, res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    ...cookieAttrs(req),
    path: '/',
  });
}

module.exports = { COOKIE_NAME, setSessionCookie, clearSessionCookie };
