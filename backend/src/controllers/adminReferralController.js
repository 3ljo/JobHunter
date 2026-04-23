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
  markPayoutSent,
  getFunnel,
};
