// Stripe Service
// Initializes the Stripe client and exports plan/price configuration

const Stripe = require('stripe');

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

// Plan configuration — maps internal plan names to Stripe Price IDs and rate limits
const PLANS = {
  free: {
    name: 'Free',
    cv_limit: 3,
    cl_limit: 5,
    features: ['3 CV analyses per day', '5 cover letters per day', 'ATS score & keyword report', 'PDF downloads'],
  },
  pro: {
    name: 'Pro',
    cv_limit: 25,
    cl_limit: 999999, // unlimited
    features: ['25 CV analyses per day', 'Unlimited cover letters', 'Full ATS audit & optimization', 'AI quick edits', 'Priority AI processing', 'Full CV history & analytics'],
    prices: {
      month: process.env.STRIPE_PRICE_PRO_MONTHLY,
      year: process.env.STRIPE_PRICE_PRO_YEARLY,
    },
  },
  pro_plus: {
    name: 'Pro+',
    cv_limit: 999999, // unlimited
    cl_limit: 999999, // unlimited
    features: ['Unlimited CV analyses', 'Unlimited cover letters', 'Full ATS audit & optimization', 'AI quick edits', 'Job application tracker', 'Priority AI processing', 'Full CV history & analytics', 'Advanced voice matching'],
    prices: {
      month: process.env.STRIPE_PRICE_PRO_PLUS_MONTHLY,
      year: process.env.STRIPE_PRICE_PRO_PLUS_YEARLY,
    },
  },
};

// Get the rate limits for a given plan
const getPlanLimits = (plan) => {
  const config = PLANS[plan] || PLANS.free;
  return { cv_limit: config.cv_limit, cl_limit: config.cl_limit };
};

module.exports = { stripe, PLANS, getPlanLimits };
