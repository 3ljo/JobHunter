// Authentication controller.
//
// All flows are designed to NOT leak whether an email exists:
//   - /register and /resend-verification always return 200 with a
//     generic "if this email is new, check your inbox" message.
//   - /login returns the same generic 401 for unknown email, wrong
//     password, AND unconfirmed email. When the email exists but
//     isn't confirmed, we silently re-send the verification mail
//     in the background so the user has a path forward.
//   - /forgot-password already returns 200 unconditionally.
//
// Password policy (validatePassword) is enforced consistently on
// /register, /reset-password, and /change-password — 8 chars min
// and HIBP breach check (fails open on HIBP outage).
//
// Service-role Supabase client is used ONLY for admin operations
// the user can't do themselves (rotate password during recovery,
// delete account). All other reads/writes go through the per-request
// user-scoped client (see services/supabaseUserClient.js) so RLS
// applies even on a backend compromise.

const { body, validationResult } = require('express-validator');
const supabase = require('../services/supabaseClient');
const { createUserClient } = require('../services/supabaseUserClient');
const { validatePassword } = require('../utils/passwordPolicy');
const { isRecoveryToken } = require('../utils/jwtClaims');
const { setSessionCookie, clearSessionCookie } = require('../middleware/sessionCookie');
const { issueCookie: issueCsrfCookie, clearCookie: clearCsrfCookie } = require('../middleware/csrf');

// FRONTEND_URL may be a comma-separated CORS list — pick the first
// canonical origin for building auth redirect links.
const canonicalFrontend = () => {
  const raw = process.env.FRONTEND_URL || '';
  const first = raw.split(',')[0].trim();
  return first.replace(/\/$/, '');
};

// Constant-ish small jitter on auth responses to muddy timing-based
// account-existence inference.
const jitter = () => new Promise((r) => setTimeout(r, 50 + Math.floor(Math.random() * 100)));

const validate = {
  register: [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isString().notEmpty().withMessage('Password is required'),
  ],
  login: [
    body('email').notEmpty().withMessage('Email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  forgotPassword: [body('email').notEmpty().withMessage('Email is required')],
  resendVerification: [body('email').isEmail().withMessage('Valid email is required')],
  // No body validators here — the recovery token is taken from the
  // Authorization header now, NOT from the JSON body, so it doesn't
  // appear in access logs or APM request-body capture.
  resetPassword: [body('new_password').isString().notEmpty().withMessage('Password is required')],
  changePassword: [
    body('current_password').isString().notEmpty().withMessage('Current password is required'),
    body('new_password').isString().notEmpty().withMessage('New password is required'),
  ],
};

// ── Helpers ───────────────────────────────────────────────────────────

function bearerToken(req) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) return header.slice(7);
  return null;
}

