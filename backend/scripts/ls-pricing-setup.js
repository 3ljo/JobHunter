#!/usr/bin/env node
// Lemon Squeezy helper for the new pricing ladder.
//
// Usage:
//   node backend/scripts/ls-pricing-setup.js list
//       → lists every product + variant in your store with name / price /
//         variant ID, and prints a copy-pasteable LEMONSQUEEZY_VARIANT_*=...
//         block you can drop into Vercel env vars.
//
//   node backend/scripts/ls-pricing-setup.js webhook
//       → lists your existing webhook(s), then PATCHes the first one found
//         to include `order_created` (keeping all subscription events).
//
// Reads credentials from backend/.env (LEMONSQUEEZY_API_KEY,
// LEMONSQUEEZY_STORE_ID). Safe to re-run — neither command mutates product
// data, and the webhook PATCH is idempotent.

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const API = 'https://api.lemonsqueezy.com/v1';
const API_KEY = process.env.LEMONSQUEEZY_API_KEY;
const STORE_ID = process.env.LEMONSQUEEZY_STORE_ID;

if (!API_KEY || !STORE_ID) {
  console.error('Missing LEMONSQUEEZY_API_KEY or LEMONSQUEEZY_STORE_ID in backend/.env');
  process.exit(1);
}

const HEADERS = {
  Accept: 'application/vnd.api+json',
  'Content-Type': 'application/vnd.api+json',
  Authorization: `Bearer ${API_KEY}`,
};

const USD = (cents) => `$${(Number(cents) / 100).toFixed(2)}`;

