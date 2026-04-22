// Authentication routes
// Handles register, login, forgot-password, and get current user

const express = require('express');
const router = express.Router();
const { register, login, forgotPassword, resendVerification, resetPassword, getMe, changePassword, validate } = require('../controllers/authController');
const requireAuth = require('../middleware/requireAuth');

// Public routes
router.post('/register', validate.register, register);
router.post('/login', validate.login, login);
router.post('/forgot-password', validate.forgotPassword, forgotPassword);
router.post('/resend-verification', validate.resendVerification, resendVerification);
router.post('/reset-password', validate.resetPassword, resetPassword);

// Protected routes
router.get('/me', requireAuth, getMe);
router.post('/change-password', requireAuth, changePassword);

module.exports = router;
