// Job Hunter routes
// Drives the /job-hunter dashboard tab. All endpoints require auth.

const express = require('express');
const router = express.Router();
const { getLatestMatches, findJobs, clearMatches } = require('../controllers/jobHunterController');
const requireAuth = require('../middleware/requireAuth');

router.get('/latest', requireAuth, getLatestMatches);
router.post('/find', requireAuth, findJobs);
router.delete('/clear', requireAuth, clearMatches);

module.exports = router;