// Thin wrapper that throws on non-2xx with the LS error body attached.
async function lsFetch(pathAndQuery, init = {}) {
  const res = await fetch(`${API}${pathAndQuery}`, { ...init, headers: { ...HEADERS, ...(init.headers || {}) } });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${init.method || 'GET'} ${pathAndQuery} → ${res.status}: ${body}`);
  }
  return res.json();
}

// ─────────────────────────────────────────────────────────────
// list — dump products + variants with the env-var mapping
// ─────────────────────────────────────────────────────────────
async function listCommand() {
  console.log(`Fetching products for store ${STORE_ID}…\n`);

  const prodsJson = await lsFetch(`/products?filter[store_id]=${STORE_ID}&page[size]=100`);
  const products = prodsJson.data || [];

  if (!products.length) {
    console.log('No products found in this store.');
    return;
  }

  // Collect variants per product (parallel fetch).
  const productVariants = await Promise.all(
    products.map(async (p) => {
      const vJson = await lsFetch(`/variants?filter[product_id]=${p.id}&page[size]=100`);
      return { product: p, variants: vJson.data || [] };
    })
  );

  // Pretty-print. Skip "pending" / empty-name pseudo-variants LS sometimes creates.
  for (const { product, variants } of productVariants) {
    const pname = product.attributes?.name || '(unnamed)';
    console.log(`\n─── ${pname}  [product id: ${product.id}] ───`);
    if (!variants.length) {
      console.log('  (no variants)');
      continue;
    }
    for (const v of variants) {
      const a = v.attributes || {};
      if (a.status === 'pending') continue;
      const price = typeof a.price === 'number' ? USD(a.price) : '?';
      const interval = a.is_subscription
        ? `every ${a.interval_count || 1} ${a.interval || 'month'}${(a.interval_count || 1) > 1 ? 's' : ''}`
        : 'one-time';
      console.log(`  [${String(v.id).padEnd(8)}]  ${String(a.name || '').padEnd(12)}  ${price}  ${interval}`);
    }
  }

  // ─── Heuristic env-var mapping ───
  // Match by product name prefix + variant interval. Users who renamed things
  // oddly will just need to edit the block manually.
  console.log('\n\n════════════════════════════════════════════════════════════');
  console.log('Suggested Vercel env vars — verify the IDs below, then paste');
  console.log('════════════════════════════════════════════════════════════');

  const findVariant = (productNameMatch, predicate) => {
    for (const { product, variants } of productVariants) {
      const pname = (product.attributes?.name || '').toLowerCase();
      if (!pname.includes(productNameMatch)) continue;
      for (const v of variants) {
        const a = v.attributes || {};
        if (a.status === 'pending') continue;
        if (predicate(a)) return v.id;
      }
    }
    return null;
  };

  // Pro Voice first (more specific) so "pro" match doesn't steal it.
  const proVoiceMonthly = findVariant('pro voice', (a) => a.is_subscription && a.interval === 'month');
  const proVoiceYearly = findVariant('pro voice', (a) => a.is_subscription && a.interval === 'year');
  const proMonthly = findVariant('pro', (a) => a.is_subscription && a.interval === 'month' && !(a.product_name || '').toLowerCase().includes('voice'));
  const proYearly = findVariant('pro', (a) => a.is_subscription && a.interval === 'year' && !(a.product_name || '').toLowerCase().includes('voice'));
  // For "pro" ambiguity, fall back: iterate non-voice products.
  const findNonVoice = (predicate) => {
    for (const { product, variants } of productVariants) {
      const pname = (product.attributes?.name || '').toLowerCase();
      if (!pname.includes('pro') || pname.includes('voice') || pname.includes('pass')) continue;
      for (const v of variants) {
        const a = v.attributes || {};
        if (a.status === 'pending') continue;
        if (predicate(a)) return v.id;
      }
    }
    return null;
  };
  const proMonthlyFinal = proMonthly || findNonVoice((a) => a.is_subscription && a.interval === 'month');
  const proYearlyFinal = proYearly || findNonVoice((a) => a.is_subscription && a.interval === 'year');

  const starter = findVariant('pass', (a) => !a.is_subscription);

  const row = (k, v) => `${k}=${v ?? '<MISSING — fill in manually>'}`;
  console.log(row('LEMONSQUEEZY_VARIANT_PRO_MONTHLY', proMonthlyFinal));
  console.log(row('LEMONSQUEEZY_VARIANT_PRO_YEARLY', proYearlyFinal));
  console.log(row('LEMONSQUEEZY_VARIANT_PRO_VOICE_MONTHLY', proVoiceMonthly));
  console.log(row('LEMONSQUEEZY_VARIANT_PRO_VOICE_YEARLY', proVoiceYearly));
  console.log(row('LEMONSQUEEZY_VARIANT_STARTER_PASS', starter));
  console.log('════════════════════════════════════════════════════════════\n');
}

// ─────────────────────────────────────────────────────────────
// webhook — ensure `order_created` is in the events list
// ─────────────────────────────────────────────────────────────
async function webhookCommand() {
  const REQUIRED_EVENTS = [
    'subscription_created',
    'subscription_updated',
    'subscription_cancelled',
    'subscription_resumed',
    'subscription_expired',
    'subscription_payment_success',
    'subscription_payment_failed',
    'order_created',
  ];

  console.log(`Fetching webhooks for store ${STORE_ID}…\n`);
  const whJson = await lsFetch(`/webhooks?filter[store_id]=${STORE_ID}&page[size]=100`);
  const hooks = whJson.data || [];

  if (!hooks.length) {
    console.log('No webhooks found. Create one in the LS dashboard first:');
    console.log('  Settings → Webhooks → Add endpoint');
    console.log('  URL: <your backend>/api/subscription/webhook');
    console.log('  Signing secret: same as LEMONSQUEEZY_WEBHOOK_SECRET in your env');
    process.exit(1);
  }

  // Show what's there.
  console.log('Existing webhooks:');
  for (const h of hooks) {
    const a = h.attributes || {};
    console.log(`  [${h.id}]  ${a.url}`);
    console.log(`     events: ${(a.events || []).join(', ') || '(none)'}`);
  }

  // Update each one that's missing required events.
  for (const h of hooks) {
    const current = new Set(h.attributes?.events || []);
    const merged = Array.from(new Set([...current, ...REQUIRED_EVENTS]));
    const changed = merged.length !== current.size;
    if (!changed) {
      console.log(`\n[${h.id}] already has all required events — no change.`);
      continue;
    }

    const body = {
      data: {
        type: 'webhooks',
        id: String(h.id),
        attributes: { events: merged },
      },
    };

    await lsFetch(`/webhooks/${h.id}`, { method: 'PATCH', body: JSON.stringify(body) });
    console.log(`\n[${h.id}] updated — events now: ${merged.join(', ')}`);
  }

  console.log('\nDone. Webhook(s) now listen for order_created (required for the 7-Day Pass).');
}

// ─────────────────────────────────────────────────────────────
async function main() {
  const cmd = (process.argv[2] || '').toLowerCase();
  if (cmd === 'list')    return listCommand();
  if (cmd === 'webhook') return webhookCommand();
  console.log('Usage:');
  console.log('  node backend/scripts/ls-pricing-setup.js list');
  console.log('  node backend/scripts/ls-pricing-setup.js webhook');
  process.exit(1);
}

main().catch((err) => {
  console.error('\nERROR:', err.message);
  process.exit(1);
});
