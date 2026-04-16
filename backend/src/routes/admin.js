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
const { getAdminReferrals } = require('../controllers/referralController');

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

// Referrals
router.get('/referrals', getAdminReferrals);

module.exports = router;
