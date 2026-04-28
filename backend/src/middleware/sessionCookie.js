// Helpers for setting / clearing the httpOnly session cookie.
//
// Cookie name is `auth_token`. Stored value is the Supabase access
// token JWT — we don't issue our own session id, we just shuttle
// Supabase's token in a safer container. Clearing the cookie
// (logout) is a frontend signal; the server-side session is killed
// separately via supabase.auth.admin.signOut.

const COOKIE_NAME = 'auth_token';
const ONE_HOUR_MS = 60 * 60 * 1000;

function setSessionCookie(res, token, maxAgeMs = ONE_HOUR_MS) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: maxAgeMs,
    path: '/',
  });
}

function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  });
}

module.exports = { COOKIE_NAME, setSessionCookie, clearSessionCookie };
