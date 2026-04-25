const express = require('express');
const router = express.Router();
const { generateCoverLetter, generateFromPdf, refineCoverLetter } = require('../controllers/coverLetterController');
const requireAuth = require('../middleware/requireAuth');
const checkSubscription = require('../middleware/checkSubscription');
const { rateLimitCL } = require('../middleware/rateLimit');

const requirePaidPlan = (req, res, next) => {
  if (req.subscription?.plan === 'free') {
    return res.status(403).json({ error: 'Refine with AI is available on Pro and Pro+ plans.' });
  }
  next();
};

router.post('/generate', requireAuth, rateLimitCL, generateCoverLetter);
router.post('/generate-from-pdf', requireAuth, rateLimitCL, generateFromPdf);
router.post('/refine', requireAuth, checkSubscription, requirePaidPlan, refineCoverLetter);

module.exports = router;
