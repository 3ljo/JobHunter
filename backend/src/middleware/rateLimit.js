// Rate limiting middleware
// Checks api_usage table to enforce daily limits based on user's subscription plan.
// Admin users are NOT bypassed — limits apply to everyone based on their plan.

const supabase = require('../services/supabaseClient');
const { getPlanLimits } = require('../services/stripeService');

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

      // Count today's usage for this user + feature
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { count, error } = await supabase
        .from('api_usage')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('feature', feature)
        .eq('success', true)
        .gte('created_at', todayStart.toISOString());

      // If table doesn't exist yet, skip rate limiting
      if (error) return next();

      if (count >= limit) {
        const planName = plan === 'pro_plus' ? 'Pro+' : plan === 'pro' ? 'Pro' : 'Free';
        return res.status(429).json({
          error: `Daily limit reached (${planName} plan: ${limit}/day). Upgrade your plan for more.`,
          limit,
          used: count,
          plan,
          resetsAt: new Date(todayStart.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        });
      }

      // Attach usage info for downstream use
      req.rateLimitInfo = { used: count, limit, remaining: limit - count, plan };
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
