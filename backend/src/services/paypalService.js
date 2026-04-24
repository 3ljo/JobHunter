// PayPal Payouts API wrapper.
//
// Docs: https://developer.paypal.com/docs/api/payments.payouts-batch/v1/
//
// Modes:
//   sandbox → https://api-m.sandbox.paypal.com   (fake PayPal accounts, no real $)
//   live    → https://api-m.paypal.com
// Flip via PAYPAL_MODE env var.
//
// Credentials:
//   PAYPAL_CLIENT_ID     — REST app's Client ID (NOT the webhook ID)
//   PAYPAL_CLIENT_SECRET — REST app's Secret
// Get both from https://developer.paypal.com → My Apps & Credentials.
// Sandbox and Live have SEPARATE credentials; don't mix them.
//
// This file owns:
//   - getAccessToken()        OAuth2 client_credentials → bearer token (cached)
//   - createPayout()          sends money to one PayPal email
//   - getPayoutBatchStatus()  polls batch status (for reconciliation)
//   - inspectConfig()         shape-only diagnostic (never returns secrets)
//   - pingApi()               liveness round-trip; returns status+hint

const SANDBOX_BASE = 'https://api-m.sandbox.paypal.com';
const LIVE_BASE = 'https://api-m.paypal.com';

const mode = () => (process.env.PAYPAL_MODE || 'sandbox').toLowerCase();
const apiBase = () => (mode() === 'live' ? LIVE_BASE : SANDBOX_BASE);
const clientId = () => process.env.PAYPAL_CLIENT_ID;
const clientSecret = () => process.env.PAYPAL_CLIENT_SECRET;

// Simple in-memory token cache — PayPal tokens live ~9h. We refresh
// at 95% of TTL so we never send a request with an expired token.
let cachedToken = null;
let cachedExpiresAt = 0;

async function getAccessToken() {
  if (!clientId() || !clientSecret()) {
    const err = new Error('PayPal not configured: PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET missing');
    err.ppHint = 'not_configured';
    throw err;
  }
  if (cachedToken && Date.now() < cachedExpiresAt) return cachedToken;

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
    const err = new Error(`PayPal OAuth failed (${res.status})`);
    err.ppStatus = res.status;
    err.ppBody = body;
    err.ppHint =
      res.status === 401 ? 'bad_credentials' :
      res.status === 403 ? 'forbidden' :
      'oauth_failed';
    throw err;
  }

  const json = await res.json();
  cachedToken = json.access_token;
  cachedExpiresAt = Date.now() + (json.expires_in || 3600) * 950; // 95% of TTL
  return cachedToken;
}

// Send one payout to one email. Amount is a DOLLAR string, not cents
// (PayPal's API takes "20.00" not 2000).
//
// Args:
//   { email, amountCents, currency='USD', senderNote, recipientNote, senderBatchId }
// Returns:
//   { batchId, itemId, batchStatus, raw }
//
// senderBatchId MUST be unique across your entire PayPal account history
// (PayPal dedupes replays by this). We pass the referral_payouts.id which
// is a UUID, so replays can't re-send.
async function createPayout({
  email,
  amountCents,
  currency = 'USD',
  senderNote = 'Referral reward — thanks for sharing!',
  recipientNote,
  senderBatchId,
}) {
  if (!email) throw new Error('createPayout: email required');
  if (!amountCents || amountCents <= 0) throw new Error('createPayout: amountCents must be > 0');
  if (!senderBatchId) throw new Error('createPayout: senderBatchId required for idempotency');

  const token = await getAccessToken();
  const amount = (amountCents / 100).toFixed(2);

  const body = {
    sender_batch_header: {
      sender_batch_id: senderBatchId,
      email_subject: 'You have a payout from CvClimber!',
      email_message: senderNote,
    },
    items: [
      {
        recipient_type: 'EMAIL',
        amount: { value: amount, currency },
        note: recipientNote || senderNote,
        receiver: email,
        sender_item_id: senderBatchId, // echo back in status queries
      },
    ],
  };

  const res = await fetch(`${apiBase()}/v1/payments/payouts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  const responseText = await res.text();
  let parsed;
  try { parsed = JSON.parse(responseText); } catch { parsed = { raw: responseText }; }

  if (!res.ok) {
    const err = new Error(`PayPal payout failed (${res.status})`);
    err.ppStatus = res.status;
    err.ppBody = parsed;
    // Common PayPal error names → a hint we can surface upstream.
    const name = parsed?.name || '';
    err.ppHint =
      name === 'AUTHENTICATION_FAILURE' ? 'bad_credentials' :
      name === 'INSUFFICIENT_FUNDS' ? 'insufficient_funds' :
      name === 'RECEIVER_UNREGISTERED' ? 'recipient_not_paypal' :
      name === 'VALIDATION_ERROR' ? 'validation_error' :
      name === 'DUPLICATE_REQUEST_ID' ? 'duplicate_batch' :
      'payout_failed';
    throw err;
  }

  const batchId = parsed?.batch_header?.payout_batch_id;
  const batchStatus = parsed?.batch_header?.batch_status;
  const items = Array.isArray(parsed?.items) ? parsed.items : [];
  const itemId = items[0]?.payout_item_id;

  return {
    batchId: batchId || null,
    itemId: itemId || null,
    batchStatus: batchStatus || null,
    raw: parsed,
  };
}

// Poll a batch's current status. Used by reconciliation — after we
// POST a payout, the batch typically starts in PENDING and flips to
// SUCCESS or one of the failure states (DENIED, BLOCKED, REFUNDED,
// RETURNED, UNCLAIMED) within seconds-to-days.
async function getPayoutBatchStatus(batchId) {
  if (!batchId) throw new Error('getPayoutBatchStatus: batchId required');
  const token = await getAccessToken();
  const res = await fetch(`${apiBase()}/v1/payments/payouts/${encodeURIComponent(batchId)}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  const body = await res.text();
  let parsed;
  try { parsed = JSON.parse(body); } catch { parsed = { raw: body }; }
  if (!res.ok) {
    const err = new Error(`PayPal status query failed (${res.status})`);
    err.ppStatus = res.status;
    err.ppBody = parsed;
    throw err;
  }
  return parsed;
}

// Shape-only config introspection for the admin diagnostic endpoint.
// Never returns secret values.
function inspectConfig() {
  const id = clientId() || '';
  const secret = clientSecret() || '';
  const hasId = !!id;
  const hasSecret = !!secret;
  return {
    mode: mode(),
    api_base: apiBase(),
    client_id_present: hasId,
    client_id_length: id.length,
    client_secret_present: hasSecret,
    client_secret_length: secret.length,
  };
}

// Round-trip OAuth to verify the credentials actually work. Returns
// { ok, status, hint }. Safe to call from an admin diagnostic button.
async function pingApi() {
  try {
    await getAccessToken();
    return { ok: true, status: 200, hint: 'ok' };
  } catch (err) {
    return {
      ok: false,
      status: err.ppStatus || 0,
      hint: err.ppHint || 'unknown',
    };
  }
}

module.exports = {
  createPayout,
  getPayoutBatchStatus,
  inspectConfig,
  pingApi,
  // Exposed for tests / diagnostics.
  _mode: mode,
  _apiBase: apiBase,
};
