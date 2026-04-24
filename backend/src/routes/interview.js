// Mock interview routes — voice-based AI interview sessions (Pro+ only)
const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const requirePlan = require('../middleware/requirePlan');
const { rateLimitMI } = require('../middleware/rateLimit');
const {
  startInterview,
  submitAnswer,
  finishInterview,
  getInterview,
  getHistory,
} = require('../controllers/mockInterviewController');

// Pro Voice plan gate — previously only enforced in the frontend,
// which meant any authenticated user could POST /api/interview/start
// directly and burn OpenAI Realtime credit on the free tier. Now
// enforced server-side BEFORE the rate limiter runs.
const proVoiceOnly = requirePlan(['pro_voice']);

router.post('/start', requireAuth, proVoiceOnly, rateLimitMI, startInterview);
router.post('/:id/answer', requireAuth, proVoiceOnly, submitAnswer);
router.post('/:id/finish', requireAuth, proVoiceOnly, finishInterview);
router.get('/history', requireAuth, getHistory);
router.get('/:id', requireAuth, getInterview);

module.exports = router;
