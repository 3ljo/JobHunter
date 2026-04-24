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
// For one-time plans (e.g. `starter`), pass interval='once'.
const getVariantId = (plan, interval) => {
  const config = PLANS[plan];
  if (!config || !config.ls_variants) return null;
  return config.ls_variants[interval] || null;
};

// Create a hosted Lemon Squeezy checkout URL. Stashes the user_id + plan +
// interval in `custom_data` so the webhook can link the resulting subscription
// back to our user without needing the email lookup.
const createCheckout = async ({ variantId, userId, email, plan, interval, successUrl, custom }) => {
  if (!apiKey() || !storeId()) {
    throw new Error('Lemon Squeezy not configured — set LEMONSQUEEZY_API_KEY and LEMONSQUEEZY_STORE_ID');
  }
  if (!variantId) {
    throw new Error(`LS variant ID missing for plan=${plan}, interval=${interval} — set LEMONSQUEEZY_VARIANT_* env vars`);
  }

  // Default custom payload links the order back to our user via webhook.
  // Callers can pass extra fields (e.g. { gift: true, recipient_email })
  // which get merged in.
  const customData = { user_id: userId, plan, interval, ...(custom || {}) };

  const body = {
    data: {
      type: 'checkouts',
      attributes: {
        checkout_options: { embed: false, media: false, logo: true },
        checkout_data: {
          email: email || undefined,
          custom: customData,
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
    // Attach the HTTP status so callers can branch on auth failures
    // without string-matching the body. Full body goes to server logs
    // only — never back to the client.
    const e = new Error(`LS checkout create failed (${res.status}): ${errText}`);
    e.lsStatus = res.status;
    throw e;
  }

  const json = await res.json();
  const url = json?.data?.attributes?.url;
  if (!url) {
    throw new Error('LS returned no checkout URL');
  }
  return url;
};

// Find the most recent active subscription for a given email address.
// Used by the /resync endpoint to self-heal users whose webhook didn't
// land. LS /v1/subscriptions supports `filter[user_email]=...` via JSON:API.
// Returns the full subscription object or null.
const findLatestSubscriptionByEmail = async (email) => {
  if (!apiKey() || !storeId() || !email) return null;
  const params = new URLSearchParams({
    'filter[store_id]': String(storeId()),
    'filter[user_email]': email,
    // Latest first — if the user re-subscribed we want the freshest row.
    sort: '-created_at',
    'page[size]': '5',
  });
  const res = await fetch(`${API_BASE}/subscriptions?${params.toString()}`, {
    headers: {
      Accept: 'application/vnd.api+json',
      Authorization: `Bearer ${apiKey()}`,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    const err = new Error(`LS subscriptions lookup failed (${res.status}): ${body}`);
    err.lsStatus = res.status;
    throw err;
  }
  const json = await res.json();
  const rows = Array.isArray(json?.data) ? json.data : [];
  if (rows.length === 0) return null;
  // Prefer an active row over a cancelled one.
  const active = rows.find((r) => r?.attributes?.status === 'active');
  return active || rows[0];
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
// updates where `custom_data` may not be present). Skips the legacy
// `pro_plus` alias so we always return the canonical `pro_voice` key.
const resolvePlanFromVariantId = (variantId) => {
  if (!variantId) return 'free';
  const id = String(variantId);
  for (const [planKey, config] of Object.entries(PLANS)) {
    if (config.legacy_alias_for) continue;
    if (!config.ls_variants) continue;
    if (
      config.ls_variants.month === id ||
      config.ls_variants.year === id ||
      config.ls_variants.once === id
    ) {
      return planKey;
    }
  }
  return 'free';
};

const resolveIntervalFromVariantId = (variantId) => {
  if (!variantId) return 'month';
  const id = String(variantId);
  for (const config of Object.values(PLANS)) {
    if (config.legacy_alias_for) continue;
    if (!config.ls_variants) continue;
    if (config.ls_variants.month === id) return 'month';
    if (config.ls_variants.year === id) return 'year';
    if (config.ls_variants.once === id) return 'once';
  }
  return 'month';
};

// Shape-only introspection for the /api/subscription/config-check
// endpoint. NEVER returns secret values — only booleans and coarse
// hints so a misconfig can be diagnosed without exposing keys.
const inspectConfig = () => {
  const key = apiKey() || '';
  const sid = storeId() || '';
  const wh = webhookSecret() || '';
  // LS API keys are JWT-ish (three dot-separated base64 segments).
  // Anything else is almost certainly wrong / truncated / whitespace-padded.
  let keyShape = 'missing';
  if (key) {
    if (key !== key.trim()) keyShape = 'whitespace';
    else if (key.split('.').length === 3) keyShape = 'ok';
    else keyShape = 'wrong_shape';
  }
  const storeShape = !sid ? 'missing' : /^\d+$/.test(sid) ? 'ok' : 'wrong_shape';
  return {
    api_key_present: !!key,
    api_key_shape: keyShape,
    api_key_length: key.length,
    store_id_present: !!sid,
    store_id_shape: storeShape,
    webhook_secret_present: !!wh,
  };
};

// Live round-trip against LS /v1/users/me. Returns { ok, status, hint }.
// A 200 means the key is live and authorized; 401 means it's invalid/revoked.
// Never surfaces the response body — only the status code.
const pingApi = async () => {
  if (!apiKey()) return { ok: false, status: 0, hint: 'api_key_missing' };
  try {
    const res = await fetch(`${API_BASE}/users/me`, {
      headers: {
        Accept: 'application/vnd.api+json',
        Authorization: `Bearer ${apiKey()}`,
      },
    });
    let hint = 'ok';
    if (res.status === 401) hint = 'unauthenticated_check_key';
    else if (res.status === 403) hint = 'forbidden_check_scope';
    else if (!res.ok) hint = `unexpected_${res.status}`;
    return { ok: res.ok, status: res.status, hint };
  } catch (err) {
    return { ok: false, status: 0, hint: 'network_error' };
  }
};

module.exports = {
  getVariantId,
  createCheckout,
  verifyWebhook,
  mapStatus,
  inspectConfig,
  pingApi,
  findLatestSubscriptionByEmail,
  resolvePlanFromVariantId,
  resolveIntervalFromVariantId,
};
