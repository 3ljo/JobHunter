// CV routes
// Handles CV analysis, history, and deletion endpoints

const express = require('express');
const router = express.Router();
const { analyzeCV, getCVHistory, deleteCVRecord } = require('../controllers/cvController');
const requireAuth = require('../middleware/requireAuth');

// All CV routes require authentication
router.post('/analyze', requireAuth, analyzeCV);
router.get('/history', requireAuth, getCVHistory);
router.delete('/:cv_id', requireAuth, deleteCVRecord);

module.exports = router;
