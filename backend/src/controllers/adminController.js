// Admin Controller
// Dashboard stats, user management, usage analytics, settings

const supabase = require('../services/supabaseClient');
const { readSettings, updateSettings } = require('../services/settingsService');
const { getProviderConfig, COST_TABLE } = require('../services/aiClient');

// ─── DASHBOARD OVERVIEW ───────────────────────────────────────

const getDashboardStats = async (req, res) => {
  try {
    // Total users
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Total CVs analyzed
    const { count: totalCVs } = await supabase
      .from('cvs')
      .select('*', { count: 'exact', head: true });

    // Total jobs tracked
    const { count: totalJobs } = await supabase
      .from('job_tracker')
      .select('*', { count: 'exact', head: true });

    // Today's date range
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Usage stats from api_usage (may not exist yet)
    let todayApiCalls = 0;
    let todayCost = 0;
    let totalApiCalls = 0;
    let totalCost = 0;
    let weekCost = 0;
    let monthCost = 0;

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date();
    monthStart.setDate(monthStart.getDate() - 30);

    const { data: todayUsage, error: usageErr } = await supabase
      .from('api_usage')
      .select('estimated_cost')
      .gte('created_at', todayStart.toISOString())
      .lte('created_at', todayEnd.toISOString());

    if (!usageErr && todayUsage) {
      todayApiCalls = todayUsage.length;
      todayCost = todayUsage.reduce((sum, r) => sum + parseFloat(r.estimated_cost || 0), 0);
    }

    const { data: allUsage, error: allErr } = await supabase
      .from('api_usage')
      .select('estimated_cost, created_at');

    if (!allErr && allUsage) {
      totalApiCalls = allUsage.length;
      totalCost = allUsage.reduce((sum, r) => sum + parseFloat(r.estimated_cost || 0), 0);
      weekCost = allUsage
        .filter((r) => new Date(r.created_at) >= weekStart)
        .reduce((sum, r) => sum + parseFloat(r.estimated_cost || 0), 0);
      monthCost = allUsage
        .filter((r) => new Date(r.created_at) >= monthStart)
        .reduce((sum, r) => sum + parseFloat(r.estimated_cost || 0), 0);
    }

    // Current provider
    const providerConfig = getProviderConfig();

    res.json({
      users: totalUsers || 0,
      cvs: totalCVs || 0,
      jobs: totalJobs || 0,
      today: { apiCalls: todayApiCalls, cost: todayCost },
      week: { cost: weekCost },
      month: { cost: monthCost },
      total: { apiCalls: totalApiCalls, cost: totalCost },
      activeProvider: providerConfig.provider,
      activeModel: providerConfig.model,
    });
  } catch (err) {
    console.error('Admin dashboard error:', err.message);
    res.status(500).json({ error: 'Failed to load dashboard stats' });
  }
};

// ─── USERS ────────────────────────────────────────────────────

