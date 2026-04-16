// Referral Controller
// Handles referral code generation, lookup, tracking, and admin analytics

const crypto = require('crypto');
const supabase = require('../services/supabaseClient');

// Referral reward config
const REFERRAL_DISCOUNT_PERCENT = 30; // New user gets 30% off first month

// Generate a unique referral code like REF-A3B7C9
function generateCode() {
  return 'REF-' + crypto.randomBytes(3).toString('hex').toUpperCase();
}

// GET /api/referral/my-code — Get or create the user's referral code
const getMyReferralCode = async (req, res) => {
  try {
    // Check if user already has a code
    const { data: existing } = await supabase
      .from('referral_codes')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (existing) {
      return res.json({ referral_code: existing });
    }

    // Generate a new one
    let code = generateCode();
    let attempts = 0;
    while (attempts < 5) {
      const { data, error } = await supabase
        .from('referral_codes')
        .insert({ user_id: req.user.id, code })
        .select()
        .single();

      if (!error && data) {
        return res.json({ referral_code: data });
      }
      console.error('Referral code insert error:', error?.message, error?.code);
      // Collision (23505) — try another code
      if (error?.code === '23505') {
        code = generateCode();
        attempts++;
        continue;
      }
      // Other error — bail
      return res.status(500).json({ error: error?.message || 'Failed to generate referral code' });
    }

    return res.status(500).json({ error: 'Failed to generate referral code after multiple attempts' });
  } catch (err) {
    console.error('Referral code error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};

// GET /api/referral/my-referrals — List users this person has referred
const getMyReferrals = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('referrals')
      .select('id, referred_user_id, referral_code, referrer_reward_applied, referred_reward_applied, created_at')
      .eq('referrer_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Enrich with referred user emails
    const userIds = (data || []).map((r) => r.referred_user_id);
    let emailMap = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', userIds);
      (profiles || []).forEach((p) => { if (p.email) emailMap[p.id] = p.email; });

      // Fill gaps from auth.users
      const missing = userIds.filter((id) => !emailMap[id]);
      if (missing.length > 0) {
        const { data: authData } = await supabase.auth.admin.listUsers();
        if (authData?.users) {
          authData.users.forEach((u) => {
            if (missing.includes(u.id)) emailMap[u.id] = u.email;
          });
        }
      }
    }

    const referrals = (data || []).map((r) => ({
      ...r,
      referred_email: emailMap[r.referred_user_id] || 'Unknown',
    }));

    return res.json({ referrals });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// POST /api/referral/validate — Validate a referral code (used at registration)
const validateReferralCode = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Referral code is required' });

    const { data, error } = await supabase
      .from('referral_codes')
      .select('id, user_id, code')
      .eq('code', code.toUpperCase().trim())
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Invalid referral code' });
    }

    return res.json({ valid: true, referral_code: data.code });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Called internally after registration — links the referral
const applyReferralOnRegistration = async (newUserId, referralCode) => {
  if (!referralCode) return;

  try {
    const { data: refCode } = await supabase
      .from('referral_codes')
      .select('user_id, code')
      .eq('code', referralCode.toUpperCase().trim())
      .single();

    if (!refCode) return;

    // Don't let users refer themselves
    if (refCode.user_id === newUserId) return;

    // Create the referral record
    await supabase.from('referrals').insert({
      referrer_id: refCode.user_id,
      referred_user_id: newUserId,
      referral_code: refCode.code,
    });

    // Increment the referral code usage count
    await supabase.rpc('increment_referral_count', { code_text: refCode.code }).catch(() => {
      // Fallback if RPC doesn't exist — do a manual update
      supabase.from('referral_codes')
        .update({ times_used: (refCode.times_used || 0) + 1 })
        .eq('code', refCode.code)
        .then(() => {});
    });
  } catch (err) {
    console.error('Failed to apply referral:', err.message);
  }
};

// GET /api/referral/check-discount — Check if user has a referral discount to apply
const checkReferralDiscount = async (req, res) => {
  try {
    // Check if this user was referred and hasn't used their discount yet
    const { data: referral } = await supabase
      .from('referrals')
      .select('id, referred_reward_applied')
      .eq('referred_user_id', req.user.id)
      .single();

    if (!referral || referral.referred_reward_applied) {
      return res.json({ has_discount: false });
    }

    return res.json({
      has_discount: true,
      discount_type: 'percent',
      discount_amount: REFERRAL_DISCOUNT_PERCENT,
      label: `Referral discount: ${REFERRAL_DISCOUNT_PERCENT}% off`,
    });
  } catch (err) {
    return res.json({ has_discount: false });
  }
};

// ─── ADMIN ENDPOINTS ───────────────────────────────────────

// GET /api/admin/referrals — Full referral tracker for admin
const getAdminReferrals = async (req, res) => {
  try {
    const { data: referrals, error } = await supabase
      .from('referrals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get all user IDs involved
    const allIds = new Set();
    (referrals || []).forEach((r) => { allIds.add(r.referrer_id); allIds.add(r.referred_user_id); });

    let emailMap = {};
    if (allIds.size > 0) {
      // Try profiles first
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', Array.from(allIds));
      (profiles || []).forEach((p) => { if (p.email) emailMap[p.id] = p.email; });

      // Fill gaps from auth.users for any missing emails
      const missingIds = Array.from(allIds).filter((id) => !emailMap[id]);
      if (missingIds.length > 0) {
        const { data: authData } = await supabase.auth.admin.listUsers();
        if (authData?.users) {
          authData.users.forEach((u) => {
            if (missingIds.includes(u.id)) emailMap[u.id] = u.email;
          });
        }
      }
    }

    // Get referral codes with usage counts
    const { data: codes } = await supabase
      .from('referral_codes')
      .select('*')
      .order('times_used', { ascending: false });

    const enrichedCodes = (codes || []).map((c) => ({
      ...c,
      user_email: emailMap[c.user_id] || 'Unknown',
    }));

    const enrichedReferrals = (referrals || []).map((r) => ({
      ...r,
      referrer_email: emailMap[r.referrer_id] || 'Unknown',
      referred_email: emailMap[r.referred_user_id] || 'Unknown',
    }));

    // Top referrers
    const referrerCounts = {};
    (referrals || []).forEach((r) => {
      referrerCounts[r.referrer_id] = (referrerCounts[r.referrer_id] || 0) + 1;
    });
    const topReferrers = Object.entries(referrerCounts)
      .map(([id, count]) => ({ user_id: id, email: emailMap[id] || 'Unknown', referral_count: count }))
      .sort((a, b) => b.referral_count - a.referral_count)
      .slice(0, 10);

    return res.json({
      referrals: enrichedReferrals,
      codes: enrichedCodes,
      topReferrers,
      stats: {
        total_referrals: (referrals || []).length,
        total_codes: (codes || []).length,
        rewards_given: (referrals || []).filter((r) => r.referrer_reward_applied).length,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getMyReferralCode,
  getMyReferrals,
  validateReferralCode,
  applyReferralOnRegistration,
  checkReferralDiscount,
  getAdminReferrals,
  REFERRAL_DISCOUNT_PERCENT,
};
