// Admin endpoints for the fraud-review queue. Already gated by the
// email-based requireAdmin middleware (routes/admin.js); an extra layer
// of defence-in-depth checks the shared ADMIN_PASSWORD via the
// X-Admin-Password header — this is the same password the /bosi/referrals
// UI prompts for on load.

const supabase = require('../services/supabaseClient');
const { logEvent } = require('../lib/events');

function requireAdminPassword(req, res, next) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return res.status(500).json({ error: 'ADMIN_PASSWORD not configured on server' });
  }
  const provided = req.headers['x-admin-password'];
  if (!provided || provided !== expected) {
    return res.status(401).json({ error: 'Bad admin password' });
  }
  next();
}

// GET /api/admin/referrals/flagged
// Returns every referral flagged as 'fraud' plus its referrer email + any
// signals useful for triage.
const listFlagged = async (req, res) => {
  try {
    const { data: rows, error } = await supabase
      .from('referrals')
      .select('id, referrer_id, referee_id, referee_email, referral_code, status, reward_amount_cents, created_at, ip_address_hash, device_fingerprint')
      .eq('status', 'fraud')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Enrich with referrer emails.
    const referrerIds = [...new Set((rows || []).map((r) => r.referrer_id))];
    let emailMap = {};
    if (referrerIds.length > 0) {
      try {
        const { data: auth } = await supabase.auth.admin.listUsers();
        (auth?.users || []).forEach((u) => {
          if (referrerIds.includes(u.id)) emailMap[u.id] = u.email;
        });
      } catch { /* best-effort */ }
    }

    const enriched = (rows || []).map((r) => ({
      ...r,
      referrer_email: emailMap[r.referrer_id] || 'unknown',
    }));

    return res.json({ flagged: enriched });
  } catch (err) {
    console.error('listFlagged failed:', err.message);
    return res.status(500).json({ error: err.message });
  }
};

// POST /api/admin/referrals/:id/approve
// Flips a 'fraud'-flagged referral back to 'signed_up'. If the referee
// has since converted to paid, the next webhook / cron run will move it
// forward naturally; we don't try to back-fill.
const approveFlagged = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('referrals')
      .update({ status: 'signed_up' })
      .eq('id', id)
      .eq('status', 'fraud');
    if (error) throw error;
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// POST /api/admin/referrals/:id/reject
// Permanently closes the referral — keeps status='fraud' but also makes
// sure reward is zeroed (belt-and-suspenders for a row that was flagged
// with a prior reward_amount_cents > 0).
const rejectFlagged = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('referrals')
      .update({ status: 'fraud', reward_amount_cents: 0 })
      .eq('id', id);
    if (error) throw error;
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// POST /api/admin/referrals/payouts/:id/mark-paid
// Admin confirms they've sent the PayPal payment manually. Moves the
// payout row to 'paid' and fires the payout_sent event.
const markPayoutSent = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: payout, error } = await supabase
      .from('referral_payouts')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', id)
      .select('user_id, amount_cents')
      .single();
    if (error) throw error;
    if (payout) {
      await logEvent('payout_sent', {
        userId: payout.user_id,
        metadata: { payout_id: id, amount_cents: payout.amount_cents },
      });
    }
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// GET /api/admin/referrals/payouts?status=pending
// Returns every payout in the given status (default: pending + approved —
// anything the admin hasn't finished yet). Enriched with the user's email
// and the referrer's tier so the admin can prioritise.
const listPayouts = async (req, res) => {
  try {
    const filterStatus = typeof req.query.status === 'string' ? req.query.status : null;
    const statuses = filterStatus ? [filterStatus] : ['pending', 'approved'];

    const { data: rows, error } = await supabase
      .from('referral_payouts')
      .select('id, user_id, amount_cents, status, payout_method, paypal_email, created_at, paid_at')
      .in('status', statuses)
      .order('created_at', { ascending: false });
    if (error) throw error;

    // Enrich with auth emails so the admin can recognise the user.
    const userIds = [...new Set((rows || []).map((r) => r.user_id))];
    const emailMap = {};
    if (userIds.length > 0) {
      try {
        const { data: auth } = await supabase.auth.admin.listUsers();
        (auth?.users || []).forEach((u) => {
          if (userIds.includes(u.id)) emailMap[u.id] = u.email;
        });
      } catch { /* best-effort */ }
    }

    const enriched = (rows || []).map((r) => ({
      ...r,
      user_email: emailMap[r.user_id] || 'unknown',
    }));

    return res.json({ payouts: enriched });
  } catch (err) {
    console.error('listPayouts failed:', err.message);
    return res.status(500).json({ error: err.message });
  }
};

