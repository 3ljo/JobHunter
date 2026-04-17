// Mock interview routes — voice-based AI interview sessions (Pro+ only)
const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const { rateLimitMI } = require('../middleware/rateLimit');
const {
  startInterview,
  submitAnswer,
  finishInterview,
  getInterview,
  getHistory,
  ttsQuestion,
} = require('../controllers/mockInterviewController');

router.post('/start', requireAuth, rateLimitMI, startInterview);
router.post('/:id/answer', requireAuth, submitAnswer);
router.post('/:id/finish', requireAuth, finishInterview);
router.post('/:id/tts', requireAuth, ttsQuestion);
router.get('/history', requireAuth, getHistory);
router.get('/:id', requireAuth, getInterview);

module.exports = router;
