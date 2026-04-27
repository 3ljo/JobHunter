// Stripe Service
// Initializes the Stripe client and exports plan/price configuration.
//
// NOTE: The app currently uses Lemon Squeezy as the payment provider.
// Stripe is kept commented/dormant so it can be re-enabled later without
// rewriting the plan config. The PLANS constant below is still the
// single source of truth for quota limits (cv_limit, cl_limit, mi_limit)
// and is consumed by the rate limiter, profile controller, and
// subscription controller regardless of payment provider.

const Stripe = require('stripe');

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

// Plan configuration — maps internal plan names to Stripe Price IDs,
// Lemon Squeezy variant IDs, and rate limits.
//
// Ladder: Free → Starter (one-time 7-day pass, $9) → Pro ($19/mo, $149/yr)
//         → Pro Voice ($39/mo, $299/yr, includes voice mock interview).
//
// `pro_plus` is retained as an alias that resolves to the same limits as
// `pro_voice` so existing DB rows / webhooks keep working through migration.
const PLANS = {
  free: {
    name: 'Free',
    cv_limit: 1,
    cl_limit: 2,
    mi_limit: 0,
    features: [
      '1 CV analysis',
      '2 cover letters',
      'ATS score & keyword report',
      'PDF downloads',
      'Tracker (up to 15 jobs)',
    ],
  },
  starter: {
    name: '7-Day Pass',
    billing_type: 'one_time',
    pass_duration_days: 7,
    cv_limit: 999999, // unlimited during the 7-day window
    cl_limit: 999999,
    mi_limit: 0, // mock interview is voice-only, gated to Pro Voice
    features: [
      'Unlimited CV analyses (7 days)',
      'Unlimited cover letters (7 days)',
      'Full ATS audit & optimization',
      'AI quick edits',
      'Unlimited job tracker',
      'No auto-renew — one-time $9',
    ],
    ls_variants: {
      // One-time product (non-recurring) — create as a Single Payment variant in LS.
      once: process.env.LEMONSQUEEZY_VARIANT_STARTER_PASS,
    },
    // PayPal does not support one-time products through the Subscriptions
    // API. The 7-Day Pass stays LS-only for now.
  },
  pro: {
    name: 'Pro',
    billing_type: 'subscription',
    cv_limit: 999999, // unlimited
    cl_limit: 999999,
    mi_limit: 0, // mock interview is voice-only, gated to Pro Voice
    features: [
      'Unlimited CV analyses',
      'Unlimited cover letters',
      'Full ATS audit & optimization',
      'AI quick edits',
      'Priority AI processing',
      'Full CV history & analytics',
      'Unlimited job tracker',
    ],
    prices: {
      month: process.env.STRIPE_PRICE_PRO_MONTHLY,
      year: process.env.STRIPE_PRICE_PRO_YEARLY,
    },
    ls_variants: {
      month: process.env.LEMONSQUEEZY_VARIANT_PRO_MONTHLY,
      year: process.env.LEMONSQUEEZY_VARIANT_PRO_YEARLY,
    },
    paypal_plans: {
      month: process.env.PAYPAL_PLAN_PRO_MONTHLY,
      year: process.env.PAYPAL_PLAN_PRO_YEARLY,
    },
  },
  pro_voice: {
    name: 'Pro Voice',
    billing_type: 'subscription',
    cv_limit: 999999,
    cl_limit: 999999,
    mi_limit: 8, // 8 voice mock interviews / month (plus text included)
    features: [
      'Everything in Pro',
      'Voice Mock Interview (8 sessions / month)',
      'Voice feedback report',
      'Interview prep library',
      'LinkedIn-ready CV export',
      'Priority AI processing',
    ],
    prices: {
      month: process.env.STRIPE_PRICE_PRO_VOICE_MONTHLY,
      year: process.env.STRIPE_PRICE_PRO_VOICE_YEARLY,
    },
    ls_variants: {
      month: process.env.LEMONSQUEEZY_VARIANT_PRO_VOICE_MONTHLY,
      year: process.env.LEMONSQUEEZY_VARIANT_PRO_VOICE_YEARLY,
    },
    paypal_plans: {
      month: process.env.PAYPAL_PLAN_PRO_VOICE_MONTHLY,
      year: process.env.PAYPAL_PLAN_PRO_VOICE_YEARLY,
    },
  },
};

// Legacy alias: `pro_plus` rows/subscriptions from the old pricing map to
// `pro_voice` (the new top tier) so their entitlements don't regress.
PLANS.pro_plus = { ...PLANS.pro_voice, name: 'Pro Voice', legacy_alias_for: 'pro_voice' };

// Normalize any legacy plan key to its canonical form.
const canonicalPlan = (plan) => (plan === 'pro_plus' ? 'pro_voice' : plan);

// Get the rate limits for a given plan
const getPlanLimits = (plan) => {
  const config = PLANS[plan] || PLANS.free;
  return { cv_limit: config.cv_limit, cl_limit: config.cl_limit, mi_limit: config.mi_limit || 0 };
};

module.exports = { stripe, PLANS, getPlanLimits, canonicalPlan };