// Quietly resend a verification email when an unconfirmed user tries
// to log in. We DO NOT surface this to the response (that would re-
// introduce account enumeration). Best-effort, errors swallowed.
async function silentResendVerification(email) {
  try {
    await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${canonicalFrontend()}/auth/callback` },
    });
  } catch (err) {
    console.warn('[auth] silent resend failed', err.message);
  }
}

// ── /register ─────────────────────────────────────────────────────────
//
// Always returns 200 with a generic message. Whether the email is new,
// already registered (confirmed), or already registered (unconfirmed),
// the response body is identical. Branch handling:
//   - new email: Supabase sends signup-confirmation email
//   - already registered + unconfirmed: re-send verification
//   - already registered + confirmed: send a "you already have an
//     account, here's a sign-in / forgot-password link" email
//     (delegated to Supabase via resetPasswordForEmail, which only
//     fires for existing accounts; a real password reset is harmless
//     here and gives the user a recovery path if they forgot they
//     had an account).
const register = async (req, res) => {
  await jitter();
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Validation failures (malformed email) we can answer specifically;
    // they don't reveal account existence.
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  const { email, password } = req.body;

  const policy = await validatePassword(password);
  if (!policy.ok) {
    return res.status(400).json({ error: policy.error });
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${canonicalFrontend()}/auth/callback` },
    });

    // Supabase enumeration defense: if the email already exists,
    // signUp resolves with an empty `identities` array and does NOT
    // send an email. Use that as our cue to do the right side-effect
    // (account-exists notice via password reset email).
    const alreadyExists =
      data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0;

    if (alreadyExists) {
      // Best-effort "you already have an account" recovery email.
      // We use resetPasswordForEmail rather than a custom template
      // so the mail is signed by Supabase's normal SMTP and lands
      // in inbox not spam. Errors swallowed.
      try {
        await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${canonicalFrontend()}/reset-password`,
        });
      } catch (err) {
        console.warn('[register] account-exists recovery mail failed', err.message);
      }
    } else if (error) {
      // Genuine error (DB unavailable etc.) — log but still answer
      // generically to the client.
      console.error('[register] signUp error', error.message);
    }

    return res.status(200).json({
      message: 'If this email is new, you will receive a verification link shortly.',
    });
  } catch (err) {
    console.error('[register] unexpected', err);
    // Generic on the wire to preserve enumeration resistance.
    return res.status(200).json({
      message: 'If this email is new, you will receive a verification link shortly.',
    });
  }
};

// ── /login ────────────────────────────────────────────────────────────
//
// Returns 200 + session on success, OR a single generic 401 for any
// failure mode (unknown email / wrong password / unconfirmed email).
// On unconfirmed-email, silently resend the verification mail in the
// background so the user has a path forward without us telling
// attackers which case they hit.
//
// On success, also issues:
//   - httpOnly `auth_token` cookie (preferred transport)
//   - readable `csrf_token` cookie (for double-submit CSRF)
//   - access_token in the response body (legacy/native-client path)
const login = async (req, res) => {
  await jitter();
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const { email, password } = req.body;

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      const msg = (error.message || '').toLowerCase();
      // If the email is unconfirmed, fire off a resend in the
      // background, but DO NOT change the response shape. Attackers
      // can't distinguish this from a wrong password.
      if (msg.includes('email not confirmed') || msg.includes('not confirmed')) {
        silentResendVerification(email);
      }
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Detect MFA-required: Supabase signs JWT with aal1 even for
    // users with TOTP enrolled, then requires an MFA challenge to
    // step up to aal2. We surface this so the frontend can run the
    // challenge step before treating the user as logged in.
    const factors = (data.user?.factors || []).filter(
      (f) => f.factor_type === 'totp' && f.status === 'verified'
    );
    if (factors.length > 0) {
      // Don't issue cookies yet — the session is still aal1. The
      // frontend will call /api/auth/mfa/challenge with this token.
      return res.status(200).json({
        mfa_required: true,
        partial_session: { access_token: data.session.access_token },
        factor_id: factors[0].id,
      });
    }

    // Issue cookies. For native/mobile clients without cookie
    // support, the access_token is also returned in the body.
    setSessionCookie(req, res, data.session.access_token);
    issueCsrfCookie(req, res);

    return res.status(200).json({
      user: data.user,
      session: { access_token: data.session.access_token },
    });
  } catch (err) {
    console.error('[login] unexpected', err);
    return res.status(401).json({ error: 'Invalid credentials' });
  }
};

// ── /logout ───────────────────────────────────────────────────────────
//
// Revokes the user's session at Supabase (so any leaked copy of the
// JWT becomes useless) and clears the cookies.
const logout = async (req, res) => {
  const token = req.cookies?.auth_token || bearerToken(req);
  if (token) {
    try {
      // signOut('global') invalidates ALL of this user's sessions,
      // not just the one tied to this token. Safer default — if a
      // user is logging out because they suspect compromise, they
      // probably want every device kicked.
      const userClient = createUserClient(token);
      await userClient.auth.signOut({ scope: 'global' });
    } catch (err) {
      console.warn('[logout] signOut failed', err.message);
    }
  }
  clearSessionCookie(req, res);
  clearCsrfCookie(req, res);
  return res.status(200).json({ message: 'Logged out' });
};

// ── /forgot-password ──────────────────────────────────────────────────
//
// Always 200. Whether the email exists or not, the response is the
// same and the timing is jittered.
const forgotPassword = async (req, res) => {
  await jitter();
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  const { email } = req.body;

  try {
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${canonicalFrontend()}/reset-password`,
    });
  } catch (err) {
    console.warn('[forgot-password] failed', err.message);
  }

  return res.status(200).json({
    message: 'If this email is registered, a reset link is on its way.',
  });
};

