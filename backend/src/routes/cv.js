// CV routes
// Handles CV analysis, history, and deletion endpoints

const express = require('express');
const router = express.Router();
const { analyzeCV, createCV, getCVHistory, deleteCVRecord, downloadCVPdf, previewCVPdf, refineCV, patchCV } = require('../controllers/cvController');
const requireAuth = require('../middleware/requireAuth');
const { rateLimitCV } = require('../middleware/rateLimit');

// All CV routes require authentication
router.post('/analyze', requireAuth, rateLimitCV, analyzeCV);
router.post('/create', requireAuth, rateLimitCV, createCV);
router.get('/history', requireAuth, getCVHistory);
router.get('/download/:cv_id', requireAuth, downloadCVPdf);
router.post('/download/:cv_id', requireAuth, downloadCVPdf);
router.get('/preview/:cv_id', requireAuth, previewCVPdf);
router.post('/preview/:cv_id', requireAuth, previewCVPdf);
// Refine also counts against the CV quota — otherwise a user could
// call /analyze once and then /refine 1000x and burn unlimited AI.
router.post('/refine', requireAuth, rateLimitCV, refineCV);
// Patch = direct DB write, no AI. Doesn't burn quota.
router.post('/patch', requireAuth, patchCV);
router.delete('/:cv_id', requireAuth, deleteCVRecord);

module.exports = router;
