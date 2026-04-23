// Referral Controller — Hired & Help program.
//
// Responsibilities:
//   - ensureCodeForUser(): idempotently create a referral_codes row on signup
//   - getMyReferralInfo: GET /api/referral/me — code, share URL, stats, tier
//   - trackClick: POST /api/referral/track — records a ?ref=CODE landing
//   - attributeOnSignup: called internally from authController after a
//     successful signup, creates/updates the referrals row
//
// Webhook-side mutations (status=paid, refunded, etc.) live in
// subscriptionController.js, not here.

const crypto = require('crypto');
const supabase = require('../services/supabaseClient');
const { hashIp, getClientIp } = require('../lib/referrals/hashIp');

// 8-char URL-safe code. Alphabet excludes look-alike chars (0/O, 1/I/L).
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function generateCode(len = 8) {
  let out = '';
  for (let i = 0; i < len; i++) {
    out += ALPHABET[crypto.randomInt(ALPHABET.length)];
  }
  return out;
}

function canonicalFrontend() {
  const raw = process.env.FRONTEND_URL || '';
  const first = raw.split(',')[0].trim();
  return first.replace(/\/$/, '');
}

// ─────────────────────────────────────────
// Idempotent: creates a referral_codes row if the user doesn't have one.
// Safe to call multiple times. Returns the row (existing or new).
async function ensureCodeForUser(userId) {
  if (!userId) return null;

  const { data: existing } = await supabase
    .from('referral_codes')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) return existing;

  // Collision retry — DB enforces UNIQUE(code) so we just retry on 23505.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();
    const { data, error } = await supabase
      .from('referral_codes')
      .insert({ user_id: userId, code, tier: 'standard' })
      .select()
      .single();
    if (!error) return data;
    if (error.code !== '23505') {
      console.warn('referral_codes insert failed:', error.message);
      return null;
    }
  }
  console.warn('referral_codes: 5 code collisions in a row — giving up');
  return null;
}

// Self-referral check. Returns true if this (referrer, email, ip_hash)
// combo looks like someone trying to refer themselves.
//
//   - referee's email shares a local-part-before-plus with the referrer
//   - OR the IP hash matches a referral row the referrer themselves owns
async function looksLikeSelfReferral({ referrerId, refereeEmail, refereeIpHash }) {
  if (!referrerId || !refereeEmail) return false;

  // Same email (ignoring +aliases) as the referrer's account?
  try {
    const { data: refUser } = await supabase.auth.admin.getUserById(referrerId);
    const referrerEmail = refUser?.user?.email?.toLowerCase();
    if (referrerEmail) {
      const normalize = (e) => {
        const [local, domain] = e.toLowerCase().split('@');
        if (!domain) return e.toLowerCase();
        const base = local.split('+')[0];
        return `${base}@${domain}`;
      };
      if (normalize(referrerEmail) === normalize(refereeEmail)) return true;
    }
  } catch {
    /* non-fatal — fall through to IP check */
  }

  // Same device (IP hash) as a prior referral from this same referrer?
  if (refereeIpHash) {
    const { data: sameIp } = await supabase
      .from('referrals')
      .select('id')
      .eq('referrer_id', referrerId)
      .eq('ip_address_hash', refereeIpHash)
      .limit(1);
    if (sameIp && sameIp.length > 0) return true;
  }
  return false;
}

// ─────────────────────────────────────────
// Called from authController.register AFTER Supabase createUser succeeds.
// Idempotent per (referrer, email) — uq_referrals_referrer_email prevents
// duplicates. Never throws — referral attribution must not block signup.
async function attributeOnSignup({ refCode, newUserId, newUserEmail, ipHash, fingerprint }) {
  if (!refCode || !newUserId || !newUserEmail) return;

  try {
    const normalizedCode = String(refCode).toUpperCase().trim();

    const { data: codeRow } = await supabase
      .from('referral_codes')
      .select('user_id, code, is_active')
      .eq('code', normalizedCode)
      .maybeSingle();

    if (!codeRow || !codeRow.is_active) return;
    if (codeRow.user_id === newUserId) return; // trivial self-ref

    const isSelfRef = await looksLikeSelfReferral({
      referrerId: codeRow.user_id,
      refereeEmail: newUserEmail,
      refereeIpHash: ipHash,
    });

    const status = isSelfRef ? 'fraud' : 'signed_up';

    await supabase.from('referrals').upsert(
      {
        referrer_id: codeRow.user_id,
        referee_id: newUserId,
        referee_email: newUserEmail.toLowerCase(),
        referral_code: codeRow.code,
        status,
        ip_address_hash: ipHash || null,
        device_fingerprint: fingerprint || null,
      },
      { onConflict: 'referrer_id, referee_email' }
    );
  } catch (err) {
    console.warn('attributeOnSignup failed:', err.message);
  }
}

