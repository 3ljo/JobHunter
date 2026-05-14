// Admin routes — protected by requireAdmin middleware
const express = require('express');
const router = express.Router();
const requireAdmin = require('../middleware/requireAdmin');
const {
  // overview
  getOverview,
  // users
  getUsers,
  getUserDetail,
  grantPlan,
  changePlan,
  resetUserPassword,
  banUser,
  unbanUser,
  deleteUser,
  // usage
  getUsageAnalytics,
  // settings
  getSettings,
  saveSettings,
  // misc
  checkAdmin,
} = require('../controllers/adminController');
const { listPromos, createPromo, updatePromo, deletePromo } = require('../controllers/promoController');

router.use(requireAdmin);

// auth
router.get('/check', checkAdmin);

// overview (replaces /dashboard; alias kept for back-compat in case
// anything cached the old URL)
router.get('/overview', getOverview);
router.get('/dashboard', getOverview);

// users
router.get('/users', getUsers);
router.get('/users/:id', getUserDetail);
router.post('/users/:id/grant', grantPlan);
router.patch('/users/:id/plan', changePlan);
router.post('/users/:id/reset-password', resetUserPassword);
router.post('/users/:id/ban', banUser);
router.post('/users/:id/unban', unbanUser);
router.delete('/users/:id', deleteUser);

// usage + settings
router.get('/usage', getUsageAnalytics);
router.get('/settings', getSettings);
router.put('/settings', saveSettings);

// promos
router.get('/promos', listPromos);
router.post('/promos', createPromo);
router.put('/promos/:id', updatePromo);
router.delete('/promos/:id', deletePromo);

module.exports = router;
