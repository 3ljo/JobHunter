// Authentication routes.
//
// Public routes apply per-IP and per-email rate limits. Protected
// routes additionally enforce:
//   - requireAuth (cookie OR Authorization header)
//   - csrfMiddleware (when authenticated by cookie, mismatched
//     X-CSRF-Token header rejects the request)
//   - requireAal2 on irreversible / sensitive operations, so users
//     with MFA enrolled must clear a fresh challenge.

const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/authController');
const requireAuth = require('../middleware/requireAuth');
const { requireAal2 } = require('../middleware/requireAuth');
const { csrfMiddleware } = require('../middleware/csrf');
const {
  loginLimiter,
  registerLimiter,
  forgotPasswordLimiter,
  resendVerificationLimiter,
  resetPasswordLimiter,
  mfaChallengeLimiter,
  mfaVerifyLimiter,
} = require('../middleware/authRateLimit');
const mfa = require('../controllers/mfaController');

// ── Public ────────────────────────────────────────────────────────────
router.post('/register', registerLimiter, validate.register, register);
router.post('/login', loginLimiter, validate.login, login);
router.post('/forgot-password', forgotPasswordLimiter, validate.forgotPassword, forgotPassword);
router.post('/resend-verification', resendVerificationLimiter, validate.resendVerification, resendVerification);
router.post('/reset-password', resetPasswordLimiter, validate.resetPassword, resetPassword);
router.post('/session/exchange', loginLimiter, exchangeSession);

// MFA login challenge — caller has only the partial (aal1) token.
router.post('/mfa/login/challenge', mfaChallengeLimiter, mfa.validate.challenge, mfa.challengeLogin);
router.post('/mfa/login/verify', mfaVerifyLimiter, mfa.validate.challengeVerify, mfa.verifyLogin);

// ── Authenticated ─────────────────────────────────────────────────────
router.get('/me', requireAuth, getMe);
router.post('/logout', requireAuth, csrfMiddleware, logout);
router.post('/change-password', requireAuth, csrfMiddleware, requireAal2, validate.changePassword, changePassword);
router.delete('/account', requireAuth, csrfMiddleware, requireAal2, deleteAccount);

// ── MFA management (authenticated) ────────────────────────────────────
router.get('/mfa/factors', requireAuth, mfa.listFactors);
router.post('/mfa/enroll', requireAuth, csrfMiddleware, mfa.enroll);
router.post('/mfa/enroll/verify', requireAuth, csrfMiddleware, mfa.validate.enrollVerify, mfa.enrollVerify);
router.post('/mfa/challenge', requireAuth, csrfMiddleware, mfaChallengeLimiter, mfa.validate.challenge, mfa.challenge);
router.post('/mfa/challenge/verify', requireAuth, csrfMiddleware, mfaVerifyLimiter, mfa.validate.challengeVerify, mfa.challengeVerify);
router.delete('/mfa/factor/:factorId', requireAuth, csrfMiddleware, requireAal2, mfa.unenroll);

module.exports = router;
