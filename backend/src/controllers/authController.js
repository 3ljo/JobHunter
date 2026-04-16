// Authentication controller
// Handles user registration, login, password reset, and profile retrieval

const { body, validationResult } = require('express-validator');
const supabase = require('../services/supabaseClient');

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
};

// Register a new user
const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  const { email, password, referral_code } = req.body;

  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // If a referral code was provided, link the referral
    if (referral_code && data.user) {
      const { applyReferralOnRegistration } = require('./referralController');
      await applyReferralOnRegistration(data.user.id, referral_code);
    }

    return res.status(201).json({
      message: 'User created successfully',
      user: data.user,
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
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ message: 'Password reset email sent' });
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

module.exports = { register, login, forgotPassword, getMe, changePassword, validate };
