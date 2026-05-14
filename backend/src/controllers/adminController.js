// Admin Controller
// Overview, users, user-detail + actions, usage analytics, settings.

const supabase = require('../services/supabaseClient');
const { readSettings, updateSettings } = require('../services/settingsService');
const { getProviderConfig, COST_TABLE } = require('../services/aiClient');

// Plans that count toward MRR (recurring monthly). `pro_plus` is a
// legacy alias for `pro_voice`. `starter` is a one-shot 7-day pass and
// is tracked as recent revenue, not MRR.
const PLAN_PRICE = {
  pro: 19,
  pro_voice: 39,
  pro_plus: 39,
  starter: 9, // one-shot, not MRR
};

const isMrrPlan = (plan, billingInterval) =>
  (plan === 'pro' || plan === 'pro_voice' || plan === 'pro_plus') &&
  billingInterval !== 'once';

// ─── OVERVIEW ─────────────────────────────────────────────────
// One snapshot endpoint: counts, today's cost, MRR, active provider,
// and a quick health check for AI keys + supabase + paypal env.

const getOverview = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date();
    monthStart.setDate(monthStart.getDate() - 30);

    const [usersCount, cvCount, jobCount, todayUsage, monthUsage, subs] = await Promise.all([
      countAuthUsers(),
      supabase.from('cvs').select('*', { count: 'exact', head: true }),
      supabase.from('job_tracker').select('*', { count: 'exact', head: true }),
      supabase.from('api_usage').select('estimated_cost').gte('created_at', todayStart.toISOString()),
      supabase.from('api_usage').select('estimated_cost, created_at').gte('created_at', monthStart.toISOString()),
      supabase.from('subscriptions').select('plan, status, billing_interval, current_period_end'),
    ]);

    const sumCost = (rows) =>
      (rows || []).reduce((s, r) => s + parseFloat(r.estimated_cost || 0), 0);

    const todayCost = sumCost(todayUsage.data);
    const monthCost = sumCost(monthUsage.data);
    const weekCost = sumCost((monthUsage.data || []).filter((r) => new Date(r.created_at) >= weekStart));

    // Plan breakdown + MRR
    const planBreakdown = { free: 0, starter: 0, pro: 0, pro_voice: 0, canceled: 0 };
    let mrr = 0;
    (subs.data || []).forEach((s) => {
      const plan = s.plan === 'pro_plus' ? 'pro_voice' : s.plan;
      if (s.status === 'canceled') {
        planBreakdown.canceled += 1;
        return;
      }
      if (planBreakdown[plan] !== undefined) planBreakdown[plan] += 1;
      if (s.status === 'active' && isMrrPlan(s.plan, s.billing_interval)) {
        mrr += PLAN_PRICE[s.plan] || 0;
      }
    });

    const provider = getProviderConfig();

    res.json({
      counts: {
        users: usersCount,
        cvs: cvCount.count || 0,
        jobs: jobCount.count || 0,
      },
      cost: { today: todayCost, week: weekCost, month: monthCost },
      mrr,
      planBreakdown,
      activeProvider: provider.provider,
      activeModel: provider.model,
      health: await getHealthSnapshot(),
    });
  } catch (err) {
    console.error('Admin overview error:', err.message);
    res.status(500).json({ error: 'Failed to load overview' });
  }
};

// Walk auth.users pages and return total. Cheap because we only ask
// for IDs; supabase doesn't expose a HEAD count for auth.users.
const countAuthUsers = async () => {
  let total = 0;
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) break;
    const batch = data?.users || [];
    total += batch.length;
    if (batch.length < 1000) break;
  }
  return total;
};

// Health snapshot — env presence + a 1-row supabase ping. Boolean only,
// no secrets leaked.
const getHealthSnapshot = async () => {
  const env = (k) => !!process.env[k];

  let supabaseOk = false;
  try {
    const { error } = await supabase.from('profiles').select('id', { head: true, count: 'exact' }).limit(1);
    supabaseOk = !error;
  } catch {
    supabaseOk = false;
  }

  return {
    supabase: supabaseOk,
    anthropic_key: env('ANTHROPIC_API_KEY'),
    openai_key: env('OPENAI_API_KEY'),
    gemini_key: env('GEMINI_API_KEY'),
    paypal: env('PAYPAL_CLIENT_ID') && env('PAYPAL_CLIENT_SECRET'),
    paypal_mode: process.env.PAYPAL_MODE || 'sandbox',
  };
};

// ─── USERS ────────────────────────────────────────────────────

