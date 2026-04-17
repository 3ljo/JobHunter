// Usage Service
// Single source of truth for per-user daily feature quotas.
//
// Backed by the `feature_usage` table (one row per user/feature/day).
// - `incrementUsage` is called ONCE per successful analysis, regardless
//   of how many internal AI stages the analysis runs.
// - `getTodayCount` is read by the rate-limit middleware and the
//   /api/subscription endpoint so both always agree.
//
// This replaces the old approach of counting rows in `api_usage`, which
// over-counted multi-stage pipelines (e.g. CV analysis logs 2-3 rows
// per run, mock interview logs 3+ rows per run).

const supabase = require('./supabaseClient');

const VALID_FEATURES = ['cv_analysis', 'cover_letter', 'mock_interview'];

const todayIso = () => new Date().toISOString().split('T')[0];

// Read today's count for (user, feature). Returns 0 on any error or missing row.
const getTodayCount = async (userId, feature) => {
  if (!userId || !VALID_FEATURES.includes(feature)) return 0;
  try {
    const { data, error } = await supabase
      .from('feature_usage')
      .select('count')
      .eq('user_id', userId)
      .eq('feature', feature)
      .eq('usage_date', todayIso())
      .maybeSingle();
    if (error) {
      // If the table is missing, don't block the user — log once and return 0.
      if (error.code !== '42P01') {
        console.warn('feature_usage read failed:', error.message);
      }
      return 0;
    }
    return data?.count || 0;
  } catch (err) {
    console.warn('feature_usage read threw:', err.message);
    return 0;
  }
};

// Atomic increment via RPC. Falls back to a non-atomic upsert if the RPC
// isn't installed yet (e.g. during migration). Never throws — quota tracking
// must not break the user's request path.
const incrementUsage = async (userId, feature) => {
  if (!userId || !VALID_FEATURES.includes(feature)) return;
  try {
    const { error } = await supabase.rpc('increment_feature_usage', {
      p_user_id: userId,
      p_feature: feature,
    });
    if (!error) return;

    // RPC not installed — try an upsert as a best-effort fallback.
    if (error.code === '42883' || /function.*does not exist/i.test(error.message || '')) {
      const today = todayIso();
      const { data: existing } = await supabase
        .from('feature_usage')
        .select('count')
        .eq('user_id', userId)
        .eq('feature', feature)
        .eq('usage_date', today)
        .maybeSingle();
      const newCount = (existing?.count || 0) + 1;
      const { error: upsertErr } = await supabase
        .from('feature_usage')
        .upsert(
          { user_id: userId, feature, usage_date: today, count: newCount, updated_at: new Date().toISOString() },
          { onConflict: 'user_id,feature,usage_date' }
        );
      if (upsertErr) console.warn('feature_usage upsert fallback failed:', upsertErr.message);
      return;
    }

    // Table missing — surface a clear hint once.
    if (error.code === '42P01') {
      console.warn('feature_usage table is missing — run backend/src/database/feature-usage-schema.sql');
      return;
    }

    console.warn('feature_usage increment failed:', error.message);
  } catch (err) {
    console.warn('feature_usage increment threw:', err.message);
  }
};

module.exports = { getTodayCount, incrementUsage, VALID_FEATURES };
