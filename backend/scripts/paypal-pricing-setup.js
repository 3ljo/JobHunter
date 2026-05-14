#!/usr/bin/env node
// PayPal helper for the new pricing ladder.
//
// Usage:
//   node backend/scripts/paypal-pricing-setup.js ping
//       → exchanges client_credentials for an OAuth token. 200 means
//         your PAYPAL_CLIENT_ID/SECRET match PAYPAL_MODE.
//
//   node backend/scripts/paypal-pricing-setup.js list
//       → lists every product + plan on this PayPal account, prints
//         a copy-pasteable PAYPAL_PLAN_* env block.
//
//   node backend/scripts/paypal-pricing-setup.js create
//       → creates one Product ("CvClimber Subscription") and four Plans
//         (Pro $19/mo + $149/yr, Pro Voice $39/mo + $299/yr). Idempotent
//         on the product (re-uses existing if found by name); plans are
//         only created if no plan with the same name exists. Prints the
//         resulting PAYPAL_PLAN_* env block.
//
//   node backend/scripts/paypal-pricing-setup.js webhooks
//       → lists registered webhooks and their event subscriptions.
//
// Reads credentials from backend/.env (PAYPAL_MODE, PAYPAL_CLIENT_ID,
// PAYPAL_CLIENT_SECRET).

const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const SANDBOX_BASE = 'https://api-m.sandbox.paypal.com';
const LIVE_BASE = 'https://api-m.paypal.com';

