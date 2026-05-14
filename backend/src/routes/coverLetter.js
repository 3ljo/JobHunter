const express = require('express');
const router = express.Router();
const { generateCoverLetter, generateFromPdf, refineCoverLetter } = require('../controllers/coverLetterController');
const requireAuth = require('../middleware/requireAuth');
const { rateLimitCL } = require('../middleware/rateLimit');

router.post('/generate', requireAuth, rateLimitCL, generateCoverLetter);
router.post('/generate-from-pdf', requireAuth, rateLimitCL, generateFromPdf);
// Refine also counts against the CL quota — prevents burning unlimited
// AI by repeatedly refining a single generated letter.
router.post('/refine', requireAuth, rateLimitCL, refineCoverLetter);

module.exports = router;
