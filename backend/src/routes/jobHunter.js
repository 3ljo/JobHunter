// Job Hunter routes
// Drives the /job-hunter dashboard tab. All endpoints require auth.

const express = require('express');
const router = express.Router();
const { getLatestMatches, findJobs, clearMatches } = require('../controllers/jobHunterController');
const requireAuth = require('../middleware/requireAuth');
const requirePlan = require('../middleware/requirePlan');

// Pro+ exclusive — multi-source aggregator burns paid API quota
// (Adzuna, JSearch, etc.), so we gate at the top tier. `pro_plus` is
// normalized to `pro_voice` inside requirePlan via canonicalPlan.
const proPlusOnly = requirePlan(['pro_voice']);

router.get('/latest', requireAuth, proPlusOnly, getLatestMatches);
router.post('/find', requireAuth, proPlusOnly, findJobs);
router.delete('/clear', requireAuth, proPlusOnly, clearMatches);

module.exports = router;
