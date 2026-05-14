// Subscription Controller
// Handles checkout, customer portal, webhook, and subscription status.
//
// ────────────────────────────────────────────────────────────────────────────
// Payment provider: LEMON SQUEEZY (active)
// Stripe integration is preserved below as commented-out blocks so it can be
// re-enabled by (a) uncommenting the Stripe blocks, (b) swapping the route
// wiring in backend/src/index.js back to the Stripe webhook, and (c) pointing
// createCheckout/createPortal/handleWebhook at the Stripe versions.
// ────────────────────────────────────────────────────────────────────────────

const supabase = require('../services/supabaseClient');
const { /* stripe, */ PLANS, getPlanLimits, canonicalPlan } = require('../services/stripeService');
const { getTodayCount } = require('../services/usageService');
const ls = require('../services/lemonSqueezyService');
const pp = require('../services/paypalService');
const np = require('../services/nowpaymentsService');

// FRONTEND_URL may be a comma-separated list (used by CORS). For redirect URLs
// we only want the canonical first entry, otherwise we'd redirect users to a
// malformed "https://foo.com,https://bar.com/checkout/success" URL.
const canonicalFrontend = () => {
  const raw = process.env.FRONTEND_URL || '';
  const first = raw.split(',')[0].trim();
  return first.replace(/\/$/, '');
};

// GET /api/subscription — Get the user's current subscription
const buildUsage = async (userId, plan) => {
  const limits = getPlanLimits(plan);
  const [cvUsed, clUsed, miUsed] = await Promise.all([
    getTodayCount(userId, 'cv_analysis'),
    getTodayCount(userId, 'cover_letter'),
    getTodayCount(userId, 'mock_interview'),
  ]);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const resetsAt = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString();
  return {
    cv:             { used: cvUsed, limit: limits.cv_limit, remaining: Math.max(0, limits.cv_limit - cvUsed) },
    cover_letter:   { used: clUsed, limit: limits.cl_limit, remaining: Math.max(0, limits.cl_limit - clUsed) },
    mock_interview: { used: miUsed, limit: limits.mi_limit, remaining: Math.max(0, limits.mi_limit - miUsed) },
    resetsAt,
  };
};

