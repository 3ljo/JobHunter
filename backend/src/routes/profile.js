// Profile routes
// Handles getting and updating user profiles

const express = require('express');
const router = express.Router();
const { getProfile, updateProfile } = require('../controllers/profileController');
const requireAuth = require('../middleware/requireAuth');

// All profile routes require authentication
router.get('/', requireAuth, getProfile);
router.put('/', requireAuth, updateProfile);

module.exports = router;
