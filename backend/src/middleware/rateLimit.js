// Rate limiting middleware
// Checks today's usage from feature_usage (one row per user/feature/day)
// and blocks the request when the plan limit is reached.
// Admin users are NOT bypassed — limits apply to everyone based on their plan.

const supabase = require('../services/supabaseClient');
const { getPlanLimits } = require('../services/stripeService');
const { getTodayCount } = require('../services/usageService');

const createRateLimiter = (feature, limitKey) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) return next();

      // Look up user's subscription plan
      let plan = 'free';
      try {
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('plan, status')
          .eq('user_id', userId)
          .single();
        if (sub && sub.status === 'active') plan = sub.plan;
      } catch { /* no subscription row — free plan */ }

      const limits = getPlanLimits(plan);
      const limit = limits[limitKey];

      // Unlimited plan — skip the count query entirely.
      if (limit >= 999999) {
        req.rateLimitInfo = { used: 0, limit, remaining: limit, plan };
        return next();
      }

      const used = await getTodayCount(userId, feature);

      if (used >= limit) {
        const planName =
          plan === 'pro_voice' || plan === 'pro_plus' ? 'Pro Voice'
          : plan === 'pro' ? 'Pro'
          : plan === 'starter' ? '7-Day Pass'
          : 'Free';
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        return res.status(429).json({
          error: `Daily limit reached (${planName} plan: ${limit}/day). Upgrade your plan for more.`,
          limit,
          used,
          plan,
          resetsAt: new Date(todayStart.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        });
      }

      req.rateLimitInfo = { used, limit, remaining: limit - used, plan };
      next();
    } catch {
      // Don't block requests if rate limiting fails
      next();
    }
  };
};

const rateLimitCV = createRateLimiter('cv_analysis', 'cv_limit');
const rateLimitCL = createRateLimiter('cover_letter', 'cl_limit');
const rateLimitMI = createRateLimiter('mock_interview', 'mi_limit');

module.exports = { rateLimitCV, rateLimitCL, rateLimitMI };