// POST /api/admin/referrals/payouts/:id/reject
// Rolls a payout back — typical cause is the manual PayPal send failed
// (recipient email invalid, compliance block). Flips the payout row to
// 'rejected', then flips the user's paid_out referrals BACK to
// 'confirmed' so they show up on the dashboard again (and can be
// re-paid in a future payout). `reason` stored in the event log.
const rejectPayout = async (req, res) => {
  try {
    const { id } = req.params;
    const reason = typeof req.body?.reason === 'string' ? req.body.reason.slice(0, 500) : null;

    const { data: payout, error: selErr } = await supabase
      .from('referral_payouts')
      .select('id, user_id, amount_cents, status, created_at')
      .eq('id', id)
      .maybeSingle();
    if (selErr) throw selErr;
    if (!payout) return res.status(404).json({ error: 'Payout not found' });
    if (payout.status === 'paid') {
      return res.status(409).json({ error: 'Payout already marked paid — reverse via refund, not reject.' });
    }
    if (payout.status === 'rejected') {
      return res.status(409).json({ error: 'Payout already rejected' });
    }

    // Flip any referrals that were optimistically set to 'paid_out' around
    // the same time as this payout back to 'confirmed'. We can't link
    // precisely (no referral_ids on the payout row), so we use a time
    // window: referrals paid_out within 1 minute of the payout's created_at.
    const windowMs = 60 * 1000;
    const low = new Date(new Date(payout.created_at).getTime() - windowMs).toISOString();
    const high = new Date(new Date(payout.created_at).getTime() + windowMs).toISOString();

    const { error: revertErr } = await supabase
      .from('referrals')
      .update({ status: 'confirmed', reward_paid_at: null })
      .eq('referrer_id', payout.user_id)
      .eq('status', 'paid_out')
      .gte('reward_paid_at', low)
      .lte('reward_paid_at', high);
    if (revertErr) console.warn('rejectPayout: referral revert failed:', revertErr.message);

    const { error: updErr } = await supabase
      .from('referral_payouts')
      .update({ status: 'rejected' })
      .eq('id', id);
    if (updErr) throw updErr;

    await logEvent('payout_rejected', {
      userId: payout.user_id,
      metadata: { payout_id: id, amount_cents: payout.amount_cents, reason },
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error('rejectPayout failed:', err.message);
    return res.status(500).json({ error: err.message });
  }
};

// GET /api/admin/referrals/funnel
// Returns event counts over the last 30 days, grouped by event_name.
// Used by the admin UI's funnel panel. Simple aggregation query, no ORM.
const getFunnel = async (req, res) => {
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: rows, error } = await supabase
      .from('events')
      .select('event_name, created_at')
      .gte('created_at', since);
    if (error) throw error;

    // Manual group-by — Supabase's PostgREST can't do aggregation without
    // a view/RPC, and one in-memory count over 30 days of events is
    // trivial (low-volume app).
    const counts = new Map();
    for (const r of rows || []) {
      counts.set(r.event_name, (counts.get(r.event_name) || 0) + 1);
    }

    // Return in the canonical funnel order so the UI can render top-to-bottom.
    const ORDER = [
      'referral_clicked',
      'referral_signup',
      'referral_paid',
      'reward_vested',
      'payout_requested',
      'payout_sent',
      'gift_pass_purchased',
      'gift_pass_redeemed',
      'ats_share',
      'hire_share',
    ];
    const funnel = ORDER.map((name) => ({ event_name: name, count: counts.get(name) || 0 }));
    // Include any unknown-but-logged events at the bottom for visibility.
    for (const [name, count] of counts) {
      if (!ORDER.includes(name)) funnel.push({ event_name: name, count });
    }

    return res.json({ funnel, since });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = {
  requireAdminPassword,
  listFlagged,
  approveFlagged,
  rejectFlagged,
  listPayouts,
  markPayoutSent,
  rejectPayout,
  getFunnel,
};
