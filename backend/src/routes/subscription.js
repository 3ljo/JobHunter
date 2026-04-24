// Subscription routes
// Handles checkout, portal, status, and Stripe webhook

const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const { getSubscription, createCheckout, createPortal, configCheck, resyncSubscription } = require('../controllers/subscriptionController');
const { getSetting } = require('../services/settingsService');

// All routes except webhook require auth
router.get('/', requireAuth, getSubscription);
router.post('/checkout', requireAuth, createCheckout);
router.post('/portal', requireAuth, createPortal);

// Self-heal: re-fetches the current user's latest subscription from
// Lemon Squeezy and upserts our DB row. Safety net for users whose
// webhook didn't land (test-mode misconfig, upstream 5xx, etc).
router.post('/resync', requireAuth, resyncSubscription);

// Shape-only LS config diagnostic. Guarded by ADMIN_PASSWORD header in
// the controller — exposes booleans + an LS liveness status, never
// secret values.
router.get('/config-check', configCheck);

// Public — USDT wallet config for checkout page
router.get('/usdt-config', (req, res) => {
  res.json({
    wallet_address: getSetting('usdt_wallet_address') || '',
    network: getSetting('usdt_network') || 'TRC-20',
  });
});

// Webhook is mounted separately in index.js (needs raw body)

module.exports = router;
