// Authentication controller
// Handles user registration, login, password reset, and profile retrieval

const { body, validationResult } = require('express-validator');
const supabase = require('../services/supabaseClient');
const { ensureCodeForUser, attributeOnSignup } = require('./referralController');
const { hashIp, getClientIp } = require('../lib/referrals/hashIp');

// FRONTEND_URL may be a comma-separated CORS list — pick the first canonical
// origin for building auth redirect links.
const canonicalFrontend = () => {
  const raw = process.env.FRONTEND_URL || '';
  const first = raw.split(',')[0].trim();
  return first.replace(/\/$/, '');
};

// Validation rules for each endpoint
const validate = {
  register: [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  login: [
    body('email').notEmpty().withMessage('Email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  forgotPassword: [
    body('email').notEmpty().withMessage('Email is required'),
  ],
  resendVerification: [
    body('email').isEmail().withMessage('Valid email is required'),
  ],
  resetPassword: [
    body('access_token').notEmpty().withMessage('Access token is required'),
    body('new_password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
};

// Register a new user — sends a Supabase verification email; user must confirm
// before they can sign in.
const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  const { email, password, ref_code, device_fingerprint } = req.body;

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${canonicalFrontend()}/auth/callback`,
      },
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Supabase's email-enumeration protection: when the email is already
    // registered, signUp resolves successfully but `identities` is empty.
    // Catch that and surface a clear "account exists" error instead of
    // pretending we sent a verification email.
    if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      return res.status(409).json({
        error: 'An account with this email already exists. Please sign in instead.',
        code: 'email_exists',
      });
    }

    // Background post-signup work. Wrapped in a try/catch so referral
    // plumbing never blocks or fails a signup. The attribution result
    // is stashed in `_debug` on the response temporarily so we can
    // diagnose attribution failures from the frontend Network tab.
    // TODO: remove _debug once referral attribution is verified working.
    let _debug = null;
    if (data.user) {
      try {
        await ensureCodeForUser(data.user.id);

        if (ref_code) {
          const ipHash = hashIp(getClientIp(req));
          _debug = await attributeOnSignup({
            refCode: ref_code,
            newUserId: data.user.id,
            newUserEmail: data.user.email || email,
            ipHash,
            fingerprint: device_fingerprint || null,
          });
        } else {
          _debug = { ok: false, stage: 'no_ref_code_in_body' };
        }
      } catch (bgErr) {
        _debug = { ok: false, stage: 'register_catch', msg: bgErr.message };
      }
    }

    return res.status(201).json({
      message: 'Verification email sent',
      user: data.user,
      _debug,
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

// Login with email and password
const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const { email, password } = req.body;

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Surface unconfirmed-email distinctly so the UI can prompt resend.
      const msg = (error.message || '').toLowerCase();
      if (msg.includes('email not confirmed') || msg.includes('not confirmed')) {
        return res.status(403).json({ error: 'Email not confirmed', code: 'email_not_confirmed' });
      }
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    return res.status(200).json({
      user: data.user,
      session: data.session,
    });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
};

// Send password reset email
const forgotPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  const { email } = req.body;

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${canonicalFrontend()}/reset-password`,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ message: 'Password reset email sent' });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

// Resend the verification email for an unconfirmed account.
const resendVerification = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  const { email } = req.body;

  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${canonicalFrontend()}/auth/callback`,
      },
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ message: 'Verification email sent' });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

// Complete a password reset using the recovery access_token issued by Supabase
// from the email link.
const resetPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  const { access_token, new_password } = req.body;

  try {
    // Verify the recovery access_token resolves to a real user before letting
    // the service role rewrite their password.
    const { data: userRes, error: userErr } = await supabase.auth.getUser(access_token);
    if (userErr || !userRes?.user) {
      return res.status(400).json({ error: 'Invalid or expired reset link' });
    }

    const { error } = await supabase.auth.admin.updateUserById(userRes.user.id, {
      password: new_password,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

// Get current authenticated user profile
const getMe = async (req, res) => {
  return res.status(200).json({ user: req.user });
};

// Change password for authenticated user
const changePassword = async (req, res) => {
  const { new_password } = req.body;

  if (!new_password || new_password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    const { error } = await supabase.auth.admin.updateUserById(req.user.id, {
      password: new_password,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Permanently delete the authenticated user's account and all their data.
const deleteAccount = async (req, res) => {
  try {
    const { error } = await supabase.auth.admin.deleteUser(req.user.id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ message: 'Account deleted' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = { register, login, forgotPassword, resendVerification, resetPassword, getMe, changePassword, deleteAccount, validate };
