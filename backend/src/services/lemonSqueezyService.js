// Lemon Squeezy Service
// - Creates hosted checkout URLs for subscription plans.
// - Verifies inbound webhook signatures.
// - Maps LS subscription status strings to our internal enum.
//
// Uses global fetch (Node 18+). No extra npm dependency required.

const crypto = require('crypto');
const { PLANS } = require('./stripeService');

const API_BASE = 'https://api.lemonsqueezy.com/v1';

const apiKey = () => process.env.LEMONSQUEEZY_API_KEY;
const storeId = () => process.env.LEMONSQUEEZY_STORE_ID;
const webhookSecret = () => process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

// Look up the LS variant ID for a (plan, interval) combination.
const getVariantId = (plan, interval) => {
  const config = PLANS[plan];
  if (!config || !config.ls_variants) return null;
  return config.ls_variants[interval] || null;
};

// Create a hosted Lemon Squeezy checkout URL. Stashes the user_id + plan +
// interval in `custom_data` so the webhook can link the resulting subscription
// back to our user without needing the email lookup.
const createCheckout = async ({ variantId, userId, email, plan, interval, successUrl }) => {
  if (!apiKey() || !storeId()) {
    throw new Error('Lemon Squeezy not configured — set LEMONSQUEEZY_API_KEY and LEMONSQUEEZY_STORE_ID');
  }
  if (!variantId) {
    throw new Error(`LS variant ID missing for plan=${plan}, interval=${interval} — set LEMONSQUEEZY_VARIANT_* env vars`);
  }

  const body = {
    data: {
      type: 'checkouts',
      attributes: {
        checkout_options: { embed: false, media: false, logo: true },
        checkout_data: {
          email: email || undefined,
          custom: { user_id: userId, plan, interval },
        },
        product_options: {
          redirect_url: successUrl,
        },
      },
      relationships: {
        store: { data: { type: 'stores', id: String(storeId()) } },
        variant: { data: { type: 'variants', id: String(variantId) } },
      },
    },
  };

  const res = await fetch(`${API_BASE}/checkouts`, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
      Authorization: `Bearer ${apiKey()}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`LS checkout create failed (${res.status}): ${errText}`);
  }

  const json = await res.json();
  const url = json?.data?.attributes?.url;
  if (!url) {
    throw new Error('LS returned no checkout URL');
  }
  return url;
};

// Verify the `X-Signature` HMAC of a webhook request. `rawBody` must be the
// exact raw payload bytes the request arrived with — parsing it loses the signature.
const verifyWebhook = (rawBody, signatureHeader) => {
  if (!webhookSecret() || !signatureHeader) return false;
  const digest = crypto.createHmac('sha256', webhookSecret()).update(rawBody).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(digest, 'hex'), Buffer.from(signatureHeader, 'hex'));
  } catch {
    return false;
  }
};

// Lemon Squeezy subscription states → our internal status enum
// (same enum the Stripe handler used, so the frontend doesn't change).
const mapStatus = (lsStatus) => {
  switch (lsStatus) {
    case 'active':    return 'active';
    case 'on_trial':  return 'trialing';
    case 'past_due':  return 'past_due';
    case 'unpaid':    return 'unpaid';
    case 'cancelled': return 'canceled';
    case 'expired':   return 'canceled';
    case 'paused':    return 'past_due';
    default:          return 'active';
  }
};

// Resolve our internal plan key from an LS variant ID (used by webhook
// updates where `custom_data` may not be present).
const resolvePlanFromVariantId = (variantId) => {
  if (!variantId) return 'free';
  const id = String(variantId);
  for (const [planKey, config] of Object.entries(PLANS)) {
    if (config.ls_variants && (config.ls_variants.month === id || config.ls_variants.year === id)) {
      return planKey;
    }
  }
  return 'free';
};

const resolveIntervalFromVariantId = (variantId) => {
  if (!variantId) return 'month';
  const id = String(variantId);
  for (const config of Object.values(PLANS)) {
    if (config.ls_variants) {
      if (config.ls_variants.month === id) return 'month';
      if (config.ls_variants.year === id) return 'year';
    }
  }
  return 'month';
};

module.exports = {
  getVariantId,
  createCheckout,
  verifyWebhook,
  mapStatus,
  resolvePlanFromVariantId,
  resolveIntervalFromVariantId,
};
