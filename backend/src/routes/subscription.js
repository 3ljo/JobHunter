// Subscription routes
// Handles checkout, portal, status, and Stripe webhook

const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const { getSubscription, createCheckout, createPortal } = require('../controllers/subscriptionController');
const { getSetting } = require('../services/settingsService');

// All routes except webhook require auth
router.get('/', requireAuth, getSubscription);
router.post('/checkout', requireAuth, createCheckout);
router.post('/portal', requireAuth, createPortal);

// Public — USDT wallet config for checkout page
router.get('/usdt-config', (req, res) => {
  res.json({
    wallet_address: getSetting('usdt_wallet_address') || '',
    network: getSetting('usdt_network') || 'TRC-20',
  });
});

// Webhook is mounted separately in index.js (needs raw body)

module.exports = router;
