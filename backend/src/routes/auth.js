// Authentication routes
// Handles register, login, forgot-password, and get current user

const express = require('express');
const router = express.Router();
const { register, login, forgotPassword, resendVerification, resetPassword, getMe, changePassword, deleteAccount, validate } = require('../controllers/authController');
const requireAuth = require('../middleware/requireAuth');
const {
  loginLimiter,
  registerLimiter,
  forgotPasswordLimiter,
  resendVerificationLimiter,
  resetPasswordLimiter,
} = require('../middleware/authRateLimit');

// Public routes — all brute-force limited per IP (15-min window).
router.post('/register', registerLimiter, validate.register, register);
router.post('/login', loginLimiter, validate.login, login);
router.post('/forgot-password', forgotPasswordLimiter, validate.forgotPassword, forgotPassword);
router.post('/resend-verification', resendVerificationLimiter, validate.resendVerification, resendVerification);
router.post('/reset-password', resetPasswordLimiter, validate.resetPassword, resetPassword);

// Protected routes
router.get('/me', requireAuth, getMe);
router.post('/change-password', requireAuth, changePassword);
router.delete('/account', requireAuth, deleteAccount);

module.exports = router;
