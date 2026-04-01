// Job Tracker routes
// Handles CRUD and stats for tracked job applications

const express = require('express');
const router = express.Router();
const { getAllJobs, addJob, updateJob, deleteJob, getJobStats } = require('../controllers/jobTrackerController');
const requireAuth = require('../middleware/requireAuth');

// All tracker routes require authentication
router.get('/', requireAuth, getAllJobs);
router.post('/', requireAuth, addJob);
router.get('/stats', requireAuth, getJobStats);
router.put('/:job_id', requireAuth, updateJob);
router.delete('/:job_id', requireAuth, deleteJob);

module.exports = router;
