// PayPal Service
// - Acquires OAuth access tokens (client_credentials grant, cached).
// - Creates Subscriptions API checkouts (returns the approve URL).
// - Fetches/cancels subscriptions for resync + customer portal.
// - Verifies inbound webhook signatures via PayPal's verify endpoint.
// - Maps PayPal status strings to our internal enum.
//
// Sandbox vs live is controlled by PAYPAL_MODE ('sandbox' | 'live').
// All other env vars are mode-agnostic — swap the credentials, not the code.

const { PLANS } = require('./stripeService');

const SANDBOX_BASE = 'https://api-m.sandbox.paypal.com';
const LIVE_BASE = 'https://api-m.paypal.com';

const apiBase = () => (process.env.PAYPAL_MODE === 'live' ? LIVE_BASE : SANDBOX_BASE);
const clientId = () => process.env.PAYPAL_CLIENT_ID;
const clientSecret = () => process.env.PAYPAL_CLIENT_SECRET;
const webhookId = () => process.env.PAYPAL_WEBHOOK_ID;

// Token cache. PayPal tokens last ~9h; we re-fetch a minute before expiry
// to avoid a thundering-herd refresh under load.
let tokenCache = { token: null, expiresAt: 0 };

const getAccessToken = async () => {
  if (tokenCache.token && Date.now() < tokenCache.expiresAt - 60_000) {
    return tokenCache.token;
  }
  if (!clientId() || !clientSecret()) {
    const e = new Error('PayPal not configured: PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET missing');
    e.ppHint = 'credentials_missing';
    throw e;
  }
  const basic = Buffer.from(`${clientId()}:${clientSecret()}`).toString('base64');
  const res = await fetch(`${apiBase()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) {
    const body = await res.text();
    const e = new Error(`PayPal token fetch failed (${res.status}): ${body}`);
    e.ppStatus = res.status;
    throw e;
  }
  const json = await res.json();
  tokenCache = {
    token: json.access_token,
    expiresAt: Date.now() + (json.expires_in || 0) * 1000,
  };
  return tokenCache.token;
};

// Look up the PayPal plan ID for a (plan, interval) combination.
// PayPal subscriptions only — one-time `starter` is not exposed here.
const getPlanId = (plan, interval) => {
  const config = PLANS[plan];
  if (!config || !config.paypal_plans) return null;
  return config.paypal_plans[interval] || null;
};

// Thin wrapper that throws on non-2xx with the PayPal error body attached.
// PayPal-Request-Id is supplied by callers when they want idempotency on
// state-changing requests.
const ppFetch = async (path, init = {}) => {
  const token = await getAccessToken();
  const res = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    const err = new Error(`PayPal ${init.method || 'GET'} ${path} → ${res.status}: ${body}`);
    err.ppStatus = res.status;
    err.ppBody = body;
    throw err;
  }
  // Some endpoints (DELETE / cancel) return 204 No Content.
  if (res.status === 204) return null;
  return res.json();
};

// Create a PayPal subscription. Returns { id, approveUrl } — frontend
// redirects the user to approveUrl; PayPal sends them back to returnUrl
// once approved. The webhook is the source of truth for activation —
// don't trust the redirect alone.
const createSubscription = async ({ planId, userId, plan, interval, email, returnUrl, cancelUrl, custom }) => {
  if (!planId) {
    throw new Error(`PayPal plan ID missing for plan=${plan}, interval=${interval}`);
  }
  const customId = JSON.stringify({ user_id: userId, plan, interval, ...(custom || {}) });
  const body = {
    plan_id: planId,
    custom_id: customId,
    application_context: {
      brand_name: 'CvClimber',
      user_action: 'SUBSCRIBE_NOW',
      payment_method: {
        payer_selected: 'PAYPAL',
        payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED',
      },
      return_url: returnUrl,
      cancel_url: cancelUrl,
    },
  };
  if (email) body.subscriber = { email_address: email };
  const json = await ppFetch('/v1/billing/subscriptions', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  const approve = (json.links || []).find((l) => l.rel === 'approve');
  if (!approve?.href) {
    throw new Error('PayPal returned no approve URL');
  }
  return { id: json.id, approveUrl: approve.href, raw: json };
};

const getSubscription = async (subId) => {
  if (!subId) return null;
  return ppFetch(`/v1/billing/subscriptions/${encodeURIComponent(subId)}`);
};

const cancelSubscription = async (subId, reason = 'User requested cancellation') => {
  if (!subId) throw new Error('subId required');
  await ppFetch(`/v1/billing/subscriptions/${encodeURIComponent(subId)}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
};

// Verify a webhook by handing the headers + raw body back to PayPal's
// /v1/notifications/verify-webhook-signature endpoint. This is the
// official path — there's no offline HMAC scheme like LS/Stripe.
// Returns true only on `VERIFICATION_STATUS: SUCCESS`.
const verifyWebhook = async (headers, rawBody) => {
  if (!webhookId()) {
    console.warn('PayPal webhook verification skipped — PAYPAL_WEBHOOK_ID not set');
    return false;
  }
  const headerLower = Object.fromEntries(
    Object.entries(headers || {}).map(([k, v]) => [k.toLowerCase(), v])
  );
  const requiredHeaders = [
    'paypal-auth-algo',
    'paypal-cert-url',
    'paypal-transmission-id',
    'paypal-transmission-sig',
    'paypal-transmission-time',
  ];
  for (const h of requiredHeaders) {
    if (!headerLower[h]) {
      console.error(`PayPal webhook missing header: ${h}`);
      return false;
    }
  }
  let event;
  try {
    event = JSON.parse(rawBody.toString('utf8'));
  } catch {
    return false;
  }
  try {
    const json = await ppFetch('/v1/notifications/verify-webhook-signature', {
      method: 'POST',
      body: JSON.stringify({
        auth_algo: headerLower['paypal-auth-algo'],
        cert_url: headerLower['paypal-cert-url'],
        transmission_id: headerLower['paypal-transmission-id'],
        transmission_sig: headerLower['paypal-transmission-sig'],
        transmission_time: headerLower['paypal-transmission-time'],
        webhook_id: webhookId(),
        webhook_event: event,
      }),
    });
    return json?.verification_status === 'SUCCESS';
  } catch (err) {
    console.error('PayPal webhook verification call failed:', err.message);
    return false;
  }
};

// PayPal subscription states → our internal status enum.
// https://developer.paypal.com/docs/api/subscriptions/v1/#subscriptions_get
const mapStatus = (ppStatus) => {
  switch (ppStatus) {
    case 'ACTIVE':            return 'active';
    case 'APPROVAL_PENDING':  return 'incomplete';
    case 'APPROVED':          return 'incomplete';
    case 'SUSPENDED':         return 'past_due';
    case 'CANCELLED':         return 'canceled';
    case 'EXPIRED':           return 'canceled';
    default:                  return 'active';
  }
};

const resolvePlanFromPlanId = (planId) => {
  if (!planId) return 'free';
  for (const [planKey, config] of Object.entries(PLANS)) {
    if (config.legacy_alias_for) continue;
    if (!config.paypal_plans) continue;
    if (config.paypal_plans.month === planId || config.paypal_plans.year === planId) {
      return planKey;
    }
  }
  return 'free';
};

const resolveIntervalFromPlanId = (planId) => {
  if (!planId) return 'month';
  for (const config of Object.values(PLANS)) {
    if (config.legacy_alias_for) continue;
    if (!config.paypal_plans) continue;
    if (config.paypal_plans.month === planId) return 'month';
    if (config.paypal_plans.year === planId) return 'year';
  }
  return 'month';
};

// Shape-only introspection for /api/subscription/config-check. Never
// returns secret values.
const inspectConfig = () => {
  const cid = clientId() || '';
  const sec = clientSecret() || '';
  const wh = webhookId() || '';
  return {
    mode: process.env.PAYPAL_MODE === 'live' ? 'live' : 'sandbox',
    client_id_present: !!cid,
    client_id_length: cid.length,
    client_secret_present: !!sec,
    webhook_id_present: !!wh,
  };
};

// Live round-trip — fetch a token. 401 means the credentials are wrong
// for the chosen mode (most common cause: live keys against sandbox base).
const pingApi = async () => {
  if (!clientId() || !clientSecret()) {
    return { ok: false, status: 0, hint: 'credentials_missing' };
  }
  try {
    tokenCache = { token: null, expiresAt: 0 };
    await getAccessToken();
    return { ok: true, status: 200, hint: 'ok' };
  } catch (err) {
    let hint = 'network_error';
    if (err.ppStatus === 401) hint = 'unauthenticated_check_keys_or_mode';
    else if (err.ppStatus) hint = `unexpected_${err.ppStatus}`;
    return { ok: false, status: err.ppStatus || 0, hint };
  }
};

module.exports = {
  getAccessToken,
  getPlanId,
  createSubscription,
  getSubscription,
  cancelSubscription,
  verifyWebhook,
  mapStatus,
  resolvePlanFromPlanId,
  resolveIntervalFromPlanId,
  inspectConfig,
  pingApi,
};