const MODE = process.env.PAYPAL_MODE === 'live' ? 'live' : 'sandbox';
const API = MODE === 'live' ? LIVE_BASE : SANDBOX_BASE;
const CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Missing PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET in backend/.env');
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────
// Auth + fetch helpers
// ─────────────────────────────────────────────────────────────
async function getToken() {
  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  const res = await fetch(`${API}/v1/oauth2/token`, {
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
    throw new Error(`Token fetch ${res.status}: ${body}`);
  }
  const json = await res.json();
  return json.access_token;
}

async function pp(token, pathAndQuery, init = {}) {
  const res = await fetch(`${API}${pathAndQuery}`, {
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
    throw new Error(`${init.method || 'GET'} ${pathAndQuery} → ${res.status}: ${body}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// ─────────────────────────────────────────────────────────────
// Plan definitions — single source of truth for the script.
// ─────────────────────────────────────────────────────────────
const PRODUCT_NAME = 'CvClimber Subscription';
const PRODUCT_DESCRIPTION = 'CvClimber Pro and Pro Voice subscriptions';

const PLAN_DEFS = [
  { envKey: 'PAYPAL_PLAN_PRO_MONTHLY',       name: 'CvClimber Pro – Monthly',       interval: 'MONTH', price: '19.00' },
  { envKey: 'PAYPAL_PLAN_PRO_YEARLY',        name: 'CvClimber Pro – Yearly',        interval: 'YEAR',  price: '149.00' },
  { envKey: 'PAYPAL_PLAN_PRO_VOICE_MONTHLY', name: 'CvClimber Pro Voice – Monthly', interval: 'MONTH', price: '39.00' },
  { envKey: 'PAYPAL_PLAN_PRO_VOICE_YEARLY',  name: 'CvClimber Pro Voice – Yearly',  interval: 'YEAR',  price: '299.00' },
];

// ─────────────────────────────────────────────────────────────
// Commands
// ─────────────────────────────────────────────────────────────
async function pingCommand() {
  const token = await getToken();
  console.log(`OK — got access token (${MODE} mode). Length: ${token.length}.`);
}

async function listCommand() {
  const token = await getToken();
  console.log(`Fetching products + plans (${MODE} mode)…\n`);

  const products = await pp(token, '/v1/catalogs/products?page_size=20');
  const allProducts = products.products || [];

  if (!allProducts.length) {
    console.log('No products found. Run `create` to provision them.');
    return;
  }

  for (const product of allProducts) {
    console.log(`Product: ${product.name}  (id=${product.id})`);
    const plansJson = await pp(token, `/v1/billing/plans?product_id=${product.id}&page_size=20`);
    const plans = plansJson.plans || [];
    if (!plans.length) {
      console.log('  (no plans)');
      continue;
    }
    for (const plan of plans) {
      console.log(`  Plan: ${plan.name}  status=${plan.status}  id=${plan.id}`);
    }
    console.log('');
  }

  // Print env-var block by matching plan name → known plan defs
  const allPlans = [];
  for (const product of allProducts) {
    const plansJson = await pp(token, `/v1/billing/plans?product_id=${product.id}&page_size=20`);
    for (const p of (plansJson.plans || [])) allPlans.push(p);
  }
  console.log('# Copy-pasteable env block:');
  for (const def of PLAN_DEFS) {
    const match = allPlans.find((p) => p.name === def.name);
    console.log(`${def.envKey}=${match ? match.id : ''}`);
  }
}

async function findOrCreateProduct(token) {
  const products = await pp(token, '/v1/catalogs/products?page_size=20');
  const existing = (products.products || []).find((p) => p.name === PRODUCT_NAME);
  if (existing) {
    console.log(`Product "${PRODUCT_NAME}" already exists → ${existing.id}`);
    return existing.id;
  }
  console.log(`Creating product "${PRODUCT_NAME}"…`);
  const created = await pp(token, '/v1/catalogs/products', {
    method: 'POST',
    headers: { 'PayPal-Request-Id': crypto.randomBytes(16).toString('hex') },
    body: JSON.stringify({
      name: PRODUCT_NAME,
      description: PRODUCT_DESCRIPTION,
      type: 'SERVICE',
      category: 'SOFTWARE',
    }),
  });
  console.log(`  → ${created.id}`);
  return created.id;
}

async function findOrCreatePlan(token, productId, def) {
  const existing = await pp(token, `/v1/billing/plans?product_id=${productId}&page_size=20`);
  const found = (existing.plans || []).find((p) => p.name === def.name);
  if (found) {
    console.log(`Plan "${def.name}" already exists → ${found.id} (status=${found.status})`);
    return found.id;
  }
  console.log(`Creating plan "${def.name}"…`);
  const body = {
    product_id: productId,
    name: def.name,
    description: def.name,
    status: 'ACTIVE',
    billing_cycles: [
      {
        frequency: { interval_unit: def.interval, interval_count: 1 },
        tenure_type: 'REGULAR',
        sequence: 1,
        total_cycles: 0, // 0 = infinite
        pricing_scheme: { fixed_price: { value: def.price, currency_code: 'USD' } },
      },
    ],
    payment_preferences: {
      auto_bill_outstanding: true,
      setup_fee: { value: '0', currency_code: 'USD' },
      setup_fee_failure_action: 'CONTINUE',
      payment_failure_threshold: 3,
    },
  };
  const created = await pp(token, '/v1/billing/plans', {
    method: 'POST',
    headers: { 'PayPal-Request-Id': crypto.randomBytes(16).toString('hex') },
    body: JSON.stringify(body),
  });
  console.log(`  → ${created.id}`);
  return created.id;
}

async function createCommand() {
  const token = await getToken();
  console.log(`Provisioning PayPal product + plans (${MODE} mode)…\n`);

  const productId = await findOrCreateProduct(token);
  console.log('');
  const results = {};
  for (const def of PLAN_DEFS) {
    results[def.envKey] = await findOrCreatePlan(token, productId, def);
  }
  console.log('\n# Copy-pasteable env block:');
  for (const def of PLAN_DEFS) {
    console.log(`${def.envKey}=${results[def.envKey]}`);
  }
  console.log('\nNext: paste those into backend/.env, then register your webhook URL in');
  console.log('PayPal Developer Dashboard → Apps → (your app) → Webhooks, subscribing to:');
  console.log('  BILLING.SUBSCRIPTION.* and PAYMENT.SALE.COMPLETED / PAYMENT.SALE.DENIED');
  console.log('Then run `node backend/scripts/paypal-pricing-setup.js webhooks` to confirm.');
}

async function webhooksCommand() {
  const token = await getToken();
  const json = await pp(token, '/v1/notifications/webhooks');
  const hooks = json.webhooks || [];
  if (!hooks.length) {
    console.log('No webhooks registered. Add one in Developer Dashboard → Apps → Webhooks.');
    return;
  }
  for (const h of hooks) {
    console.log(`id=${h.id}  url=${h.url}`);
    for (const e of (h.event_types || [])) console.log(`  • ${e.name}`);
    console.log('');
  }
  if (hooks.length === 1) {
    console.log(`# Set this in backend/.env:\nPAYPAL_WEBHOOK_ID=${hooks[0].id}`);
  }
}

const cmd = process.argv[2];
const handlers = {
  ping: pingCommand,
  list: listCommand,
  create: createCommand,
  webhooks: webhooksCommand,
};

(async () => {
  if (!handlers[cmd]) {
    console.log('Usage: node backend/scripts/paypal-pricing-setup.js <ping|list|create|webhooks>');
    process.exit(cmd ? 1 : 0);
  }
  try {
    await handlers[cmd]();
  } catch (err) {
    console.error('\nERROR:', err.message);
    process.exit(1);
  }
})();
