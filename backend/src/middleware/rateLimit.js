// Rate limiting middleware
// Checks today's usage from feature_usage (one row per user/feature/day)
// and blocks the request when the plan limit is reached.
// Admin users are NOT bypassed — limits apply to everyone based on their plan.

const supabase = require('../services/supabaseClient');
const { getPlanLimits } = require('../services/stripeService');
const { getTodayCount } = require('../services/usageService');

const createRateLimiter = (feature, limitKey) => {
  return async (req, res, next) => {
    const userId = req.user?.id;
    if (!userId) return next();

    // Plan lookup — use .maybeSingle() so no-subscription-row isn't an
    // error (it just means free plan). Real errors (DB down, RLS) must
    // be surfaced so we can decide to fail closed below.
    let plan = 'free';
    try {
      const { data: sub, error: subErr } = await supabase
        .from('subscriptions')
        .select('plan, status')
        .eq('user_id', userId)
        .maybeSingle();
      if (subErr) throw subErr;
      if (sub && sub.status === 'active') plan = sub.plan;
    } catch (err) {
      // Fail CLOSED. The previous implementation's `next()` on error
      // silently let every request through during a DB hiccup, which
      // was an unlimited-quota abuse vector. Surface a 503 so the
      // client retries instead of burning our AI budget.
      console.error(`rateLimit: subscription lookup failed for user ${userId}:`, err.message || err);
      return res.status(503).json({
        error: 'Temporary service issue. Please try again in a moment.',
        code: 'rate_limit_unavailable',
      });
    }

    try {
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
        // UTC day boundary — matches usageService.getTodayCount (which
        // uses a UTC ISO date string). Using the server's local midnight
        // here caused a silent off-by-N-hours reset-clock skew where the
        // DB and the API disagreed on "today".
        const todayUtc = new Date();
        todayUtc.setUTCHours(0, 0, 0, 0);
        return res.status(429).json({
          error: `Daily limit reached (${planName} plan: ${limit}/day). Upgrade your plan for more.`,
          limit,
          used,
          plan,
          resetsAt: new Date(todayUtc.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        });
      }

      req.rateLimitInfo = { used, limit, remaining: limit - used, plan };
      next();
    } catch (err) {
      // Count query failed — fail closed, same reasoning as above.
      console.error(`rateLimit: usage count failed for user ${userId}:`, err.message || err);
      return res.status(503).json({
        error: 'Temporary service issue. Please try again in a moment.',
        code: 'rate_limit_unavailable',
      });
    }
  };
};

const rateLimitCV = createRateLimiter('cv_analysis', 'cv_limit');
const rateLimitCL = createRateLimiter('cover_letter', 'cl_limit');
const rateLimitMI = createRateLimiter('mock_interview', 'mi_limit');

module.exports = { rateLimitCV, rateLimitCL, rateLimitMI };
