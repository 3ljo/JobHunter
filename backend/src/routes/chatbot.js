const express = require('express');
const router = express.Router();
const { chat } = require('../controllers/chatbotController');
const chatbotRateLimit = require('../middleware/chatbotRateLimit');

// Public endpoint — no auth required so visitors can ask questions
// before signing up. Per-IP rate limit prevents abuse.
router.post('/', chatbotRateLimit, chat);

module.exports = router;
