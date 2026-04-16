const express = require('express');
const router = express.Router();
const { generateCoverLetter, generateFromPdf, refineCoverLetter } = require('../controllers/coverLetterController');
const requireAuth = require('../middleware/requireAuth');
const { rateLimitCL } = require('../middleware/rateLimit');

router.post('/generate', requireAuth, rateLimitCL, generateCoverLetter);
router.post('/generate-from-pdf', requireAuth, rateLimitCL, generateFromPdf);
router.post('/refine', requireAuth, refineCoverLetter);

module.exports = router;
