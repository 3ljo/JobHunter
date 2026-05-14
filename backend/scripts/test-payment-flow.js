#!/usr/bin/env node
// Payment-flow integration test + self-heal.
//
// Runs the same resolution logic the webhook handler uses against the
// MOST RECENT real Lemon Squeezy orders and subscriptions, then reports
// what the webhook would have done. Helps catch silent activation
// failures before customers notice.
//
// Usage:
//   node backend/scripts/test-payment-flow.js
//       → dry-run: prints what each order/sub would activate, with the
//         resolved user_id, plan, expiry. No DB writes.
//
//   node backend/scripts/test-payment-flow.js --apply
//       → for any LS order/sub that has a paid status but no matching
//         DB subscription row, applies the upsert (self-heals stuck users).
//
//   node backend/scripts/test-payment-flow.js --signature
//       → additionally sends a signed test webhook to the production
//         endpoint to verify signature verification matches end-to-end.
//
// Safe to run multiple times. All upserts use onConflict=user_id.

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const crypto = require('crypto');

const supabase = require('../src/services/supabaseClient');
const ls = require('../src/services/lemonSqueezyService');
const { PLANS } = require('../src/services/stripeService');

const APPLY     = process.argv.includes('--apply');
const SIGNATURE = process.argv.includes('--signature');

const API_BASE = 'https://api.lemonsqueezy.com/v1';
const KEY = process.env.LEMONSQUEEZY_API_KEY;
const STORE = process.env.LEMONSQUEEZY_STORE_ID;
const WEBHOOK_SECRET = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
const PROD_WEBHOOK_URL = 'https://jobhunter-r46b.onrender.com/api/subscription/webhook';

if (!KEY || !STORE) {
  console.error('Missing LEMONSQUEEZY_API_KEY or LEMONSQUEEZY_STORE_ID in .env');
  process.exit(1);
}

const HEADERS = { Accept: 'application/vnd.api+json', Authorization: `Bearer ${KEY}` };
const fetchJson = (u) => fetch(u, { headers: HEADERS }).then((r) => r.json());

