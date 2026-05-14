// Helpers for setting / clearing the httpOnly session cookie.
//
// Cookie name is `auth_token`. Stored value is the Supabase access
// token JWT — we don't issue our own session id, we just shuttle
// Supabase's token in a safer container.
//
// Cookie attributes need to flip to `Secure; SameSite=None` whenever
// the request is HTTPS, otherwise cross-site XHR from the SPA
// (cvclimber.lol → jobhunter-...onrender.com) drops the cookie and
// the user gets bounced to /login the moment the dashboard fires its
// first authenticated request.
//
// Detecting HTTPS reliably on a hosted platform is fiddly: a single
// broken signal silently downgrades us to Lax. We OR several:
//
//   1. `req.secure` — Express's check; needs `trust proxy` AND a
//      proxy that forwards `X-Forwarded-Proto`.
//   2. Direct `X-Forwarded-Proto` header read — survives a
//      misconfigured `trust proxy`.
//   3. `NODE_ENV === 'production'` — last-resort fallback for hosts
//      that strip headers but set the env (the inverse of the bug
//      that prompted the previous fix).
//   4. `COOKIE_CROSS_SITE=true` — explicit operator override; set
//      this on Render to remove all ambiguity.

const COOKIE_NAME = 'auth_token';
const ONE_HOUR_MS = 60 * 60 * 1000;

function cookieAttrs(req) {
  const xfProto = (req?.headers?.['x-forwarded-proto'] || '')
    .toString()
    .split(',')[0]
    .trim()
    .toLowerCase();
  const isHttps =
    !!req?.secure ||
    xfProto === 'https' ||
    process.env.NODE_ENV === 'production' ||
    process.env.COOKIE_CROSS_SITE === 'true';
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
