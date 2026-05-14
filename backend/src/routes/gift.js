// Gift-a-Pass routes.
const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const { createGiftCheckout, lookupGift, redeemGift } = require('../controllers/giftController');

router.post('/checkout',      requireAuth, createGiftCheckout);
router.get('/:code',                        lookupGift);   // public — redeem page needs it pre-auth
router.post('/:code/redeem',  requireAuth, redeemGift);

module.exports = router;