const getUsers = async (req, res) => {
  try {
    const allUsers = await listAllAuthUsers();

    const [profilesRes, cvRes, jobRes, usageRes, subsRes] = await Promise.all([
      supabase.from('profiles').select('id, full_name, updated_at'),
      supabase.from('cvs').select('user_id'),
      supabase.from('job_tracker').select('user_id'),
      supabase.from('api_usage').select('user_id, estimated_cost'),
      supabase.from('subscriptions').select('user_id, plan, status, current_period_end, billing_interval'),
    ]);

    const profileMap = indexBy(profilesRes.data, 'id');
    const subMap = indexBy(subsRes.data, 'user_id');
    const cvMap = countBy(cvRes.data, 'user_id');
    const jobMap = countBy(jobRes.data, 'user_id');

    const usageMap = {};
    (usageRes.data || []).forEach((u) => {
      if (!usageMap[u.user_id]) usageMap[u.user_id] = { calls: 0, cost: 0 };
      usageMap[u.user_id].calls += 1;
      usageMap[u.user_id].cost += parseFloat(u.estimated_cost || 0);
    });

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
        period_end: sub?.current_period_end || null,
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

const listAllAuthUsers = async () => {
  const all = [];
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const batch = data?.users || [];
    all.push(...batch);
    if (batch.length < 1000) break;
  }
  return all;
};

const indexBy = (rows, key) => {
  const m = {};
  (rows || []).forEach((r) => { m[r[key]] = r; });
  return m;
};

const countBy = (rows, key) => {
  const m = {};
  (rows || []).forEach((r) => { m[r[key]] = (m[r[key]] || 0) + 1; });
  return m;
};

// GET /admin/users/:id — full profile snapshot for the detail drawer.
const getUserDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: authData, error: authErr } = await supabase.auth.admin.getUserById(id);
    if (authErr || !authData?.user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const auth = authData.user;

    const [profileRes, subRes, cvsRes, jobsRes, usageRes, quotaRes, giftedSentRes, giftedRecvRes, promoRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', id).maybeSingle(),
      supabase.from('subscriptions').select('*').eq('user_id', id).maybeSingle(),
      supabase.from('cvs').select('id, file_name, created_at').eq('user_id', id).order('created_at', { ascending: false }).limit(20),
      supabase.from('job_tracker').select('id, company, position, status, created_at').eq('user_id', id).order('created_at', { ascending: false }).limit(20),
      supabase.from('api_usage').select('id, feature, provider, model, estimated_cost, created_at, success').eq('user_id', id).order('created_at', { ascending: false }).limit(50),
      supabase.from('feature_usage').select('feature, usage_date, count').eq('user_id', id).order('usage_date', { ascending: false }).limit(30),
      supabase.from('gifted_passes').select('id, recipient_email, redeemed, redeemed_at, pass_code, created_at').eq('buyer_user_id', id).order('created_at', { ascending: false }),
      supabase.from('gifted_passes').select('id, recipient_email, redeemed_at, pass_code').eq('redeemed_by_user_id', id),
      supabase.from('promo_code_usage').select('used_at, promo_code:promo_codes(code, discount_type, discount_amount)').eq('user_id', id).order('used_at', { ascending: false }),
    ]);

    const usage = usageRes.data || [];
    const totalCost = usage.reduce((s, r) => s + parseFloat(r.estimated_cost || 0), 0);

    res.json({
      user: {
        id: auth.id,
        email: auth.email,
        full_name: profileRes.data?.full_name || auth.user_metadata?.full_name || null,
        created_at: auth.created_at,
        email_confirmed_at: auth.email_confirmed_at,
        last_sign_in_at: auth.last_sign_in_at,
        is_banned: !!auth.banned_until && new Date(auth.banned_until) > new Date(),
        banned_until: auth.banned_until,
        provider: auth.app_metadata?.provider || 'email',
      },
      profile: profileRes.data || null,
      subscription: subRes.data || null,
      cvs: cvsRes.data || [],
      jobs: jobsRes.data || [],
      usage_recent: usage,
      usage_total: { calls: usage.length, cost: totalCost },
      quotas_recent: quotaRes.data || [],
      gifts_sent: giftedSentRes.data || [],
      gifts_received: giftedRecvRes.data || [],
      promos_redeemed: promoRes.data || [],
    });
  } catch (err) {
    console.error('Admin user detail error:', err.message);
    res.status(500).json({ error: 'Failed to load user detail' });
  }
};

// ─── USER ACTIONS ─────────────────────────────────────────────

