// NOWPayments service
// Wraps the two NOWPayments interactions we use:
//   1. createInvoice() — opens a hosted crypto checkout (USDT TRC-20 etc).
//   2. verifyIpnSignature() — validates the HMAC-SHA512 signature on
//      Instant Payment Notification (IPN) webhooks.
//
// Funds are non-custodial: NOWPayments forwards payments straight to the
// payout wallet configured in their dashboard (Binance USDT TRC-20 here),
// so this code never touches private keys or balances.

const crypto = require('crypto');
const { PLANS } = require('./stripeService');

const API_BASE = 'https://api.nowpayments.io/v1';

const env = (k) => (process.env[k] || '').trim();

const inspectConfig = () => ({
  api_key_set: !!env('NOWPAYMENTS_API_KEY'),
  ipn_secret_set: !!env('NOWPAYMENTS_IPN_SECRET'),
});

// USD prices that mirror the canonical LS pricing ladder.
// PLANS in stripeService.js only stores variant IDs, not dollar amounts,
// so we keep crypto pricing here as the single source of truth for the
// NOWPayments rail.
const PRICES_USD = {
  starter: { once: 9 },
  pro: { month: 19, year: 149 },
  pro_voice: { month: 39, year: 299 },
  pro_plus: { month: 39, year: 299 }, // legacy alias for pro_voice
};

const getPriceUSD = (plan, interval) => {
  const p = PRICES_USD[plan];
  if (!p) return null;
  return p[interval] || null;
};

// Build the order_id we send to NOWPayments. The IPN payload echoes this
// back, so we encode the user, plan, and interval into it. A short random
// nonce makes each invoice unique even if the same user re-orders the
// same plan twice.
//
// Format: `{userId}|{plan}|{interval}|{nonce}` — under NOWPayments' 100-
// char limit for any realistic UUID.
const encodeOrderId = ({ userId, plan, interval }) => {
  const nonce = crypto.randomBytes(4).toString('hex');
  return `${userId}|${plan}|${interval}|${nonce}`;
};

const decodeOrderId = (orderId) => {
  if (!orderId || typeof orderId !== 'string') return null;
  const parts = orderId.split('|');
  if (parts.length < 3) return null;
  return { userId: parts[0], plan: parts[1], interval: parts[2] };
};

// POST /v1/payment — creates a direct crypto payment with the coin/
// network pre-locked to USDT TRC-20. Returns the deposit address and
// exact amount, so we can render our own payment UI on cvclimber.lol
// and the customer never sees NOWPayments' branding or asset chooser.
const createPayment = async ({ userId, plan, interval, ipnCallbackUrl }) => {
  const apiKey = env('NOWPAYMENTS_API_KEY');
  if (!apiKey) {
    const err = new Error('NOWPAYMENTS_API_KEY not configured');
    err.npHint = 'api_key_missing';
    throw err;
  }

  const priceUSD = getPriceUSD(plan, interval);
  if (!priceUSD) {
    const err = new Error(`No NOWPayments price for ${plan}/${interval}`);
    err.npHint = 'price_missing';
    throw err;
  }

  const orderId = encodeOrderId({ userId, plan, interval });

  const body = {
    price_amount: priceUSD,
    price_currency: 'usd',
    pay_currency: 'usdttrc20',
    order_id: orderId,
    order_description: `CvClimber ${PLANS[plan]?.name || plan} (${interval})`,
    ipn_callback_url: ipnCallbackUrl,
    is_fee_paid_by_user: false,
  };

  const r = await fetch(`${API_BASE}/payment`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!r.ok) {
    const text = await r.text().catch(() => '');
    const err = new Error(`NOWPayments payment ${r.status}: ${text.slice(0, 300)}`);
    err.npStatus = r.status;
    err.npBody = text;
    throw err;
  }

  const data = await r.json();
  if (!data?.pay_address || !data?.pay_amount) {
    const err = new Error('NOWPayments payment response missing pay_address/pay_amount');
    err.npBody = JSON.stringify(data).slice(0, 300);
    throw err;
  }
  return {
    paymentId: String(data.payment_id),
    payAddress: data.pay_address,
    payAmount: data.pay_amount,
    payCurrency: data.pay_currency,
    priceAmount: data.price_amount,
    priceCurrency: data.price_currency,
    orderId,
    expiresAt: data.expiration_estimate_date || null,
  };
};

// GET /v1/payment/{id} — used by the checkout page to poll status while
// the customer is sending the deposit.
const getPaymentStatus = async (paymentId) => {
  const apiKey = env('NOWPAYMENTS_API_KEY');
  if (!apiKey) throw new Error('NOWPAYMENTS_API_KEY not configured');

  const r = await fetch(`${API_BASE}/payment/${encodeURIComponent(paymentId)}`, {
    headers: { 'x-api-key': apiKey },
  });
  if (!r.ok) {
    const text = await r.text().catch(() => '');
    const err = new Error(`NOWPayments status ${r.status}: ${text.slice(0, 300)}`);
    err.npStatus = r.status;
    throw err;
  }
  const data = await r.json();
  return {
    status: data.payment_status,
    paymentId: String(data.payment_id),
    orderId: data.order_id || null,
  };
};

// IPN signature: HMAC-SHA512 of the JSON body with keys sorted
// alphabetically at every level, hex-encoded. NOWPayments sends the
// signature in the `x-nowpayments-sig` header.
const sortedStringify = (val) => {
  if (val === null || typeof val !== 'object') return JSON.stringify(val);
  if (Array.isArray(val)) return '[' + val.map(sortedStringify).join(',') + ']';
  const keys = Object.keys(val).sort();
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + sortedStringify(val[k])).join(',') + '}';
};

const verifyIpnSignature = (rawBody, signatureHeader) => {
  const secret = env('NOWPAYMENTS_IPN_SECRET');
  if (!secret) return { valid: false, reason: 'ipn_secret_missing' };
  if (!signatureHeader) return { valid: false, reason: 'signature_missing' };

  let parsed;
  try {
    parsed = JSON.parse(rawBody.toString('utf8'));
  } catch (e) {
    return { valid: false, reason: 'json_parse_failed' };
  }

  const sortedPayload = sortedStringify(parsed);
  const expected = crypto.createHmac('sha512', secret).update(sortedPayload).digest('hex');

  // constant-time compare — both buffers must be the same length to use
  // timingSafeEqual, otherwise it throws.
  const a = Buffer.from(expected, 'hex');
  let b;
  try {
    b = Buffer.from(signatureHeader, 'hex');
  } catch {
    return { valid: false, reason: 'signature_decode_failed' };
  }
  if (a.length !== b.length) return { valid: false, reason: 'signature_length_mismatch' };
  if (!crypto.timingSafeEqual(a, b)) return { valid: false, reason: 'signature_mismatch' };

  return { valid: true, payload: parsed };
};

// "Finished" or "confirmed" payment statuses — anything else (waiting,
// pending, partially_paid, failed, expired, refunded) does not grant
// entitlements. NOWPayments docs list ~10 statuses; we treat only the
// terminal-success ones as activation events.
const isPaidStatus = (status) => status === 'finished' || status === 'confirmed';

module.exports = {
  inspectConfig,
  getPriceUSD,
  createPayment,
  getPaymentStatus,
  verifyIpnSignature,
  decodeOrderId,
  isPaidStatus,
};
