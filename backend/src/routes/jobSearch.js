// Job search routes
// Handles AI-powered job search and site suggestion endpoints

const express = require('express');
const router = express.Router();
const { searchJobsWithAI, getSuggestedJobSites } = require('../controllers/jobSearchController');
const requireAuth = require('../middleware/requireAuth');

// All job search routes require authentication
router.post('/search', requireAuth, searchJobsWithAI);
router.post('/suggested-sites', requireAuth, getSuggestedJobSites);

module.exports = router;
