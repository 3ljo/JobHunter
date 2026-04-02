const express = require('express');
const router = express.Router();
const { generateCoverLetter, generateFromPdf, refineCoverLetter } = require('../controllers/coverLetterController');
const requireAuth = require('../middleware/requireAuth');

router.post('/generate', requireAuth, generateCoverLetter);
router.post('/generate-from-pdf', requireAuth, generateFromPdf);
router.post('/refine', requireAuth, refineCoverLetter);

module.exports = router;