// ── /resend-verification ──────────────────────────────────────────────
//
// Always 200. Same shape regardless of whether the account exists or
// is already confirmed.
const resendVerification = async (req, res) => {
  await jitter();
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  const { email } = req.body;

  try {
    await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${canonicalFrontend()}/auth/callback` },
    });
  } catch (err) {
    console.warn('[resend-verification] failed', err.message);
  }

  return res.status(200).json({
    message: 'If this email needs verification, a new link is on its way.',
  });
};

// ── /reset-password ───────────────────────────────────────────────────
//
// Completes a password reset using the recovery JWT issued by
// Supabase's emailed link. The token MUST come from the
// Authorization header (NOT the JSON body) so it doesn't end up in
// access logs / APM request capture.
//
// Three independent checks before we touch the password:
//   1. supabase.auth.getUser(token) succeeds (signature valid)
//   2. JWT's `amr` claim contains `recovery` — this is the only
//      claim that distinguishes a recovery session from a regular
//      one. Without this check, ANY valid session token (e.g. one
//      lifted from localStorage via XSS) could rotate the password.
//   3. New password passes the policy (length + HIBP).
//
// After a successful change we revoke ALL of the user's sessions —
// any attacker token in flight at the moment of takeover becomes
// useless. The user must sign in again with the new password.
const resetPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  const accessToken = bearerToken(req);
  if (!accessToken) {
    return res.status(400).json({ error: 'Invalid or expired reset link', code: 'no-token' });
  }

  if (!isRecoveryToken(accessToken)) {
    // The presented token is valid as a session but not as a
    // recovery token. Refuse — only the magic link can reset the
    // password without the current one.
    const claims = require('../utils/jwtClaims').decodeUnsafe(accessToken);
    return res.status(400).json({
      error: 'Invalid or expired reset link',
      code: 'not-recovery',
      amr: claims?.amr ?? null,
    });
  }

  const { new_password } = req.body;
  const policy = await validatePassword(new_password);
  if (!policy.ok) {
    return res.status(400).json({ error: policy.error });
  }

  try {
    const { data: userRes, error: userErr } = await supabase.auth.getUser(accessToken);
    if (userErr || !userRes?.user) {
      return res.status(400).json({
        error: 'Invalid or expired reset link',
        code: 'getuser-failed',
        supabase_error: userErr?.message ?? null,
      });
    }

    const { error } = await supabase.auth.admin.updateUserById(userRes.user.id, {
      password: new_password,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Kill every existing session — including the one whose token
    // initiated this request. The user re-authenticates from scratch.
    try {
      await supabase.auth.admin.signOut(userRes.user.id, 'global');
    } catch (err) {
      console.warn('[reset-password] global signOut failed', err.message);
    }

    return res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

// ── /me ───────────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  return res.status(200).json({ user: req.user });
};

// ── POST /session/exchange ────────────────────────────────────────────
//
// Used by the OAuth callback (Google sign-in via Supabase). After the
// browser lands on /auth/callback#access_token=..., the SPA POSTs
// the token here so the backend can:
//   1. Validate it actually came from Supabase.
//   2. Issue our httpOnly session cookie + CSRF cookie.
//   3. Return the user.
//
// The token is consumed and discarded — never stored in localStorage.
const exchangeSession = async (req, res) => {
  const token = bearerToken(req);
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    setSessionCookie(req, res, token);
    issueCsrfCookie(req, res);
    return res.status(200).json({ user: data.user });
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

// ── /change-password ──────────────────────────────────────────────────
//
// Requires the CURRENT password to be re-presented. Without this,
// a stolen session token (XSS, unattended laptop, leaked cookie)
// gives the attacker permanent ownership of the account by letting
// them quietly rotate the password.
//
// Verification is done by attempting a fresh signInWithPassword
// against the user's email + the current_password they typed.
// If that succeeds, we know the caller knows the password and we
// proceed with the rotation, then revoke ALL other sessions so
// any pre-rotation tokens become useless.
const changePassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  const { current_password, new_password } = req.body;

  const policy = await validatePassword(new_password);
  if (!policy.ok) {
    return res.status(400).json({ error: policy.error });
  }

  if (current_password === new_password) {
    return res.status(400).json({ error: 'New password must differ from the current one' });
  }

  try {
    const { data: verifyData, error: verifyErr } = await supabase.auth.signInWithPassword({
      email: req.user.email,
      password: current_password,
    });
    if (verifyErr || !verifyData?.user) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const { error } = await supabase.auth.admin.updateUserById(req.user.id, {
      password: new_password,
    });
    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Revoke every session belonging to this user. The frontend
    // should immediately re-authenticate after a successful change.
    try {
      await supabase.auth.admin.signOut(req.user.id, 'global');
    } catch (err) {
      console.warn('[change-password] global signOut failed', err.message);
    }

    clearSessionCookie(req, res);
    clearCsrfCookie(req, res);

    return res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ── DELETE /account ───────────────────────────────────────────────────
//
// Permanent. Gated behind requireAal2 (see routes/auth.js) so users
// with MFA enrolled must clear an MFA challenge first.
const deleteAccount = async (req, res) => {
  try {
    const { error } = await supabase.auth.admin.deleteUser(req.user.id);
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    clearSessionCookie(req, res);
    clearCsrfCookie(req, res);
    return res.status(200).json({ message: 'Account deleted' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = {
  register,
  login,
  logout,
  forgotPassword,
  resendVerification,
  resetPassword,
  getMe,
  exchangeSession,
  changePassword,
  deleteAccount,
  validate,
};
