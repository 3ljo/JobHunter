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

// All routes require admin
router.use(requireAdmin);

router.get('/check', checkAdmin);
router.get('/dashboard', getDashboardStats);
router.get('/users', getUsers);
router.get('/usage', getUsageAnalytics);
router.get('/settings', getSettings);
router.put('/settings', saveSettings);

module.exports = router;
