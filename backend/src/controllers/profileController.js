// Profile controller
// Handles user profile CRUD operations

const supabase = require('../services/supabaseClient');

// Get the authenticated user's profile. Returns { profile: null } when no row
// exists yet — a row is only created the first time the user saves Settings,
// so OAuth signups and never-edited accounts legitimately have no profile.
// The frontend (accountStore, dashboard greeting) already handles null.
const getProfile = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .maybeSingle();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ profile: data ?? null });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Update the authenticated user's profile (upsert)
const updateProfile = async (req, res) => {
  const { full_name, location, linkedin_url, website_url, avatar_url } = req.body;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: req.user.id,
        email: req.user.email,
        full_name,
        location,
        linkedin_url,
        website_url,
        avatar_url,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ message: 'Profile updated', profile: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Create a minimal profile (called internally after registration)
const createProfile = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: req.user.id,
        email: req.user.email,
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(201).json({ profile: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Get authenticated user's usage stats (subscription-aware limits)
const getMyUsage = async (req, res) => {
  try {
    const { getPlanLimits } = require('../services/stripeService');
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    // Look up user's subscription plan
    let plan = 'free';
    try {
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('plan, status')
        .eq('user_id', req.user.id)
        .single();
      if (sub && sub.status === 'active') plan = sub.plan;
    } catch { /* no subscription row — free plan */ }

    const limits = getPlanLimits(plan);

    // Today's CV analyses
    const { count: cvToday } = await supabase
      .from('api_usage')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user.id)
      .eq('feature', 'cv_analysis')
      .eq('success', true)
      .gte('created_at', todayStart.toISOString());

    // Today's cover letters
    const { count: clToday } = await supabase
      .from('api_usage')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user.id)
      .eq('feature', 'cover_letter')
      .eq('success', true)
      .gte('created_at', todayStart.toISOString());

    // This month total
    const { count: monthTotal } = await supabase
      .from('api_usage')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user.id)
      .eq('success', true)
      .gte('created_at', monthStart.toISOString());

    // Total CVs saved
    const { count: totalCVs } = await supabase
      .from('cvs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user.id);

    res.json({
      usage: {
        plan,
        cv_today: cvToday || 0,
        cv_limit: limits.cv_limit,
        cl_today: clToday || 0,
        cl_limit: limits.cl_limit,
        month_total: monthTotal || 0,
        total_cvs: totalCVs || 0,
      },
    });
  } catch (err) {
    // If api_usage table doesn't exist, return zeroes
    res.json({
      usage: {
        plan: 'free',
        cv_today: 0, cv_limit: 3,
        cl_today: 0, cl_limit: 5,
        month_total: 0, total_cvs: 0,
      },
    });
  }
};

module.exports = { getProfile, updateProfile, createProfile, getMyUsage };
