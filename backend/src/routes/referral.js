// Referral routes (user-facing)
const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const {
  getMyReferralCode,
  getMyReferrals,
  validateReferralCode,
  checkReferralDiscount,
} = require('../controllers/referralController');

router.get('/my-code', requireAuth, getMyReferralCode);
router.get('/my-referrals', requireAuth, getMyReferrals);
router.post('/validate', validateReferralCode); // No auth — used at registration
router.get('/check-discount', requireAuth, checkReferralDiscount);

module.exports = router;
