// Subscription middleware
// Attaches the user's subscription plan and rate limits to the request
// Must be used AFTER requireAuth

const supabase = require('../services/supabaseClient');
const { getPlanLimits } = require('../services/stripeService');

const checkSubscription = async (req, res, next) => {
  try {
    const { data } = await supabase
      .from('subscriptions')
      .select('plan, status')
      .eq('user_id', req.user.id)
      .single();

    // Default to free if no record or canceled
    const plan = (data && data.status === 'active') ? data.plan : 'free';
    req.subscription = { plan, ...getPlanLimits(plan) };
  } catch {
    req.subscription = { plan: 'free', ...getPlanLimits('free') };
  }

  next();
};

module.exports = checkSubscription;
