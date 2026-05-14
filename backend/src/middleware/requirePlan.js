// Plan-gating middleware. Use AFTER requireAuth to enforce that the
// authenticated user has one of the given subscription plans active
// on the server side. Frontend gates are UX — this is the real fence.
//
// Example:
//   router.post('/start', requireAuth, requirePlan(['pro_voice', 'pro_plus']), rateLimitMI, startInterview);

const supabase = require('../services/supabaseClient');
const { canonicalPlan } = require('../services/stripeService');

const requirePlan = (allowedPlans) => {
  const allowed = new Set((allowedPlans || []).map((p) => canonicalPlan(p)));
  return async (req, res, next) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const { data: sub, error } = await supabase
        .from('subscriptions')
        .select('plan, status, current_period_end')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;

      const plan = canonicalPlan(sub?.plan || 'free');
      const statusOk = sub?.status === 'active' || sub?.status === 'trialing';

      // Starter pass expires — respect current_period_end.
      let effectivePlan = plan;
      if (plan === 'starter' && sub?.current_period_end) {
        if (new Date(sub.current_period_end).getTime() < Date.now()) {
          effectivePlan = 'free';
        }
      }

      if (!statusOk || !allowed.has(effectivePlan)) {
        return res.status(403).json({
          error: 'This feature requires a higher plan.',
          code: 'plan_required',
          required_plans: [...allowed],
          current_plan: effectivePlan,
        });
      }
      req.subscriptionPlan = effectivePlan;
      next();
    } catch (err) {
      // Fail closed — a DB hiccup must not grant access to a paid feature.
      console.error('requirePlan: subscription lookup failed:', err.message || err);
      return res.status(503).json({
        error: 'Temporary service issue. Please try again.',
        code: 'plan_check_unavailable',
      });
    }
  };
};

module.exports = requirePlan;