// POST /admin/users/:id/grant — comp a paid plan for N days.
// Upserts the subscriptions row with status=active, billing_interval=once,
// current_period_end = now + days. Marked as `provider='admin'`.
const grantPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { plan = 'pro', days = 30 } = req.body;

    if (!['starter', 'pro', 'pro_voice'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan' });
    }
    const periodDays = Math.max(1, Math.min(parseInt(days) || 30, 3650));
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + periodDays);

    const row = {
      user_id: id,
      plan,
      status: 'active',
      billing_interval: 'once',
      current_period_start: new Date().toISOString(),
      current_period_end: periodEnd.toISOString(),
      cancel_at_period_end: false,
      provider: 'admin',
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('subscriptions')
      .upsert(row, { onConflict: 'user_id' });

    if (error) throw error;
    res.json({ message: `Granted ${plan} for ${periodDays} days`, period_end: row.current_period_end });
  } catch (err) {
    console.error('grantPlan error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to grant plan' });
  }
};

// PATCH /admin/users/:id/plan — directly change plan (no period change).
// Use sparingly; prefer grant for comps.
const changePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { plan, status } = req.body;

    if (!['free', 'starter', 'pro', 'pro_voice'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const { error } = await supabase
      .from('subscriptions')
      .upsert(
        {
          user_id: id,
          plan,
          status: status || 'active',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );

    if (error) throw error;
    res.json({ message: `Plan set to ${plan}` });
  } catch (err) {
    console.error('changePlan error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to change plan' });
  }
};

// POST /admin/users/:id/reset-password — sends a Supabase recovery email.
const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: u } = await supabase.auth.admin.getUserById(id);
    if (!u?.user?.email) return res.status(404).json({ error: 'User not found' });

    const { error } = await supabase.auth.resetPasswordForEmail(u.user.email);
    if (error) throw error;
    res.json({ message: `Reset email sent to ${u.user.email}` });
  } catch (err) {
    console.error('resetUserPassword error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to send reset email' });
  }
};

// POST /admin/users/:id/ban — temporary ban. duration in hours.
const banUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { hours = 24 * 365 } = req.body;
    const { error } = await supabase.auth.admin.updateUserById(id, {
      ban_duration: `${parseInt(hours)}h`,
    });
    if (error) throw error;
    res.json({ message: `User banned for ${hours}h` });
  } catch (err) {
    console.error('banUser error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to ban user' });
  }
};

const unbanUser = async (req, res) => {
  try {
    const { id } = req.params;
    // Supabase: ban_duration='none' lifts the ban.
    const { error } = await supabase.auth.admin.updateUserById(id, { ban_duration: 'none' });
    if (error) throw error;
    res.json({ message: 'User unbanned' });
  } catch (err) {
    console.error('unbanUser error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to unban user' });
  }
};

// DELETE /admin/users/:id — permanently delete. Cascades via FK in
// most tables; subscriptions/promo_code_usage cascade on user_id.
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (id === req.user?.id) {
      return res.status(400).json({ error: 'Refusing to delete your own admin account' });
    }
    const { error } = await supabase.auth.admin.deleteUser(id);
    if (error) throw error;
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error('deleteUser error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to delete user' });
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
      return res.json({ usage: [], summary: { totalCalls: 0, totalCost: 0, byProvider: {}, byFeature: {}, daily: [] } });
    }

    const byProvider = {};
    const byFeature = {};
    const dailyMap = {};
    let totalCost = 0;

    (usage || []).forEach((row) => {
      const cost = parseFloat(row.estimated_cost || 0);
      totalCost += cost;

      if (!byProvider[row.provider]) byProvider[row.provider] = { calls: 0, cost: 0, tokens: 0 };
      byProvider[row.provider].calls += 1;
      byProvider[row.provider].cost += cost;
      byProvider[row.provider].tokens += (row.input_tokens || 0) + (row.output_tokens || 0);

      if (!byFeature[row.feature]) byFeature[row.feature] = { calls: 0, cost: 0 };
      byFeature[row.feature].calls += 1;
      byFeature[row.feature].cost += cost;

      const day = row.created_at.substring(0, 10);
      if (!dailyMap[day]) dailyMap[day] = { date: day, calls: 0, cost: 0 };
      dailyMap[day].calls += 1;
      dailyMap[day].cost += cost;
    });

    const daily = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      usage: (usage || []).slice(0, 200),
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
    res.json({ settings, costTable: COST_TABLE, health: { /* placeholder */ } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load settings' });
  }
};

const saveSettings = (req, res) => {
  try {
    const settings = updateSettings(req.body);
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
  // overview
  getOverview,
  // users
  getUsers,
  getUserDetail,
  grantPlan,
  changePlan,
  resetUserPassword,
  banUser,
  unbanUser,
  deleteUser,
  // usage
  getUsageAnalytics,
  // settings
  getSettings,
  saveSettings,
  // misc
  checkAdmin,
};
