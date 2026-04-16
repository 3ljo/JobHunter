// CV routes
// Handles CV analysis, history, and deletion endpoints

const express = require('express');
const router = express.Router();
const { analyzeCV, getCVHistory, deleteCVRecord, downloadCVPdf, previewCVPdf, refineCV } = require('../controllers/cvController');
const requireAuth = require('../middleware/requireAuth');
const { rateLimitCV } = require('../middleware/rateLimit');

// All CV routes require authentication
router.post('/analyze', requireAuth, rateLimitCV, analyzeCV);
router.get('/history', requireAuth, getCVHistory);
router.get('/download/:cv_id', requireAuth, downloadCVPdf);
router.get('/preview/:cv_id', requireAuth, previewCVPdf);
router.post('/refine', requireAuth, refineCV);
router.delete('/:cv_id', requireAuth, deleteCVRecord);

module.exports = router;
