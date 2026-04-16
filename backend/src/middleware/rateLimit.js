// Rate limiting middleware
// Checks api_usage table to enforce daily limits from settings.json

const supabase = require('../services/supabaseClient');
const { getSetting } = require('../services/settingsService');

const createRateLimiter = (feature, settingKey) => {
  return async (req, res, next) => {
    try {
      const limit = parseInt(getSetting(settingKey)) || 999;
      const userId = req.user?.id;
      if (!userId) return next();

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
        return res.status(429).json({
          error: `Daily limit reached. You can use this feature ${limit} times per day. Try again tomorrow or upgrade your plan.`,
          limit,
          used: count,
          resetsAt: new Date(todayStart.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        });
      }

      // Attach usage info for downstream use
      req.rateLimitInfo = { used: count, limit, remaining: limit - count };
      next();
    } catch {
      // Don't block requests if rate limiting fails
      next();
    }
  };
};

const rateLimitCV = createRateLimiter('cv_analysis', 'rate_limit_cv_per_day');
const rateLimitCL = createRateLimiter('cover_letter', 'rate_limit_cl_per_day');

module.exports = { rateLimitCV, rateLimitCL };
