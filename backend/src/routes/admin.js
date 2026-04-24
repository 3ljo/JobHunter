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

// Referral fraud queue — extra X-Admin-Password header required.
router.get('/referrals/flagged',                 requireAdminPassword, listFlagged);
router.post('/referrals/:id/approve',            requireAdminPassword, approveFlagged);
router.post('/referrals/:id/reject',             requireAdminPassword, rejectFlagged);
router.get('/referrals/payouts',                 requireAdminPassword, listPayouts);
router.post('/referrals/payouts/:id/mark-paid',  requireAdminPassword, markPayoutSent);
router.post('/referrals/payouts/:id/reject',     requireAdminPassword, rejectPayout);
router.get('/referrals/funnel',                  requireAdminPassword, getFunnel);

module.exports = router;
