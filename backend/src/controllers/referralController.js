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
const { logEvent } = require('../lib/events');

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
// Safe to call multiple times. Returns { row } on success, or { error }
// with the underlying Supabase error so callers can surface it instead
// of a generic "Could not generate" message.
async function ensureCodeForUser(userId) {
  if (!userId) return { error: new Error('missing userId') };

  const { data: existing, error: selectError } = await supabase
    .from('referral_codes')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (selectError) {
    console.warn('referral_codes select failed:', selectError.message, selectError.code);
    return { error: selectError };
  }
  if (existing) return { row: existing };

  // Collision retry — DB enforces UNIQUE(code) so we just retry on 23505.
  let lastError = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();
    const { data, error } = await supabase
      .from('referral_codes')
      .insert({ user_id: userId, code, tier: 'standard' })
      .select()
      .single();
    if (!error) return { row: data };
    lastError = error;
    console.warn('referral_codes insert failed:', error.message, error.code, error.details, error.hint);
    if (error.code !== '23505') return { error };
  }
  return { error: lastError || new Error('5 code collisions in a row') };
}

// Self-referral check. Returns true if this (referrer, email, ip_hash)
// combo looks like someone trying to refer themselves.
//
//   - referee's email shares a local-part-before-plus with the referrer
//   - OR the IP hash matches a RECENT referral from this same referrer
//     (24h window — avoids false positives for legitimate referrals
//     from shared networks: dorms, offices, households on the same NAT).
const IP_FRAUD_WINDOW_MS = 24 * 60 * 60 * 1000;

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

  // Same device (IP hash) as a prior referral from this same referrer
  // WITHIN THE LAST 24h? Previously this matched forever, which wrongly
  // flagged legitimate referrals from households/offices behind a shared
  // NAT. The fraudCheck cron still catches long-running abuse patterns.
  if (refereeIpHash) {
    const since = new Date(Date.now() - IP_FRAUD_WINDOW_MS).toISOString();
    const { data: sameIp } = await supabase
      .from('referrals')
      .select('id')
      .eq('referrer_id', referrerId)
      .eq('ip_address_hash', refereeIpHash)
      .gte('created_at', since)
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
  if (!refCode || !newUserId || !newUserEmail) {
    return { ok: false, stage: 'args' };
  }

  try {
    const normalizedCode = String(refCode).toUpperCase().trim();

    const { data: codeRow, error: codeLookupErr } = await supabase
      .from('referral_codes')
      .select('user_id, code, is_active')
      .eq('code', normalizedCode)
      .maybeSingle();

    if (codeLookupErr) {
      return { ok: false, stage: 'code_lookup', msg: codeLookupErr.message, code: codeLookupErr.code };
    }
    if (!codeRow) return { ok: false, stage: 'code_not_found', msg: normalizedCode };
    if (!codeRow.is_active) return { ok: false, stage: 'code_inactive', msg: normalizedCode };
    if (codeRow.user_id === newUserId) return { ok: false, stage: 'trivial_self_ref' };

    // Self-ref check is defensive; a transient failure here must NOT
    // abort the whole attribution. Worst case we skip the flag and let
    // the nightly `flagSuspiciousReferrers` cron catch it later.
    let isSelfRef = false;
    try {
      isSelfRef = await looksLikeSelfReferral({
        referrerId: codeRow.user_id,
        refereeEmail: newUserEmail,
        refereeIpHash: ipHash,
      });
    } catch (e) {
      console.warn('looksLikeSelfReferral threw — proceeding as not-fraud:', e.message);
    }

    const status = isSelfRef ? 'fraud' : 'signed_up';

    // Plain INSERT — the unique index on (referrer_id, referee_email)
    // enforces idempotency at the DB level. We swallow the 23505
    // unique-violation so duplicate signups are a silent no-op
    // instead of a 500. Switched away from upsert because PostgREST's
    // on_conflict handling doesn't match unique indexes cleanly across
    // all Supabase versions (error 42P10).
    const { error: insertErr } = await supabase.from('referrals').insert({
      referrer_id: codeRow.user_id,
      referee_id: newUserId,
      referee_email: newUserEmail.toLowerCase(),
      referral_code: codeRow.code,
      status,
      ip_address_hash: ipHash || null,
      device_fingerprint: fingerprint || null,
    });

    if (insertErr && insertErr.code !== '23505') {
      return {
        ok: false, stage: 'insert',
        msg: insertErr.message, code: insertErr.code,
        details: insertErr.details, hint: insertErr.hint,
      };
    }
    if (insertErr && insertErr.code === '23505') {
      // Already attributed — not an error, just idempotent.
      return { ok: true, status: 'already_attributed', referrer_id: codeRow.user_id };
    }

    await logEvent('referral_signup', {
      userId: newUserId,
      metadata: { referrer_id: codeRow.user_id, referral_code: codeRow.code, status },
    });
    return { ok: true, status, referrer_id: codeRow.user_id };
  } catch (err) {
    return { ok: false, stage: 'threw', msg: err.message };
  }
}

// On-demand promoter: flips any of this user's 'paid' referrals whose
// 14-day vesting clock has expired over to 'confirmed'. Called right
// before any read or payout action that depends on the 'confirmed'
// status, so the UI and payout endpoint never disagree because of a
// cron-job lag. The nightly cron (/api/cron/approve-vested) still runs
// as a safety net.
async function promoteVestedReferrals(referrerId) {
  if (!referrerId) return 0;
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from('referrals')
    .update({ status: 'confirmed' })
    .eq('referrer_id', referrerId)
    .eq('status', 'paid')
    .lte('reward_vested_at', nowIso)
    .select('id');
  if (error) {
    console.warn('promoteVestedReferrals failed:', error.message);
    return 0;
  }
  return (data || []).length;
}