const getSubscription = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    let plan = (error || !data) ? 'free' : canonicalPlan(data.plan);
    let subscription = (error || !data)
      ? {
          plan: 'free',
          status: 'active',
          billing_interval: null,
          current_period_end: null,
          cancel_at_period_end: false,
        }
      : { ...data, plan };

    // Prepaid / one-time entitlements (Starter, plus crypto-paid Pro and
    // Pro Voice — all stored with `billing_interval='once'`) expire once
    // `current_period_end` is past. After that, the user drops back to
    // `free` until they buy again.
    if (subscription.billing_interval === 'once' && subscription.current_period_end) {
      const expired = new Date(subscription.current_period_end).getTime() < Date.now();
      if (expired) {
        plan = 'free';
        subscription = { ...subscription, plan: 'free', status: 'canceled' };
      }
    }

    const usage = await buildUsage(req.user.id, plan);

    return res.json({
      subscription,
      limits: getPlanLimits(plan),
      usage,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// POST /api/subscription/checkout — Create a hosted checkout URL.
// `provider` selects the payment rail: 'lemonsqueezy' (default) or 'paypal'.
// PayPal does NOT support one-time products through Subscriptions API,
// so the 7-Day Pass is LS-only — passing provider=paypal with plan=starter
// returns 400.
const createCheckout = async (req, res) => {
  try {
    const { plan, interval, provider: providerRaw, payment_method } = req.body;
    // Crypto rail wins if the user picked the USDT tile, regardless of
    // the explicit `provider` value the frontend sent.
    let provider;
    if (payment_method === 'crypto') provider = 'nowpayments';
    else if (providerRaw === 'paypal') provider = 'paypal';
    else provider = 'lemonsqueezy';

    if (!plan || !PLANS[plan] || plan === 'free') {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const planConfig = PLANS[plan];
    const isOneTime = planConfig.billing_type === 'one_time';

    const validIntervals = isOneTime ? ['once'] : ['month', 'quarter', 'year'];
    if (!interval || !validIntervals.includes(interval)) {
      return res.status(400).json({
        error: isOneTime
          ? 'One-time plans must use interval=once'
          : 'Invalid billing interval',
      });
    }

    if (provider === 'nowpayments') {
      // Build the IPN URL from the request host so dev / staging / prod
      // all hit themselves. Falls back to BACKEND_URL if set.
      const backendBase = (process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
      const ipnCallbackUrl = `${backendBase}/api/subscription/nowpayments/webhook`;
      try {
        const payment = await np.createPayment({
          userId: req.user.id,
          plan,
          interval,
          ipnCallbackUrl,
        });
        // Return payment details inline. Frontend renders an in-app
        // payment screen (address + QR + amount) and polls status —
        // no redirect away from cvclimber.lol.
        return res.json({
          provider: 'nowpayments',
          payment: {
            payment_id: payment.paymentId,
            pay_address: payment.payAddress,
            pay_amount: payment.payAmount,
            pay_currency: payment.payCurrency,
            price_amount: payment.priceAmount,
            price_currency: payment.priceCurrency,
            expires_at: payment.expiresAt,
          },
        });
      } catch (err) {
        console.error('NOWPayments payment error:', err.message, err.npStatus, err.npHint);
        if (err.npHint === 'api_key_missing' || err.npHint === 'price_missing') {
          return res.status(503).json({
            error: 'Crypto checkout is not configured. Please choose another payment method.',
            code: 'crypto_unconfigured',
          });
        }
        return res.status(502).json({
          error: 'Could not start crypto checkout. Please try again or use card.',
          code: 'crypto_checkout_failed',
        });
      }
    }

    if (provider === 'paypal') {
      if (isOneTime) {
        return res.status(400).json({
          error: 'PayPal does not support one-time passes. Use Lemon Squeezy for the 7-Day Pass.',
          code: 'paypal_one_time_unsupported',
        });
      }
      const planId = pp.getPlanId(plan, interval);
      if (!planId) {
        return res.status(400).json({
          error: `PayPal plan not configured for ${plan}/${interval}. Set PAYPAL_PLAN_* env vars.`,
        });
      }
      const returnUrl = `${canonicalFrontend()}/checkout/success?provider=paypal`;
      const cancelUrl = `${canonicalFrontend()}/pricing?checkout=canceled`;
      const { approveUrl } = await pp.createSubscription({
        planId,
        userId: req.user.id,
        email: req.user.email,
        plan,
        interval,
        returnUrl,
        cancelUrl,
      });
      return res.json({ url: approveUrl });
    }

    const variantId = ls.getVariantId(plan, interval);
    if (!variantId) {
      return res.status(400).json({
        error: `Lemon Squeezy variant not configured for ${plan}/${interval}. Set LEMONSQUEEZY_VARIANT_* env vars.`,
      });
    }

    const successUrl = `${canonicalFrontend()}/checkout/success`;
    const checkoutUrl = await ls.createCheckout({
      variantId,
      userId: req.user.id,
      email: req.user.email,
      plan,
      interval,
      successUrl,
    });

    return res.json({ url: checkoutUrl });
  } catch (err) {
    console.error('Checkout error:', err.message);
    if (err.lsStatus === 401 || err.lsStatus === 403 || err.ppStatus === 401 || err.ppStatus === 403) {
      return res.status(503).json({
        error: 'Payment provider is temporarily unavailable. Please try again in a moment or contact support.',
        code: 'payment_provider_unavailable',
      });
    }
    return res.status(500).json({
      error: 'Could not start checkout. Please try again.',
      code: 'checkout_failed',
    });
  }
};

// POST /api/subscription/resync — Self-heal for users whose webhook
// didn't land (test-mode misconfig, 5xx retry queue, whatever). Looks
// up the current user's latest LS subscription by email and upserts
// our DB row to match. No-op if LS has nothing for this email.
// Authenticated — the caller can only fix their own plan, never
// someone else's.
const resyncSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const email = req.user.email;
    if (!email) return res.status(400).json({ error: 'No email on user' });

    let lsSub;
    try {
      lsSub = await ls.findLatestSubscriptionByEmail(email);
    } catch (err) {
      console.error(
        `resync: LS lookup failed for user ${userId} email=${email} status=${err.lsStatus} hint=${err.lsHint || 'n/a'} body=${err.lsBody || 'n/a'}`
      );
      // Surface actionable hints to the client. LS error bodies are
      // non-secret ("The store_id field must be a number", etc).
      // Helps users / support tell the three cases apart:
      //   - our backend isn't configured (api_key_missing)
      //   - our key was rotated / has no scope (401/403)
      //   - LS filter rejected (400/422) — our bug
      if (err.lsHint === 'api_key_missing' || err.lsHint === 'store_id_missing') {
        return res.status(503).json({
          error: 'Payment provider is not configured. Please contact support.',
          code: 'payment_provider_unconfigured',
        });
      }
      if (err.lsStatus === 401 || err.lsStatus === 403) {
        return res.status(503).json({
          error: 'Payment provider temporarily unavailable. Please contact support if this persists.',
          code: 'payment_provider_unavailable',
        });
      }
      return res.status(502).json({
        error: 'Could not query payment provider',
        code: 'payment_provider_error',
        ls_status: err.lsStatus || null,
      });
    }

    if (!lsSub) {
      // No active subscription found — fall back to one-time order lookup.
      // This catches users who bought the 7-Day Pass but the webhook didn't
      // activate them (e.g. LS stripped custom_data on a free-via-discount
      // flow, or the webhook URL was misconfigured at the time).
      let lsOrder;
      try {
        lsOrder = await ls.findLatestOrderByEmail(email);
      } catch (err) {
        console.error(`resync: LS order lookup failed for user ${userId}:`, err.message);
        lsOrder = null;
      }
      if (lsOrder && lsOrder.attributes?.status === 'paid') {
        const oa = lsOrder.attributes;
        const orderVariantId = oa?.first_order_item?.variant_id;
        const orderPlan = ls.resolvePlanFromVariantId(orderVariantId);
        if (orderPlan && orderPlan !== 'free' && PLANS[orderPlan]?.billing_type === 'one_time') {
          const durationDays = PLANS[orderPlan].pass_duration_days || 7;
          const start = new Date(oa.created_at || Date.now());
          const end = new Date(start.getTime() + durationDays * 24 * 60 * 60 * 1000);
          const { error: passErr } = await supabase.from('subscriptions').upsert({
            user_id: userId,
            lemonsqueezy_customer_id: oa.customer_id ? String(oa.customer_id) : null,
            lemonsqueezy_subscription_id: null,
            lemonsqueezy_portal_url: null,
            plan: orderPlan,
            billing_interval: 'once',
            status: 'active',
            current_period_start: start.toISOString(),
            current_period_end: end.toISOString(),
            cancel_at_period_end: false,
            provider: 'lemonsqueezy',
          }, { onConflict: 'user_id' });
          if (passErr) {
            console.error(`resync: one-time pass upsert failed for user ${userId}:`, passErr.message);
            return res.status(500).json({ error: 'Could not activate pass' });
          }
          return res.json({
            ok: true,
            changed: true,
            subscription: { plan: orderPlan, status: 'active', billing_interval: 'once', current_period_end: end.toISOString() },
          });
        }
      }
      return res.json({
        ok: true,
        changed: false,
        message: 'No Lemon Squeezy subscription or recent paid order found for your email.',
      });
    }

    const attrs = lsSub.attributes || {};
    const plan = ls.resolvePlanFromVariantId(attrs.variant_id);
    const interval = ls.resolveIntervalFromVariantId(attrs.variant_id);

    const row = {
      user_id: userId,
      lemonsqueezy_customer_id: attrs.customer_id ? String(attrs.customer_id) : null,
      lemonsqueezy_subscription_id: lsSub.id ? String(lsSub.id) : null,
      lemonsqueezy_portal_url: attrs?.urls?.customer_portal || null,
      plan,
      billing_interval: interval,
      status: ls.mapStatus(attrs.status),
      current_period_start: attrs.created_at || null,
      current_period_end: attrs.renews_at || attrs.ends_at || null,
      cancel_at_period_end: attrs.cancelled === true,
    };

    const { error: upsertErr } = await supabase
      .from('subscriptions')
      .upsert(row, { onConflict: 'user_id' });
    if (upsertErr) {
      console.error('resync: subscriptions upsert failed:', upsertErr.message, upsertErr.code);
      return res.status(500).json({ error: 'Could not update subscription row' });
    }

    return res.json({
      ok: true,
      changed: true,
      subscription: {
        plan,
        status: row.status,
        billing_interval: interval,
        current_period_end: row.current_period_end,
      },
    });
  } catch (err) {
    console.error('resyncSubscription error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};

// GET /api/subscription/config-check — admin-gated liveness probe for the
// Lemon Squeezy config. Returns shape-only booleans + a round-trip ping
// to LS. Never reveals secret values. Gated with the same ADMIN_PASSWORD
// header that protects /bosi/* so random visitors can't fingerprint the
// setup.
const configCheck = async (req, res) => {
  const expected = process.env.ADMIN_PASSWORD;
  const provided = req.headers['x-admin-password'];
  if (!expected || !provided || provided !== expected) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const lsConfig = ls.inspectConfig();
  const lsPing = await ls.pingApi();
  const ppConfig = pp.inspectConfig();
  const ppPing = await pp.pingApi();

  // Supabase fingerprint — proves what the live process actually loaded.
  // If the dashboard shows the right value but this fingerprint differs
  // from a local-side fingerprint, the env var has hidden characters
  // (newline / trailing space) that break JWT parsing.
  const srk = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  let supaProbe = { upsert: null };
  try {
    const probeId = '00000000-0000-0000-0000-000000000999';
    const { error: dbErr } = await supabase.from('subscriptions').upsert({
      user_id: probeId, plan: 'free', status: 'active', billing_interval: 'once',
    }, { onConflict: 'user_id' });
    if (dbErr) {
      supaProbe.upsert = { ok: false, message: dbErr.message, code: dbErr.code, hint: dbErr.hint };
    } else {
      supaProbe.upsert = { ok: true };
      await supabase.from('subscriptions').delete().eq('user_id', probeId);
    }
  } catch (err) {
    supaProbe.upsert = { ok: false, threw: err.message };
  }

  return res.json({
    lemonsqueezy: {
      config: lsConfig,
      ping: lsPing,
      overall_ok: lsConfig.api_key_shape === 'ok' && lsConfig.store_id_shape === 'ok' && lsPing.ok,
    },
    paypal: {
      config: ppConfig,
      ping: ppPing,
      overall_ok: ppConfig.client_id_present && ppConfig.client_secret_present && ppPing.ok,
    },
    supabase: {
      url: process.env.SUPABASE_URL || null,
      service_role_key: srk
        ? {
            length: srk.length,
            head: srk.slice(0, 12),
            tail: srk.slice(-12),
            has_whitespace: /\s/.test(srk),
          }
        : null,
      probe: supaProbe,
    },
  });
};

// POST /api/subscription/portal — Return a self-service URL for the
// user's current subscription. LS rows return their pre-generated portal
// URL; PayPal rows return a deep link to PayPal's autopay management
// page (PayPal has no per-merchant portal URL — users manage all
// subscriptions there). Sandbox rows go to the sandbox dashboard.
const createPortal = async (req, res) => {
  try {
    const { data } = await supabase
      .from('subscriptions')
      .select('provider, lemonsqueezy_portal_url, paypal_subscription_id')
      .eq('user_id', req.user.id)
      .single();

    if (!data) {
      return res.status(400).json({ error: 'No active subscription found' });
    }

    if (data.provider === 'paypal' && data.paypal_subscription_id) {
      const sandboxBase = 'https://www.sandbox.paypal.com';
      const liveBase = 'https://www.paypal.com';
      const base = process.env.PAYPAL_MODE === 'live' ? liveBase : sandboxBase;
      return res.json({ url: `${base}/myaccount/autopay/` });
    }

    if (!data.lemonsqueezy_portal_url) {
      return res.status(400).json({ error: 'No active subscription found' });
    }

    return res.json({ url: data.lemonsqueezy_portal_url });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// POST /api/subscription/webhook — Lemon Squeezy webhook handler (no auth middleware)
// Requires raw body access — route must be registered BEFORE express.json().
const handleWebhook = async (req, res) => {
  const signature = req.headers['x-signature'];
  const rawBody = req.body; // Buffer, because express.raw({type: 'application/json'}) runs on this route

  if (!ls.verifyWebhook(rawBody, signature)) {
    console.error('LS webhook signature verification failed');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  let payload;
  try {
    payload = JSON.parse(rawBody.toString('utf8'));
  } catch (err) {
    return res.status(400).json({ error: 'Malformed JSON' });
  }

  const eventName = payload?.meta?.event_name;
  const custom = payload?.meta?.custom_data || {};
  const attrs = payload?.data?.attributes || {};
  const subId = payload?.data?.id;

  // Find the user tied to this subscription. Strategy: prefer our OWN
  // database (by lemonsqueezy_subscription_id) over custom_data, because
  // custom_data is just a string LS echoes back unvalidated — a crafted
  // webhook with the right signature secret could spoof user_id. The DB
  // lookup proves the caller actually owns this subscription. Fall back
  // to custom_data only for brand-new subscriptions that aren't in our
  // DB yet (the very first subscription_created event).
  //
  // Final fallback: if both DB lookup and custom_data fail (e.g. LS strips
  // custom_data on certain checkout paths), look up the user by email
  // from the order's user_email attribute. The webhook is already signature-
  // verified at this point, so the email is trustable.
  const lookupUser = async () => {
    if (subId) {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('lemonsqueezy_subscription_id', subId)
        .maybeSingle();
      if (!error && data?.user_id) return data.user_id;
    }
    if (custom.user_id) return custom.user_id;
    const email = (attrs.user_email || '').toLowerCase().trim();
    if (email) {
      try {
        const uid = await supabase.findUserIdByEmail(email);
        if (uid) {
          console.log(`LS ${eventName}: resolved user via email fallback (${email}) → ${uid}`);
          return uid;
        }
      } catch (err) {
        console.error(`LS ${eventName}: email lookup failed for ${email}:`, err.message);
      }
    }
    return null;
  };

  try {
    switch (eventName) {
      case 'subscription_created':
      case 'subscription_updated':
      case 'subscription_resumed': {
        const userId = await lookupUser();
        if (!userId) {
          console.warn(`LS ${eventName} with no user_id match — sub ${subId}`);
          break;
        }

        // Prefer custom_data when present (fresh checkouts), else resolve from variant.
        const plan = custom.plan || ls.resolvePlanFromVariantId(attrs.variant_id);
        const interval = custom.interval || ls.resolveIntervalFromVariantId(attrs.variant_id);

        const upsertRow = {
          user_id: userId,
          lemonsqueezy_customer_id: attrs.customer_id ? String(attrs.customer_id) : null,
          lemonsqueezy_subscription_id: subId,
          lemonsqueezy_portal_url: attrs?.urls?.customer_portal || null,
          plan,
          billing_interval: interval,
          status: ls.mapStatus(attrs.status),
          current_period_start: attrs.created_at || null,
          current_period_end: attrs.renews_at || attrs.ends_at || null,
          cancel_at_period_end: attrs.cancelled === true,
        };

        // Previously we didn't surface upsert errors here, so a silent
        // failure (RLS, FK violation, column mismatch) left the user
        // stuck on 'free' even though the webhook had fired. Log loudly
        // so the next occurrence is visible in Render logs.
        const { error: upsertErr } = await supabase
          .from('subscriptions')
          .upsert(upsertRow, { onConflict: 'user_id' });
        if (upsertErr) {
          console.error(
            `LS ${eventName} subscriptions upsert failed for user ${userId}:`,
            upsertErr.message, upsertErr.code, upsertErr.details, upsertErr.hint
          );
        } else {
          console.log(`LS ${eventName} subscriptions upserted for user ${userId} → plan=${plan}`);
        }
        break;
      }

      case 'subscription_cancelled': {
        const userId = await lookupUser();
        if (!userId) {
          console.warn(`LS subscription_cancelled: no user_id match for sub ${subId}`);
          break;
        }
        const { error } = await supabase.from('subscriptions').update({
          status: ls.mapStatus(attrs.status),
          cancel_at_period_end: true,
          current_period_end: attrs.ends_at || attrs.renews_at || null,
        }).eq('user_id', userId);
        if (error) {
          console.error(
            `LS subscription_cancelled update failed for user ${userId}:`,
            error.message, error.code, error.details, error.hint
          );
        }
        break;
      }

      case 'subscription_expired': {
        const userId = await lookupUser();
        if (!userId) {
          console.warn(`LS subscription_expired: no user_id match for sub ${subId}`);
          break;
        }
        const { error } = await supabase.from('subscriptions').update({
          plan: 'free',
          status: 'canceled',
          lemonsqueezy_subscription_id: null,
          cancel_at_period_end: false,
        }).eq('user_id', userId);
        if (error) {
          console.error(
            `LS subscription_expired update failed for user ${userId}:`,
            error.message, error.code, error.details, error.hint
          );
        }
        break;
      }

      case 'subscription_payment_failed': {
        const userId = await lookupUser();
        if (!userId) {
          console.warn(`LS subscription_payment_failed: no user_id match for sub ${subId}`);
          break;
        }
        const { error } = await supabase.from('subscriptions').update({
          status: 'past_due',
        }).eq('user_id', userId);
        if (error) {
          console.error(
            `LS subscription_payment_failed update failed for user ${userId}:`,
            error.message, error.code, error.details, error.hint
          );
        }
        break;
      }

      case 'order_created': {
        // One-time purchases fire `order_created` — never `subscription_created`.
        // Three flavours:
        //   a) Starter 7-Day Pass purchased for self → grants user the pass
        //   b) Gift-a-Pass purchase (custom.gift === true) → records a
        //      gifted_passes row and emails recipient with pass_code
        //   c) Unknown plan → ignore
        //
        // Robustness: LS strips `custom_data` on the "Want this for free?"
        // simplified flow (100% discount). We fall back to:
        //   - plan ← resolved from the order item's variant_id
        //   - user_id ← looked up by user_email in auth.users
        // Every break path logs explicitly so silent activation failures
        // surface in Render logs.
        const orderItem = attrs?.first_order_item || {};
        const variantId = orderItem.variant_id;
        const buyerEmail = (attrs.user_email || '').toLowerCase().trim();

        // Resolve plan (prefer custom_data, fall back to variant lookup).
        let plan = custom.plan;
        if (!plan && variantId) {
          plan = ls.resolvePlanFromVariantId(variantId);
        }
        if (!plan || plan === 'free' || !PLANS[plan]) {
          console.error(
            `LS order_created: cannot resolve plan — order=${subId} variant_id=${variantId} ` +
            `custom_keys=${Object.keys(custom).join(',') || '<empty>'} email=${buyerEmail || '<none>'}`
          );
          break;
        }
        if (PLANS[plan].billing_type !== 'one_time') {
          console.warn(`LS order_created: plan ${plan} is not one_time — order=${subId}`);
          break;
        }

        // Resolve buyer user_id (prefer custom_data, fall back to email lookup).
        let buyerId = custom.user_id;
        if (!buyerId && buyerEmail) {
          try {
            buyerId = await supabase.findUserIdByEmail(buyerEmail);
            if (buyerId) {
              console.log(`LS order_created: resolved user via email fallback (${buyerEmail}) → ${buyerId}`);
            }
          } catch (err) {
            console.error(`LS order_created: email lookup failed for ${buyerEmail}:`, err.message);
          }
        }
        if (!buyerId) {
          console.error(
            `LS order_created: cannot resolve buyer user_id — order=${subId} email=${buyerEmail || '<none>'} ` +
            `custom_keys=${Object.keys(custom).join(',') || '<empty>'}. Manual activation may be required.`
          );
          break;
        }

        // ── Gift-a-Pass path ─────────────────────────────────────
        if (custom.gift === true || custom.gift === 'true') {
          const recipient = (custom.recipient_email || '').toLowerCase().trim();
          const giftMessage = custom.gift_message || null;
          if (!recipient) {
            console.error(`LS order_created gift: missing recipient_email — order=${subId} buyer=${buyerId}`);
            break;
          }
          const passCode = require('crypto').randomBytes(6).toString('hex').toUpperCase();
          const { error: giftErr } = await supabase.from('gifted_passes').upsert({
            buyer_user_id: buyerId,
            recipient_email: recipient,
            pass_code: passCode,
            message: giftMessage,
            lemonsqueezy_order_id: subId,
          }, { onConflict: 'recipient_email' });
          if (giftErr) {
            console.error(
              `LS order_created gift: gifted_passes upsert failed for buyer ${buyerId} → ${recipient}:`,
              giftErr.message, giftErr.code, giftErr.details, giftErr.hint
            );
          } else {
            console.log(`LS order_created gift: pass_code=${passCode} → ${recipient} from buyer=${buyerId}`);
          }
          break;
        }

        // ── Self-purchase path (regular 7-Day Pass) ──────────────
        const durationDays = PLANS[plan].pass_duration_days || 7;
        const now = new Date();
        const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

        const { error: passErr } = await supabase.from('subscriptions').upsert({
          user_id: buyerId,
          lemonsqueezy_customer_id: attrs.customer_id ? String(attrs.customer_id) : null,
          lemonsqueezy_subscription_id: null, // no subscription ID for one-time
          lemonsqueezy_portal_url: null,
          plan,
          billing_interval: 'once',
          status: 'active',
          current_period_start: now.toISOString(),
          current_period_end: expiresAt.toISOString(),
          cancel_at_period_end: false,
          provider: 'lemonsqueezy',
        }, { onConflict: 'user_id' });
        if (passErr) {
          console.error(
            `LS order_created: subscriptions upsert failed for user ${buyerId} → plan=${plan}:`,
            passErr.message, passErr.code, passErr.details, passErr.hint
          );
        } else {
          console.log(`LS order_created: ${plan} activated for user=${buyerId} expires=${expiresAt.toISOString()}`);
        }

        break;
      }

      case 'subscription_payment_success':
      default:
        // Not all events require DB writes — log and move on.
        break;
    }
  } catch (err) {
    console.error(
      `LS webhook processing error — event=${eventName} sub_id=${subId} ` +
      `custom_keys=${Object.keys(custom).join(',') || '<empty>'}: ${err.message}`,
      err.stack
    );
  }

  // Always 200 so LS doesn't retry on an internal bug. The error above
  // is the source of truth — alert on it in Render logs / log drain.
  res.json({ received: true });
};

// POST /api/subscription/paypal/webhook — PayPal webhook handler (no auth middleware).
// Mounted with express.raw() in index.js so we can verify the signature
// against the unmodified bytes. PayPal verifies asynchronously by calling
// /v1/notifications/verify-webhook-signature back at PayPal — see
// paypalService.verifyWebhook for the exact contract.
const handlePaypalWebhook = async (req, res) => {
  const rawBody = req.body;
  const ok = await pp.verifyWebhook(req.headers, rawBody);
  if (!ok) {
    console.error('PayPal webhook signature verification failed');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  let event;
  try {
    event = JSON.parse(rawBody.toString('utf8'));
  } catch {
    return res.status(400).json({ error: 'Malformed JSON' });
  }

  const eventType = event?.event_type;
  const resource = event?.resource || {};
  const subId = resource.id;

  // custom_id is the JSON blob we stashed at subscription create time.
  // Used only for the very first event (when no DB row exists yet); after
  // that we trust the DB lookup over the echoed string.
  let customData = {};
  try {
    if (resource.custom_id) customData = JSON.parse(resource.custom_id);
  } catch {
    customData = {};
  }

  const lookupUser = async () => {
    if (subId) {
      const { data } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('paypal_subscription_id', subId)
        .maybeSingle();
      if (data?.user_id) return data.user_id;
    }
    if (customData.user_id) return customData.user_id;
    // Email fallback — PayPal puts the subscriber email at
    // resource.subscriber.email_address. The webhook is already signature-
    // verified by this point, so the email is trustable.
    const email = (resource?.subscriber?.email_address || '').toLowerCase().trim();
    if (email) {
      try {
        const uid = await supabase.findUserIdByEmail(email);
        if (uid) {
          console.log(`PayPal ${eventType}: resolved user via email fallback (${email}) → ${uid}`);
          return uid;
        }
      } catch (err) {
        console.error(`PayPal ${eventType}: email lookup failed for ${email}:`, err.message);
      }
    }
    return null;
  };

  try {
    switch (eventType) {
      case 'BILLING.SUBSCRIPTION.CREATED':
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
      case 'BILLING.SUBSCRIPTION.UPDATED':
      case 'BILLING.SUBSCRIPTION.RE-ACTIVATED': {
        const userId = await lookupUser();
        if (!userId) {
          console.warn(`PayPal ${eventType} with no user_id match — sub ${subId}`);
          break;
        }
        const planId = resource.plan_id;
        const plan = customData.plan || pp.resolvePlanFromPlanId(planId);
        const interval = customData.interval || pp.resolveIntervalFromPlanId(planId);

        const upsertRow = {
          user_id: userId,
          provider: 'paypal',
          paypal_subscription_id: subId,
          paypal_plan_id: planId,
          paypal_payer_id: resource?.subscriber?.payer_id || null,
          plan,
          billing_interval: interval,
          status: pp.mapStatus(resource.status),
          current_period_start: resource?.start_time || null,
          current_period_end: resource?.billing_info?.next_billing_time || null,
          cancel_at_period_end: false,
        };

        const { error: upsertErr } = await supabase
          .from('subscriptions')
          .upsert(upsertRow, { onConflict: 'user_id' });
        if (upsertErr) {
          console.error(
            `PayPal ${eventType} subscriptions upsert failed for user ${userId}:`,
            upsertErr.message, upsertErr.code, upsertErr.details, upsertErr.hint
          );
        } else {
          console.log(`PayPal ${eventType} subscriptions upserted for user ${userId} → plan=${plan}`);
        }
        break;
      }

      case 'BILLING.SUBSCRIPTION.CANCELLED':
      case 'BILLING.SUBSCRIPTION.SUSPENDED': {
        const userId = await lookupUser();
        if (!userId) {
          console.warn(`PayPal ${eventType}: no user_id match for sub ${subId}`);
          break;
        }
        const update = eventType === 'BILLING.SUBSCRIPTION.CANCELLED'
          ? { status: 'canceled', cancel_at_period_end: true }
          : { status: 'past_due' };
        const { error } = await supabase.from('subscriptions').update(update).eq('user_id', userId);
        if (error) {
          console.error(`PayPal ${eventType} update failed for user ${userId}:`, error.message);
        }
        break;
      }

      case 'BILLING.SUBSCRIPTION.EXPIRED': {
        const userId = await lookupUser();
        if (!userId) break;
        const { error } = await supabase.from('subscriptions').update({
          plan: 'free',
          status: 'canceled',
          paypal_subscription_id: null,
          cancel_at_period_end: false,
        }).eq('user_id', userId);
        if (error) {
          console.error(`PayPal ${eventType} update failed for user ${userId}:`, error.message);
        }
        break;
      }

      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
      case 'PAYMENT.SALE.DENIED': {
        const userId = await lookupUser();
        if (!userId) break;
        const { error } = await supabase.from('subscriptions').update({
          status: 'past_due',
        }).eq('user_id', userId);
        if (error) {
          console.error(`PayPal ${eventType} update failed for user ${userId}:`, error.message);
        }
        break;
      }

      case 'PAYMENT.SALE.COMPLETED':
      default:
        // Renewal payments roll the period forward via SUBSCRIPTION.UPDATED;
        // sale events are informational here. Log and move on.
        break;
    }
  } catch (err) {
    console.error(
      `PayPal webhook processing error — event=${eventType} sub_id=${subId} ` +
      `custom_keys=${Object.keys(customData).join(',') || '<empty>'}: ${err.message}`,
      err.stack
    );
  }

  // Always 200 so PayPal doesn't retry on internal bugs (it retries up
  // to ~25 times over 3 days otherwise). The error above is the source
  // of truth — alert on it in Render logs / log drain.
  res.json({ received: true });
};

/* ════════════════════════════════════════════════════════════════════════════
   STRIPE HANDLERS — preserved for rollback. Not wired into any route.
   To re-enable: uncomment this block, swap the named exports below, and
   re-mount /api/subscription/webhook with the Stripe raw-body middleware.
   ════════════════════════════════════════════════════════════════════════════

// POST /api/subscription/checkout — Create a Stripe Checkout session
const createCheckoutStripe = async (req, res) => {
  try {
    const { plan, interval, payment_method } = req.body;

    if (!plan || !PLANS[plan] || plan === 'free') {
      return res.status(400).json({ error: 'Invalid plan' });
    }
    if (!interval || !['month', 'quarter', 'year'].includes(interval)) {
      return res.status(400).json({ error: 'Invalid billing interval' });
    }

    const priceId = PLANS[plan].prices[interval];
    if (!priceId || priceId === 'price_REPLACE_ME') {
      return res.status(400).json({ error: 'Stripe price not configured for this plan. Add your Stripe Price IDs to .env' });
    }

    let customerId;
    const { data: existing } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', req.user.id)
      .single();

    if (existing?.stripe_customer_id) {
      customerId = existing.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: req.user.email,
        metadata: { user_id: req.user.id },
      });
      customerId = customer.id;

      await supabase.from('subscriptions').upsert({
        user_id: req.user.id,
        stripe_customer_id: customerId,
        plan: 'free',
        status: 'active',
      }, { onConflict: 'user_id' });
    }

    const methodMap = { card: ['card'], paypal: ['paypal'] };
    const paymentMethodTypes = methodMap[payment_method] || ['card'];

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: paymentMethodTypes,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL}/checkout/success`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing?checkout=canceled`,
      metadata: { user_id: req.user.id, plan, interval },
    });

    return res.json({ url: session.url });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// POST /api/subscription/portal — Create a Stripe Customer Portal session
const createPortalStripe = async (req, res) => {
  try {
    const { data } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', req.user.id)
      .single();

    if (!data?.stripe_customer_id) {
      return res.status(400).json({ error: 'No active subscription found' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: data.stripe_customer_id,
      return_url: `${process.env.FRONTEND_URL}/settings`,
    });

    return res.json({ url: session.url });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// POST /api/subscription/webhook — Stripe webhook handler
const handleWebhookStripe = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata.user_id;
        const plan = session.metadata.plan;
        const interval = session.metadata.interval;
        const subscriptionId = session.subscription;
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        await supabase.from('subscriptions').upsert({
          user_id: userId,
          stripe_customer_id: session.customer,
          stripe_subscription_id: subscriptionId,
          plan,
          billing_interval: interval,
          status: sub.status,
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          cancel_at_period_end: sub.cancel_at_period_end,
        }, { onConflict: 'user_id' });
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const customerId = sub.customer;
        const { data: record } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();
        if (record) {
          const priceId = sub.items.data[0]?.price?.id;
          const plan = resolvePlanFromStripePriceId(priceId);
          const interval = sub.items.data[0]?.price?.recurring?.interval || 'month';
          await supabase.from('subscriptions').update({
            stripe_subscription_id: sub.id,
            plan,
            billing_interval: interval,
            status: sub.status,
            current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            cancel_at_period_end: sub.cancel_at_period_end,
          }).eq('user_id', record.user_id);
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const customerId = sub.customer;
        const { data: record } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();
        if (record) {
          await supabase.from('subscriptions').update({
            plan: 'free',
            status: 'canceled',
            stripe_subscription_id: null,
            cancel_at_period_end: false,
          }).eq('user_id', record.user_id);
        }
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId = invoice.customer;
        const { data: record } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();
        if (record) {
          await supabase.from('subscriptions').update({
            status: 'past_due',
          }).eq('user_id', record.user_id);
        }
        break;
      }
    }
  } catch (err) {
    console.error('Webhook processing error:', err.message);
  }

  res.json({ received: true });
};

function resolvePlanFromStripePriceId(priceId) {
  if (!priceId) return 'free';
  for (const [planKey, config] of Object.entries(PLANS)) {
    if (config.prices) {
      if (config.prices.month === priceId || config.prices.year === priceId) {
        return planKey;
      }
    }
  }
  return 'free';
}

   ════════════════════════════════════════════════════════════════════════════ */

// POST /api/subscription/nowpayments/webhook — IPN handler for crypto
// payments. NOWPayments forwards the actual USDT to the configured payout
// wallet automatically; this endpoint exists purely to grant entitlements
// once the on-chain payment is confirmed.
//
// Crypto invoices are always one-shot, even for "monthly" / "yearly" Pro
// plans — there is no native subscription primitive for crypto here. We
// store these as `billing_interval='once'` and let the auto-expiration
// logic in getSubscription downgrade them when the period ends.
const handleNowpaymentsWebhook = async (req, res) => {
  const sig = req.headers['x-nowpayments-sig'];
  const verification = np.verifyIpnSignature(req.body, sig);
  if (!verification.valid) {
    console.warn(`NOWPayments IPN rejected: ${verification.reason}`);
    return res.status(401).send('Invalid signature');
  }
  const payload = verification.payload;

  try {
    const status = payload.payment_status;
    if (!np.isPaidStatus(status)) {
      // Acknowledge so NOWPayments doesn't retry forever, but don't grant
      // anything until the payment actually finishes confirming.
      return res.status(200).send('ok');
    }

    const decoded = np.decodeOrderId(payload.order_id);
    if (!decoded || !decoded.userId || !decoded.plan) {
      console.warn(`NOWPayments IPN with unparseable order_id: ${payload.order_id}`);
      return res.status(200).send('ok'); // 200 to stop retries — payload is malformed, not transient
    }

    const { userId, plan, interval } = decoded;
    if (!PLANS[plan]) {
      console.warn(`NOWPayments IPN for unknown plan ${plan}, order ${payload.order_id}`);
      return res.status(200).send('ok');
    }

    // How many days does this purchase grant?
    let durationDays;
    if (PLANS[plan].billing_type === 'one_time') {
      durationDays = PLANS[plan].pass_duration_days || 7;
    } else if (interval === 'year') {
      durationDays = 365;
    } else {
      durationDays = 30;
    }

    // Idempotency: if the user already has an active row that ends after
    // the period we'd grant for *this* payment, do nothing. NOWPayments
    // re-fires IPNs on retries; we don't want to shorten an existing
    // longer entitlement.
    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const { data: existing } = await supabase
      .from('subscriptions')
      .select('current_period_end, status, plan')
      .eq('user_id', userId)
      .single();

    if (existing && existing.current_period_end) {
      const existingEnd = new Date(existing.current_period_end).getTime();
      if (existingEnd >= expiresAt.getTime() && existing.status === 'active') {
        return res.status(200).send('ok');
      }
    }

    const { error: upsertErr } = await supabase.from('subscriptions').upsert({
      user_id: userId,
      lemonsqueezy_customer_id: null,
      lemonsqueezy_subscription_id: null,
      lemonsqueezy_portal_url: null,
      plan,
      billing_interval: 'once',
      status: 'active',
      current_period_start: now.toISOString(),
      current_period_end: expiresAt.toISOString(),
      cancel_at_period_end: false,
    }, { onConflict: 'user_id' });

    if (upsertErr) {
      console.error('NOWPayments IPN: subscriptions upsert failed:', upsertErr.message);
      // Return 500 so NOWPayments retries — DB is transiently failing.
      return res.status(500).send('upsert_failed');
    }

    console.log(`NOWPayments IPN: granted ${plan}/${interval} to ${userId} for ${durationDays}d (payment ${payload.payment_id})`);
    return res.status(200).send('ok');
  } catch (err) {
    console.error('NOWPayments IPN handler error:', err.message);
    return res.status(500).send('error');
  }
};

// GET /api/subscription/nowpayments/status?id=PAYMENT_ID
// Lightweight polling endpoint the inline crypto checkout calls every
// few seconds while the customer is sending the deposit. Returns the
// raw NOWPayments status string so the frontend can show "waiting" /
// "confirming" / "finished" states. Auth-gated to prevent strangers
// from probing arbitrary payment IDs.
const getNowpaymentsStatus = async (req, res) => {
  const id = (req.query.id || '').toString().trim();
  if (!id) return res.status(400).json({ error: 'Missing payment id' });
  try {
    const result = await np.getPaymentStatus(id);
    // Confirm the payment belongs to the requesting user — the order_id
    // is encoded with the buyer's user_id, so we can spot mismatches
    // and refuse cross-user lookups.
    const decoded = np.decodeOrderId(result.orderId);
    if (decoded && decoded.userId && decoded.userId !== req.user.id) {
      return res.status(404).json({ error: 'Not found' });
    }
    return res.json({ status: result.status, payment_id: result.paymentId });
  } catch (err) {
    console.error('NOWPayments status error:', err.message);
    return res.status(502).json({ error: 'Could not query payment status' });
  }
};

module.exports = { getSubscription, createCheckout, createPortal, handleWebhook, handlePaypalWebhook, handleNowpaymentsWebhook, getNowpaymentsStatus, configCheck, resyncSubscription };