// ─────────────────────────────────────────
// GET /api/referral/me — everything the user's dashboard needs.
const getMyReferralInfo = async (req, res) => {
  try {
    const userId = req.user.id;

    const codeRow = await ensureCodeForUser(userId);
    if (!codeRow) {
      return res.status(500).json({ error: 'Could not generate a referral code for this user' });
    }

    // Aggregate referrals by status for the dashboard stats block.
    const { data: rows } = await supabase
      .from('referrals')
      .select('id, status, reward_amount_cents, reward_vested_at, reward_paid_at, referee_email, created_at, paid_conversion_at')
      .eq('referrer_id', userId)
      .order('created_at', { ascending: false });

    const now = Date.now();
    const referrals = rows || [];
    let pendingRewardCents = 0;   // paid, not yet vested
    let vestedRewardCents = 0;    // vested, not yet paid out
    let paidOutRewardCents = 0;   // paid out
    let signupCount = 0;
    let paidCount = 0;
    let confirmedCount = 0;

    for (const r of referrals) {
      if (r.status === 'signed_up' || r.status === 'paid' || r.status === 'confirmed' || r.status === 'paid_out') signupCount++;
      if (r.status === 'paid' || r.status === 'confirmed' || r.status === 'paid_out') paidCount++;
      if (r.status === 'confirmed' || r.status === 'paid_out') confirmedCount++;

      if (r.status === 'paid_out') {
        paidOutRewardCents += r.reward_amount_cents || 0;
      } else if (r.status === 'confirmed') {
        vestedRewardCents += r.reward_amount_cents || 0;
      } else if (r.status === 'paid') {
        const vestedAt = r.reward_vested_at ? new Date(r.reward_vested_at).getTime() : Infinity;
        if (vestedAt <= now) {
          vestedRewardCents += r.reward_amount_cents || 0;
        } else {
          pendingRewardCents += r.reward_amount_cents || 0;
        }
      }
    }

    const shareUrl = `${canonicalFrontend()}/?ref=${codeRow.code}`;

    // Latest 10 for the dashboard's "Recent referrals" table. Strip IPs.
    const recent = referrals.slice(0, 10).map((r) => ({
      id: r.id,
      status: r.status,
      referee_email: r.referee_email,
      reward_cents: r.reward_amount_cents || 0,
      created_at: r.created_at,
      paid_conversion_at: r.paid_conversion_at,
      vested_at: r.reward_vested_at,
      paid_at: r.reward_paid_at,
    }));

    return res.json({
      code: codeRow.code,
      tier: codeRow.tier,
      is_active: codeRow.is_active,
      share_url: shareUrl,
      stats: {
        signup_count: signupCount,
        paid_count: paidCount,
        confirmed_count: confirmedCount,
        pending_reward_cents: pendingRewardCents,
        vested_reward_cents: vestedRewardCents,
        paid_out_reward_cents: paidOutRewardCents,
      },
      recent_referrals: recent,
    });
  } catch (err) {
    console.error('getMyReferralInfo error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────
// POST /api/referral/track — unauthenticated. Called from the frontend
// when a visitor lands with ?ref=CODE (the cookie set client-side handles
// the 90-day window; this endpoint exists so we can validate the code
// server-side before the cookie is set, and log the click if desired).
const trackClick = async (req, res) => {
  try {
    const code = String(req.body?.code || '').toUpperCase().trim();
    if (!code) return res.status(400).json({ error: 'code is required' });

    const { data: row } = await supabase
      .from('referral_codes')
      .select('id, is_active')
      .eq('code', code)
      .maybeSingle();

    if (!row || !row.is_active) {
      return res.json({ valid: false });
    }

    // (Intentionally not creating a referrals row here — we do that at
    // signup, when we actually know the referee_email. Clicks-without-
    // signup get no persistent record, just a cookie on the visitor.)
    return res.json({ valid: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────
// POST /api/referral/payout — user requests a cash-out of their vested rewards.
const requestPayout = async (req, res) => {
  try {
    const userId = req.user.id;
    const { paypal_email } = req.body || {};
    if (!paypal_email || !/^\S+@\S+\.\S+$/.test(paypal_email)) {
      return res.status(400).json({ error: 'Valid paypal_email is required' });
    }

    // Find every confirmed referral with a reward and no prior payout row.
    const { data: confirmed } = await supabase
      .from('referrals')
      .select('id, reward_amount_cents')
      .eq('referrer_id', userId)
      .eq('status', 'confirmed');

    const total = (confirmed || []).reduce((n, r) => n + (r.reward_amount_cents || 0), 0);

    const MIN_PAYOUT_CENTS = 2000;
    if (total < MIN_PAYOUT_CENTS) {
      return res.status(400).json({
        error: `Minimum payout is $${MIN_PAYOUT_CENTS / 100}. You have $${(total / 100).toFixed(2)} vested.`,
      });
    }

    const { data: payout, error } = await supabase
      .from('referral_payouts')
      .insert({
        user_id: userId,
        amount_cents: total,
        status: 'pending',
        payout_method: 'paypal',
        paypal_email,
      })
      .select()
      .single();

    if (error) throw error;

    // Mark the referrals as paid_out OPTIMISTICALLY — if the manual
    // PayPal send fails later, admin flips referrals back to 'confirmed'
    // and the payout row to 'failed'.
    const ids = (confirmed || []).map((r) => r.id);
    if (ids.length > 0) {
      await supabase
        .from('referrals')
        .update({ status: 'paid_out', reward_paid_at: new Date().toISOString() })
        .in('id', ids);
    }

    return res.json({ payout });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = {
  ensureCodeForUser,
  attributeOnSignup,
  getMyReferralInfo,
  trackClick,
  requestPayout,
  // Helpers exported for testing / direct use
  generateCode,
};
