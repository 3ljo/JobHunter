// Referral routes — Hired & Help program.
const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const {
  getMyReferralInfo,
  trackClick,
  requestPayout,
} = require('../controllers/referralController');

// Basic in-memory rate limit per IP for the unauth tracking endpoint.
// Cheap, no extra deps. 30 req/min per IP is plenty for ?ref landings.
const hits = new Map();
function rateLimit(req, res, next) {
  const ip = (req.headers['x-forwarded-for']?.toString().split(',')[0].trim()) || req.ip || 'unknown';
  const now = Date.now();
  const winStart = now - 60_000;
  const times = (hits.get(ip) || []).filter((t) => t > winStart);
  if (times.length >= 30) {
    return res.status(429).json({ error: 'Too many requests, slow down.' });
  }
  times.push(now);
  hits.set(ip, times);
  // Light housekeeping every ~100 requests.
  if (hits.size > 500) {
    for (const [k, v] of hits) {
      const live = v.filter((t) => t > winStart);
      if (live.length === 0) hits.delete(k);
      else hits.set(k, live);
    }
  }
  next();
}

router.get('/me',       requireAuth, getMyReferralInfo);
router.post('/track',   rateLimit,   trackClick);
router.post('/payout',  requireAuth, requestPayout);

module.exports = router;