// ─────────────────────────────────────────
// GET /api/referral/me — everything the user's dashboard needs.
const getMyReferralInfo = async (req, res) => {
  try {
    const userId = req.user.id;

    const { row: codeRow, error: codeError } = await ensureCodeForUser(userId);
    if (!codeRow) {
      const detail = codeError?.message || 'unknown';
      return res.status(500).json({
        error: `Could not generate a referral code for this user: ${detail}`,
      });
    }

    // Flip any due-for-vesting rows before we compute stats so the UI
    // and payout endpoint see consistent state.
    await promoteVestedReferrals(userId);

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

    // Share link points at /register so the referred visitor lands
    // directly on the signup form with the code pre-filled (the register
    // page reads ?ref= on mount). The middleware.ts cookie capture still
    // runs, so /?ref=CODE and other entry points remain fully supported
    // for people who share the bare domain link — this is just the
    // canonical share URL we hand back to the referrer.
    const shareUrl = `${canonicalFrontend()}/register?ref=${codeRow.code}`;

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

    await logEvent('referral_clicked', { metadata: { code } });

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

    // Idempotency: block concurrent or repeated payout requests while one
    // is already pending. Without this, a double-click on "Request payout"
    // creates two payout rows with overlapping referral IDs, and the
    // optimistic paid_out flip below races — worst case the user ends up
    // with two pending payouts for the same $20. We check pending+approved
    // because approved-but-not-yet-sent is the same "locked" state.
    const { data: openPayouts, error: openPayoutsErr } = await supabase
      .from('referral_payouts')
      .select('id, status, amount_cents')
      .eq('user_id', userId)
      .in('status', ['pending', 'approved'])
      .limit(1);
    if (openPayoutsErr) throw openPayoutsErr;
    if (openPayouts && openPayouts.length > 0) {
      return res.status(409).json({
        error: 'You already have a payout in progress. Please wait for it to complete before requesting another.',
        code: 'payout_in_progress',
        pending_payout_id: openPayouts[0].id,
      });
    }

    // Promote vested rows first — otherwise a user whose reward vested
    // after the nightly cron ran would see "vested" on the dashboard
    // (the UI computes vesting in real time) but get a $0 balance here.
    await promoteVestedReferrals(userId);

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

    const ids = (confirmed || []).map((r) => r.id);

    // Flip referrals → paid_out FIRST so a racing second request sees
    // zero 'confirmed' rows (and hits the min-payout check). Only then
    // create the payout row. If this 2nd step fails, admin can recover
    // by reading the event log; the referrals row has reward_paid_at
    // so the money isn't double-spent.
    if (ids.length > 0) {
      const { error: updErr } = await supabase
        .from('referrals')
        .update({ status: 'paid_out', reward_paid_at: new Date().toISOString() })
        .in('id', ids)
        .eq('status', 'confirmed'); // conditional update — only flip rows still confirmed
      if (updErr) throw updErr;
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

    await logEvent('payout_requested', {
      userId,
      metadata: { amount_cents: total, payout_id: payout.id, referral_count: ids.length },
    });

    return res.json({ payout });
  } catch (err) {
    console.error('requestPayout error:', err.message);
    return res.status(500).json({ error: 'Could not process payout request' });
  }
};

// ─────────────────────────────────────────
// POST /api/referral/attribute — authenticated. Called from the frontend
// AFTER a signup/login flow that couldn't pass the referral code via
// /api/auth/register (notably Google OAuth, which creates the Supabase
// user outside our backend entirely). Idempotent: no-op if this user
// already has a referrals row. Attribution only succeeds if the account
// was created in the last 24h, so a long-time user can't retroactively
// "claim" to have been referred.
const POSTSIGNUP_WINDOW_MS = 24 * 60 * 60 * 1000;

const attributePostSignup = async (req, res) => {
  try {
    const userId = req.user.id;
    const { ref_code, device_fingerprint } = req.body || {};

    if (typeof ref_code !== 'string' || !ref_code.trim()) {
      return res.status(400).json({ ok: false, stage: 'bad_ref_code' });
    }

    // Already attributed? Cheap no-op.
    const { data: existing } = await supabase
      .from('referrals')
      .select('id, status')
      .eq('referee_id', userId)
      .maybeSingle();
    if (existing) {
      return res.json({ ok: true, stage: 'already_attributed', status: existing.status });
    }

    // Only allow fresh accounts to be attributed — stops a user who's
    // been around for months from suddenly "remembering" a referral.
    const createdAt = req.user.created_at ? new Date(req.user.created_at).getTime() : 0;
    if (!createdAt || Date.now() - createdAt > POSTSIGNUP_WINDOW_MS) {
      return res.status(403).json({ ok: false, stage: 'account_too_old' });
    }

    // Ensure this user has their own code row too (usually a no-op — they
    // get one on first /api/referral/me, but OAuth users might hit
    // /attribute before /me).
    await ensureCodeForUser(userId);

    const ipHash = hashIp(getClientIp(req));
    const result = await attributeOnSignup({
      refCode: ref_code,
      newUserId: userId,
      newUserEmail: req.user.email,
      ipHash,
      fingerprint: typeof device_fingerprint === 'string' ? device_fingerprint : null,
    });

    if (!result.ok) {
      return res.status(400).json(result);
    }
    return res.json(result);
  } catch (err) {
    console.error('attributePostSignup error:', err.message);
    return res.status(500).json({ ok: false, stage: 'threw', msg: err.message });
  }
};

module.exports = {
  ensureCodeForUser,
  attributeOnSignup,
  getMyReferralInfo,
  trackClick,
  requestPayout,
  attributePostSignup,
  // Helpers exported for testing / direct use
  generateCode,
  promoteVestedReferrals,
};