const dim = (s) => `\x1b[2m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
const grn = (s) => `\x1b[32m${s}\x1b[0m`;
const yel = (s) => `\x1b[33m${s}\x1b[0m`;
const bold = (s) => `\x1b[1m${s}\x1b[0m`;

// ─────────────────────────────────────────────────────────────────────
// Step 1: Sanity-check environment + LS connectivity
// ─────────────────────────────────────────────────────────────────────
async function checkEnvironment() {
  console.log(bold('\n=== Environment ==='));
  const checks = [
    ['SUPABASE_URL', !!process.env.SUPABASE_URL],
    ['SUPABASE_SERVICE_ROLE_KEY', !!process.env.SUPABASE_SERVICE_ROLE_KEY],
    ['LEMONSQUEEZY_API_KEY', !!KEY, KEY ? `len=${KEY.length}` : 'missing'],
    ['LEMONSQUEEZY_STORE_ID', !!STORE, STORE],
    ['LEMONSQUEEZY_WEBHOOK_SECRET', !!WEBHOOK_SECRET, WEBHOOK_SECRET ? `len=${WEBHOOK_SECRET.length}` : 'missing'],
  ];
  let allOk = true;
  for (const [name, ok, detail] of checks) {
    const mark = ok ? grn('✓') : red('✗');
    console.log(`  ${mark} ${name}${detail ? dim(` (${detail})`) : ''}`);
    if (!ok) allOk = false;
  }
  return allOk;
}

async function checkLsReachable() {
  console.log(bold('\n=== Lemon Squeezy API ==='));
  try {
    const r = await fetch(`${API_BASE}/users/me`, { headers: HEADERS });
    if (r.ok) {
      console.log(`  ${grn('✓')} authenticated`);
      return true;
    }
    console.log(`  ${red('✗')} /users/me → HTTP ${r.status}`);
    return false;
  } catch (err) {
    console.log(`  ${red('✗')} request failed: ${err.message}`);
    return false;
  }
}

async function checkWebhookConfig() {
  console.log(bold('\n=== Webhook configuration ==='));
  const j = await fetchJson(`${API_BASE}/webhooks?filter[store_id]=${STORE}`);
  const hooks = j.data || [];
  if (hooks.length === 0) {
    console.log(`  ${red('✗')} no webhook configured`);
    return false;
  }
  for (const h of hooks) {
    const a = h.attributes || {};
    const urlOk = a.url === PROD_WEBHOOK_URL;
    const eventsOk = (a.events || []).includes('order_created') &&
                     (a.events || []).includes('subscription_created');
    console.log(`  webhook #${h.id}`);
    console.log(`    url:      ${a.url} ${urlOk ? grn('✓') : red('✗ should be ' + PROD_WEBHOOK_URL)}`);
    console.log(`    events:   ${(a.events || []).length} subscribed ${eventsOk ? grn('✓') : red('✗ missing order_created or subscription_created')}`);
    console.log(`    test_mode: ${a.test_mode ? yel('TEST') : grn('LIVE')}`);
    console.log(`    last_sent: ${a.last_sent_at || dim('never')}`);
  }
  return true;
}

async function checkVariants() {
  console.log(bold('\n=== Plan variants ==='));
  const want = [
    ['LEMONSQUEEZY_VARIANT_STARTER_PASS',         'starter',     'once'],
    ['LEMONSQUEEZY_VARIANT_PRO_MONTHLY',          'pro',         'month'],
    ['LEMONSQUEEZY_VARIANT_PRO_QUARTERLY',        'pro',         'quarter'],
    ['LEMONSQUEEZY_VARIANT_PRO_YEARLY',           'pro',         'year'],
    ['LEMONSQUEEZY_VARIANT_PRO_VOICE_MONTHLY',    'pro_voice',   'month'],
    ['LEMONSQUEEZY_VARIANT_PRO_VOICE_QUARTERLY',  'pro_voice',   'quarter'],
    ['LEMONSQUEEZY_VARIANT_PRO_VOICE_YEARLY',     'pro_voice',   'year'],
  ];
  let allOk = true;
  for (const [envKey, plan, interval] of want) {
    const id = process.env[envKey];
    if (!id) {
      console.log(`  ${red('✗')} ${envKey} not set`);
      allOk = false;
      continue;
    }
    try {
      const r = await fetchJson(`${API_BASE}/variants/${id}`);
      const a = r.data?.attributes;
      if (!a) {
        console.log(`  ${red('✗')} ${envKey}=${id} not found in LS`);
        allOk = false;
        continue;
      }
      const statusOk = a.status === 'published';
      const reverse = ls.resolvePlanFromVariantId(id);
      const planOk = reverse === plan;
      console.log(`  ${(statusOk && planOk) ? grn('✓') : red('✗')} ${envKey}=${id} ` +
        dim(`name="${a.name}" status=${a.status} resolves_to=${reverse} expected=${plan}/${interval}`));
      if (!statusOk || !planOk) allOk = false;
    } catch (err) {
      console.log(`  ${red('✗')} ${envKey}=${id} fetch failed: ${err.message}`);
      allOk = false;
    }
  }
  return allOk;
}

// ─────────────────────────────────────────────────────────────────────
// Step 2: Walk the most recent orders + subscriptions and verify each
// would activate the right user → plan in the DB.
// ─────────────────────────────────────────────────────────────────────
async function auditOrders() {
  console.log(bold('\n=== Recent LS orders (last 10) ==='));
  const j = await fetchJson(`${API_BASE}/orders?filter[store_id]=${STORE}&page[size]=10`);
  const rows = j.data || [];
  if (rows.length === 0) {
    console.log(dim('  no orders yet'));
    return 0;
  }
  let healed = 0;
  for (const r of rows) {
    const a = r.attributes || {};
    if (a.status !== 'paid') {
      console.log(`  ${dim(r.id)} ${a.status} (skip)`);
      continue;
    }
    const variantId = a?.first_order_item?.variant_id;
    const plan = ls.resolvePlanFromVariantId(variantId);
    const planOk = plan && plan !== 'free' && PLANS[plan]?.billing_type === 'one_time';
    const email = (a.user_email || '').toLowerCase().trim();

    let userId = null;
    let userSrc = null;
    if (a.custom_data?.user_id) {
      userId = a.custom_data.user_id;
      userSrc = 'custom_data';
    } else if (email) {
      try {
        userId = await supabase.findUserIdByEmail(email);
        if (userId) userSrc = 'email-fallback';
      } catch { /* noop */ }
    }

    if (!planOk) {
      console.log(`  ${yel('!')} order ${r.id} variant=${variantId} → unknown one-time plan, skipping`);
      continue;
    }
    if (!userId) {
      console.log(`  ${red('✗')} order ${r.id} variant=${variantId} plan=${plan} email=${email} → ${red('user not found')}`);
      continue;
    }

    // Check DB state — does this user already have the pass?
    const { data: existing } = await supabase
      .from('subscriptions')
      .select('plan, status, current_period_end')
      .eq('user_id', userId)
      .maybeSingle();

    const expectedExpiry = new Date(new Date(a.created_at).getTime() + (PLANS[plan].pass_duration_days || 7) * 24 * 3600 * 1000);
    const stillActive = expectedExpiry.getTime() > Date.now();
    const dbActive = existing?.status === 'active' && existing?.plan === plan;

    if (stillActive && !dbActive) {
      // Stuck — would self-heal
      console.log(`  ${red('✗ STUCK')} order ${r.id} → user ${userId} (${userSrc}) plan=${plan} should be active until ${expectedExpiry.toISOString().slice(0,10)} — DB has ${existing?.plan || 'free'}`);
      if (APPLY) {
        const { error } = await supabase.from('subscriptions').upsert({
          user_id: userId,
          lemonsqueezy_customer_id: a.customer_id ? String(a.customer_id) : null,
          lemonsqueezy_subscription_id: null,
          lemonsqueezy_portal_url: null,
          plan,
          billing_interval: 'once',
          status: 'active',
          current_period_start: a.created_at,
          current_period_end: expectedExpiry.toISOString(),
          cancel_at_period_end: false,
          provider: 'lemonsqueezy',
        }, { onConflict: 'user_id' });
        if (error) {
          console.log(`     ${red('upsert failed:')} ${error.message}`);
        } else {
          console.log(`     ${grn('healed →')} ${plan} activated until ${expectedExpiry.toISOString().slice(0,10)}`);
          healed++;
        }
      }
    } else if (stillActive && dbActive) {
      console.log(`  ${grn('✓')} order ${r.id} → user ${userId} ${dim(`(${userSrc})`)} plan=${plan} ${dim(`active until ${existing.current_period_end?.slice(0,10)}`)}`);
    } else {
      console.log(`  ${dim('•')} order ${r.id} → ${plan} expired ${dim(expectedExpiry.toISOString().slice(0,10))}`);
    }
  }
  return healed;
}

async function auditSubscriptions() {
  console.log(bold('\n=== Recent LS subscriptions (last 10) ==='));
  const j = await fetchJson(`${API_BASE}/subscriptions?filter[store_id]=${STORE}&page[size]=10`);
  const rows = j.data || [];
  if (rows.length === 0) {
    console.log(dim('  no subscriptions yet'));
    return 0;
  }
  let healed = 0;
  for (const r of rows) {
    const a = r.attributes || {};
    const variantId = a.variant_id;
    const plan = ls.resolvePlanFromVariantId(variantId);
    const interval = ls.resolveIntervalFromVariantId(variantId);
    const email = (a.user_email || '').toLowerCase().trim();

    // Try lemonsqueezy_subscription_id first (matches webhook lookup order).
    let userId = null;
    let userSrc = null;
    const { data: byId } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('lemonsqueezy_subscription_id', r.id)
      .maybeSingle();
    if (byId?.user_id) {
      userId = byId.user_id;
      userSrc = 'subscription_id';
    } else if (email) {
      try {
        userId = await supabase.findUserIdByEmail(email);
        if (userId) userSrc = 'email-fallback';
      } catch { /* noop */ }
    }

    if (!userId) {
      console.log(`  ${red('✗')} sub ${r.id} variant=${variantId} email=${email} → ${red('user not found')}`);
      continue;
    }
    if (!plan || plan === 'free') {
      console.log(`  ${yel('!')} sub ${r.id} variant=${variantId} → unknown plan, skipping`);
      continue;
    }

    const { data: existing } = await supabase
      .from('subscriptions')
      .select('plan, status, lemonsqueezy_subscription_id')
      .eq('user_id', userId)
      .maybeSingle();

    const lsActive = a.status === 'active' || a.status === 'on_trial';
    const dbMatches = existing?.lemonsqueezy_subscription_id === r.id &&
                      existing?.plan === plan &&
                      ls.mapStatus(a.status) === existing?.status;

    if (lsActive && !dbMatches) {
      console.log(`  ${red('✗ STUCK')} sub ${r.id} → user ${userId} (${userSrc}) plan=${plan}/${interval} ${dim(`LS=${a.status} DB=${existing?.status || 'none'}`)}`);
      if (APPLY) {
        const { error } = await supabase.from('subscriptions').upsert({
          user_id: userId,
          lemonsqueezy_customer_id: a.customer_id ? String(a.customer_id) : null,
          lemonsqueezy_subscription_id: r.id,
          lemonsqueezy_portal_url: a?.urls?.customer_portal || null,
          plan,
          billing_interval: interval,
          status: ls.mapStatus(a.status),
          current_period_start: a.created_at,
          current_period_end: a.renews_at || a.ends_at,
          cancel_at_period_end: a.cancelled === true,
          provider: 'lemonsqueezy',
        }, { onConflict: 'user_id' });
        if (error) {
          console.log(`     ${red('upsert failed:')} ${error.message}`);
        } else {
          console.log(`     ${grn('healed →')} ${plan}/${interval} = ${a.status}`);
          healed++;
        }
      }
    } else if (lsActive && dbMatches) {
      console.log(`  ${grn('✓')} sub ${r.id} → user ${userId} ${dim(`(${userSrc})`)} plan=${plan}/${interval} ${dim(a.status)}`);
    } else {
      console.log(`  ${dim('•')} sub ${r.id} status=${a.status} ${dim('inactive — ignoring')}`);
    }
  }
  return healed;
}

// ─────────────────────────────────────────────────────────────────────
// Step 3 (optional): send a signed test webhook to production to verify
// signature verification works end-to-end.
// ─────────────────────────────────────────────────────────────────────
async function signedWebhookProbe() {
  console.log(bold('\n=== Signed webhook probe ==='));
  if (!WEBHOOK_SECRET) {
    console.log(`  ${red('✗')} LEMONSQUEEZY_WEBHOOK_SECRET not set locally`);
    return false;
  }
  const payload = JSON.stringify({
    meta: { event_name: 'ping', custom_data: { test: 'flow-probe' } },
    data: { id: 'probe-' + Date.now(), type: 'test', attributes: {} },
  });
  const sig = crypto.createHmac('sha256', WEBHOOK_SECRET).update(payload).digest('hex');
  try {
    const r = await fetch(PROD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Signature': sig },
      body: payload,
    });
    const body = await r.text();
    if (r.status === 200) {
      console.log(`  ${grn('✓')} signature matches production secret → 200 ${dim(body.slice(0,80))}`);
      return true;
    }
    console.log(`  ${red('✗')} HTTP ${r.status} ${dim(body.slice(0,200))}`);
    if (r.status === 401) {
      console.log(`     ${yel('→ secret on LS / Render / .env does not match. Update them so all three are identical.')}`);
    }
    return false;
  } catch (err) {
    console.log(`  ${red('✗')} request failed: ${err.message}`);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────
async function main() {
  const envOk    = await checkEnvironment();
  const lsOk     = await checkLsReachable();
  const hookOk   = await checkWebhookConfig();
  const varsOk   = await checkVariants();
  const healed1  = await auditOrders();
  const healed2  = await auditSubscriptions();
  let probeOk = null;
  if (SIGNATURE) probeOk = await signedWebhookProbe();

  console.log(bold('\n=== Summary ==='));
  console.log(`  env:           ${envOk ? grn('OK') : red('FAIL')}`);
  console.log(`  ls reachable:  ${lsOk ? grn('OK') : red('FAIL')}`);
  console.log(`  webhook cfg:   ${hookOk ? grn('OK') : red('FAIL')}`);
  console.log(`  variants:      ${varsOk ? grn('OK') : red('FAIL')}`);
  if (APPLY) console.log(`  healed:        ${grn(healed1 + healed2)} stuck rows`);
  if (SIGNATURE) console.log(`  webhook probe: ${probeOk ? grn('OK') : red('FAIL')}`);
  console.log('');
  if (!APPLY) {
    console.log(dim('  Re-run with --apply to self-heal stuck subscriptions/orders.'));
    console.log(dim('  Re-run with --signature to additionally verify HMAC end-to-end.'));
  }
}

main().catch((err) => {
  console.error('test-payment-flow failed:', err.message, err.stack);
  process.exit(1);
});
