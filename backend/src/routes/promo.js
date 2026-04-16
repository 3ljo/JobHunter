// Promo code routes (user-facing)
const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const { validatePromo, getActiveBanner } = require('../controllers/promoController');

router.post('/validate', requireAuth, validatePromo);
router.get('/banner', getActiveBanner); // Public — no auth

module.exports = router;
