// Admin routes — protected by requireAdmin middleware
const express = require('express');
const router = express.Router();
const requireAdmin = require('../middleware/requireAdmin');
const {
  getDashboardStats,
  getUsers,
  getUsageAnalytics,
  getSettings,
  saveSettings,
  checkAdmin,
} = require('../controllers/adminController');
const { listPromos, createPromo, updatePromo, deletePromo } = require('../controllers/promoController');
const {
  requireAdminPassword, listFlagged, approveFlagged, rejectFlagged,
  listPayouts, markPayoutSent, rejectPayout, getFunnel,
} = require('../controllers/adminReferralController');

// All routes require admin
router.use(requireAdmin);

router.get('/check', checkAdmin);
router.get('/dashboard', getDashboardStats);
router.get('/users', getUsers);
router.get('/usage', getUsageAnalytics);
router.get('/settings', getSettings);
router.put('/settings', saveSettings);

// Promo codes
router.get('/promos', listPromos);
router.post('/promos', createPromo);
router.put('/promos/:id', updatePromo);
router.delete('/promos/:id', deletePromo);

// Referral admin. The email-allowlist requireAdmin middleware above
// already gates these — we previously added an extra X-Admin-Password
// header as defence-in-depth, but it's currently disabled to simplify
// testing. Re-enable by putting `requireAdminPassword` back in front of
// each handler and setting ADMIN_PASSWORD on Render.
router.get('/referrals/flagged',                 listFlagged);
router.post('/referrals/:id/approve',            approveFlagged);
router.post('/referrals/:id/reject',             rejectFlagged);
router.get('/referrals/payouts',                 listPayouts);
router.post('/referrals/payouts/:id/mark-paid',  markPayoutSent);
router.post('/referrals/payouts/:id/reject',     rejectPayout);
router.get('/referrals/funnel',                  getFunnel);

// Silence the unused-import warning while the 2nd-layer gate is off.
// eslint-disable-next-line no-unused-expressions
void requireAdminPassword;

module.exports = router;
