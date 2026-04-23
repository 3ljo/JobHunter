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
const { onPaidConversion, onRefund } = require('../lib/referrals/webhookHooks');
const { logEvent } = require('../lib/events');

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

    // One-time passes (e.g. `starter`) expire — once `current_period_end`
    // has passed, the user drops back to `free` entitlements.
    if (plan === 'starter' && subscription.current_period_end) {
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

// POST /api/subscription/checkout — Create a Lemon Squeezy hosted checkout URL
const createCheckout = async (req, res) => {
  try {
    const { plan, interval } = req.body; // payment_method is ignored — LS handles method selection on its hosted page

    if (!plan || !PLANS[plan] || plan === 'free') {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const planConfig = PLANS[plan];
    const isOneTime = planConfig.billing_type === 'one_time';

    // Subscriptions take 'month' | 'year'; one-time passes use 'once'.
    const validIntervals = isOneTime ? ['once'] : ['month', 'year'];
    if (!interval || !validIntervals.includes(interval)) {
      return res.status(400).json({
        error: isOneTime
          ? 'One-time plans must use interval=once'
          : 'Invalid billing interval',
      });
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
    console.error('LS checkout error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};

// POST /api/subscription/portal — Return the user's Lemon Squeezy customer portal URL.
// LS doesn't have an API to *create* a portal session on demand; each subscription
// comes with a pre-generated portal URL, which the webhook stored on the row.
const createPortal = async (req, res) => {
  try {
    const { data } = await supabase
      .from('subscriptions')
      .select('lemonsqueezy_portal_url')
      .eq('user_id', req.user.id)
      .single();

    if (!data?.lemonsqueezy_portal_url) {
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

  // Find the user tied to this subscription — prefer the custom_data we injected
  // at checkout, fall back to looking up by LS subscription ID (for renewals / updates).
  const lookupUser = async () => {
    if (custom.user_id) return custom.user_id;
    if (subId) {
      const { data } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('lemonsqueezy_subscription_id', subId)
        .single();
      return data?.user_id || null;
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

        await supabase.from('subscriptions').upsert({
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
        }, { onConflict: 'user_id' });

        // Referral reward — only trigger on subscription_created (first paid
        // conversion). Renewals / updates are a no-op for the referrer.
        if (eventName === 'subscription_created' && ls.mapStatus(attrs.status) === 'active') {
          await onPaidConversion(userId);
        }
        break;
      }

      case 'subscription_cancelled': {
        const userId = await lookupUser();
        if (!userId) break;
        await supabase.from('subscriptions').update({
          status: ls.mapStatus(attrs.status),
          cancel_at_period_end: true,
          current_period_end: attrs.ends_at || attrs.renews_at || null,
        }).eq('user_id', userId);
        break;
      }

      case 'subscription_expired': {
        const userId = await lookupUser();
        if (!userId) break;
        await supabase.from('subscriptions').update({
          plan: 'free',
          status: 'canceled',
          lemonsqueezy_subscription_id: null,
          cancel_at_period_end: false,
        }).eq('user_id', userId);
        break;
      }

      case 'subscription_payment_failed': {
        const userId = await lookupUser();
        if (!userId) break;
        await supabase.from('subscriptions').update({
          status: 'past_due',
        }).eq('user_id', userId);
        break;
      }

      case 'order_created': {
        // One-time purchases fire `order_created` — never `subscription_created`.
        // Three flavours:
        //   a) Starter 7-Day Pass purchased for self → grants user the pass
        //   b) Gift-a-Pass purchase (custom.gift === true) → records a
        //      gifted_passes row and emails recipient with pass_code
        //   c) Unknown plan → ignore
        const custom = payload?.meta?.custom_data || {};
        const plan = custom.plan;
        if (!plan || !PLANS[plan] || PLANS[plan].billing_type !== 'one_time') break;

        const buyerId = custom.user_id;
        if (!buyerId) {
          console.warn(`LS order_created with no user_id in custom_data — order ${subId}`);
          break;
        }

        // ── Gift-a-Pass path ─────────────────────────────────────
        if (custom.gift === true || custom.gift === 'true') {
          const recipient = (custom.recipient_email || '').toLowerCase().trim();
          const giftMessage = custom.gift_message || null;
          if (!recipient) {
            console.warn(`gift order ${subId} missing recipient_email`);
            break;
          }
          const passCode = require('crypto').randomBytes(6).toString('hex').toUpperCase();
          await supabase.from('gifted_passes').upsert({
            buyer_user_id: buyerId,
            recipient_email: recipient,
            pass_code: passCode,
            message: giftMessage,
            lemonsqueezy_order_id: subId,
          }, { onConflict: 'recipient_email' });
          await logEvent('gift_pass_purchased', {
            userId: buyerId,
            metadata: { recipient_email: recipient, order_id: subId, pass_code: passCode },
          });
          // (Email notification to recipient is a TODO — the record is
          // the source of truth; the UI will let the buyer copy the
          // redeem link manually until an email service is wired up.)
          break;
        }

        // ── Self-purchase path (regular 7-Day Pass) ──────────────
        const durationDays = PLANS[plan].pass_duration_days || 7;
        const now = new Date();
        const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

        await supabase.from('subscriptions').upsert({
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
        }, { onConflict: 'user_id' });

        // NOTE: 7-Day Pass purchases do NOT trigger referral rewards — a
        // $10 reward on $9 revenue is a loss leader. Only Pro/Pro Voice
        // subscriptions (subscription_created case above) credit the referrer.
        // If this user later upgrades to a subscription, the normal
        // subscription_created flow will still find their 'signed_up'
        // referral row and reward the referrer properly.
        break;
      }

      case 'subscription_payment_refunded':
      case 'order_refunded': {
        // Either a subscription refund or a one-time order refund. Reverse
        // the referral reward if we're still inside the 14-day vesting window.
        const userId = await lookupUser();
        if (userId) await onRefund(userId);
        break;
      }

      case 'subscription_payment_success':
      default:
        // Not all events require DB writes — log and move on.
        break;
    }
  } catch (err) {
    console.error('LS webhook processing error:', err.message);
  }

  // Always 200 so LS doesn't retry on an internal bug.
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
    if (!interval || !['month', 'year'].includes(interval)) {
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

module.exports = { getSubscription, createCheckout, createPortal, handleWebhook };
