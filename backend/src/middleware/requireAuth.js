// Authentication middleware.
//
// Accepts the Supabase access token from EITHER:
//   1. an httpOnly `auth_token` cookie (preferred; XSS-safer), OR
//   2. an `Authorization: Bearer <token>` header (legacy/native-client path).
//
// Validates with Supabase, attaches `req.user` and `req.accessToken`
// (the raw JWT — needed by controllers that build a per-request
// user-scoped Supabase client to keep RLS enforced).

const supabase = require('../services/supabaseClient');
const { getAal } = require('../utils/jwtClaims');

function extractToken(req) {
  if (req.cookies && req.cookies.auth_token) return req.cookies.auth_token;
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) return header.slice(7);
  return null;
}

const requireAuth = async (req, res, next) => {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    req.user = data.user;
    req.accessToken = token;
    req.aal = getAal(token); // 'aal1' | 'aal2'
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

// Gate endpoints that require a user with MFA enrolled to have just
// re-cleared the MFA challenge (aal2). Use on irreversible ops:
// password change, account delete, MFA factor removal.
const requireAal2 = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  // Honor next-aal: if the user has a verified MFA factor, the JWT
  // will signal aal2 only after a fresh challenge. If the user has
  // no factor enrolled, aal1 is the highest possible — we don't
  // block them retroactively.
  const hasFactor = (req.user.factors || []).some(
    (f) => f.factor_type === 'totp' && f.status === 'verified'
  );
  if (hasFactor && req.aal !== 'aal2') {
    return res.status(403).json({
      error: 'Multi-factor re-authentication required',
      code: 'mfa_required',
    });
  }
  return next();
};

module.exports = requireAuth;
module.exports.requireAuth = requireAuth;
module.exports.requireAal2 = requireAal2;