const getUsers = async (req, res) => {
  try {
    // Source of truth is auth.users (every signup lands here), NOT the
    // profiles table (which only exists once the user completes
    // onboarding or edits their profile). The old implementation queried
    // profiles directly and silently hid every fresh signup — admin
    // page looked empty until someone hand-filled their profile.
    //
    // listUsers() is paginated (default 50/page, max 1000/page). We
    // walk until exhausted so the admin actually sees everyone.
    const allUsers = [];
    const perPage = 1000;
    for (let page = 1; page <= 20; page++) { // cap at 20k — enough for the launch phase
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
      if (error) throw error;
      const batch = data?.users || [];
      allUsers.push(...batch);
      if (batch.length < perPage) break;
    }

    // Pull profiles + counts + usage + subscriptions in parallel; all are
    // optional lookups keyed by user_id, so we merge them in after.
    const [profilesRes, cvRes, jobRes, usageRes, subsRes] = await Promise.all([
      supabase.from('profiles').select('id, full_name, updated_at'),
      supabase.from('cvs').select('user_id'),
      supabase.from('job_tracker').select('user_id'),
      supabase.from('api_usage').select('user_id, estimated_cost'),
      supabase.from('subscriptions').select('user_id, plan, status'),
    ]);

    const profileMap = {};
    (profilesRes.data || []).forEach((p) => { profileMap[p.id] = p; });

    const cvMap = {};
    (cvRes.data || []).forEach((c) => { cvMap[c.user_id] = (cvMap[c.user_id] || 0) + 1; });

    const jobMap = {};
    (jobRes.data || []).forEach((j) => { jobMap[j.user_id] = (jobMap[j.user_id] || 0) + 1; });

    const usageMap = {};
    (usageRes.data || []).forEach((u) => {
      if (!usageMap[u.user_id]) usageMap[u.user_id] = { calls: 0, cost: 0 };
      usageMap[u.user_id].calls += 1;
      usageMap[u.user_id].cost += parseFloat(u.estimated_cost || 0);
    });

    const subMap = {};
    (subsRes.data || []).forEach((s) => { subMap[s.user_id] = s; });

    // Sort newest-first. auth.users has created_at as an ISO string.
    allUsers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const users = allUsers.map((u) => {
      const profile = profileMap[u.id];
      const sub = subMap[u.id];
      return {
        id: u.id,
        email: u.email || u.user_metadata?.email || '',
        full_name: profile?.full_name || u.user_metadata?.full_name || null,
        created_at: u.created_at,
        email_confirmed_at: u.email_confirmed_at || null,
        last_sign_in_at: u.last_sign_in_at || null,
        plan: sub?.plan || 'free',
        subscription_status: sub?.status || null,
        cv_count: cvMap[u.id] || 0,
        job_count: jobMap[u.id] || 0,
        api_calls: usageMap[u.id]?.calls || 0,
        api_cost: usageMap[u.id]?.cost || 0,
      };
    });

    res.json({ users });
  } catch (err) {
    console.error('Admin get users error:', err.message);
    res.status(500).json({ error: 'Failed to load users' });
  }
};

// ─── USAGE ANALYTICS ──────────────────────────────────────────

const getUsageAnalytics = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));

    const { data: usage, error } = await supabase
      .from('api_usage')
      .select('*')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      // Table might not exist yet
      return res.json({ usage: [], summary: { totalCalls: 0, totalCost: 0, byProvider: {}, byFeature: {}, daily: [] } });
    }

    // Build summary
    const byProvider = {};
    const byFeature = {};
    const dailyMap = {};
    let totalCost = 0;

    (usage || []).forEach((row) => {
      const cost = parseFloat(row.estimated_cost || 0);
      totalCost += cost;

      // By provider
      if (!byProvider[row.provider]) byProvider[row.provider] = { calls: 0, cost: 0, tokens: 0 };
      byProvider[row.provider].calls += 1;
      byProvider[row.provider].cost += cost;
      byProvider[row.provider].tokens += (row.input_tokens || 0) + (row.output_tokens || 0);

      // By feature
      if (!byFeature[row.feature]) byFeature[row.feature] = { calls: 0, cost: 0 };
      byFeature[row.feature].calls += 1;
      byFeature[row.feature].cost += cost;

      // Daily
      const day = row.created_at.substring(0, 10);
      if (!dailyMap[day]) dailyMap[day] = { date: day, calls: 0, cost: 0 };
      dailyMap[day].calls += 1;
      dailyMap[day].cost += cost;
    });

    const daily = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      usage: (usage || []).slice(0, 200), // Last 200 entries
      summary: {
        totalCalls: (usage || []).length,
        totalCost,
        byProvider,
        byFeature,
        daily,
      },
    });
  } catch (err) {
    console.error('Admin usage analytics error:', err.message);
    res.status(500).json({ error: 'Failed to load usage analytics' });
  }
};

// ─── SETTINGS ─────────────────────────────────────────────────

const getSettings = (req, res) => {
  try {
    const settings = readSettings();
    res.json({ settings, costTable: COST_TABLE });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load settings' });
  }
};

const saveSettings = (req, res) => {
  try {
    const updates = req.body;
    const settings = updateSettings(updates);
    res.json({ message: 'Settings updated', settings });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save settings' });
  }
};

// ─── CHECK ADMIN ──────────────────────────────────────────────

const checkAdmin = (req, res) => {
  res.json({ isAdmin: true, email: req.user.email });
};

module.exports = {
  getDashboardStats,
  getUsers,
  getUsageAnalytics,
  getSettings,
  saveSettings,
  checkAdmin,
};
