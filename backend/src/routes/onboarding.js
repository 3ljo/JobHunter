// Onboarding routes
// Handles getting and saving career preferences

const express = require('express');
const router = express.Router();
const { getOnboarding, saveOnboarding } = require('../controllers/onboardingController');
const requireAuth = require('../middleware/requireAuth');

// All onboarding routes require authentication
router.get('/', requireAuth, getOnboarding);
router.post('/', requireAuth, saveOnboarding);

module.exports = router;
