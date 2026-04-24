// Admin endpoints for the fraud-review queue. Already gated by the
// email-based requireAdmin middleware (routes/admin.js); an extra layer
// of defence-in-depth checks the shared ADMIN_PASSWORD via the
// X-Admin-Password header — this is the same password the /bosi/referrals
// UI prompts for on load.

const supabase = require('../services/supabaseClient');
const paypal = require('../services/paypalService');
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
// Manual "I already sent it via PayPal in another tab" acknowledgement.
// Flips the payout row to 'paid' without calling any external API. Use
// sendPayoutViaPaypal below when you want the backend to actually fire
// the PayPal Payouts API for you.
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
        metadata: { payout_id: id, amount_cents: payout.amount_cents, method: 'manual' },
      });
    }
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// POST /api/admin/referrals/payouts/:id/send-via-paypal
// Actually fires the PayPal Payouts API using PAYPAL_CLIENT_ID /
// PAYPAL_CLIENT_SECRET / PAYPAL_MODE. Idempotent via the payout row's
// UUID as sender_batch_id — replaying a request for the same payout id
// either succeeds (first call) or PayPal returns DUPLICATE_REQUEST_ID
// which we surface as 409 without flipping state twice.
//
// State flow:
//   pending/approved → processing (set before the API call so a racing
//                                   double-click sees 'processing' and bails)
//   processing → paid (success)
//   processing → failed (PayPal 4xx/5xx; paypal_error stores the body)
const sendPayoutViaPaypal = async (req, res) => {
  const { id } = req.params;

  try {
    // Load the row and verify it's in a sendable state.
    const { data: payout, error: selErr } = await supabase
      .from('referral_payouts')
      .select('id, user_id, amount_cents, status, paypal_email, paypal_batch_id')
      .eq('id', id)
      .maybeSingle();
    if (selErr) throw selErr;
    if (!payout) return res.status(404).json({ error: 'Payout not found' });
    if (!payout.paypal_email) return res.status(400).json({ error: 'Payout row has no PayPal email on file' });
    if (payout.status === 'paid') {
      return res.status(409).json({ error: 'Payout already marked paid', code: 'already_paid' });
    }
    if (payout.status === 'rejected') {
      return res.status(409).json({ error: 'Payout was rejected — cannot send', code: 'already_rejected' });
    }
    if (payout.status === 'processing' && payout.paypal_batch_id) {
      return res.status(409).json({
        error: 'Already in flight with PayPal. Use the sync button to check status.',
        code: 'already_processing',
        batch_id: payout.paypal_batch_id,
      });
    }

    // Lock the row to 'processing' BEFORE we call PayPal so a racing
    // second click sees processing and exits above.
    const { error: lockErr } = await supabase
      .from('referral_payouts')
      .update({ status: 'processing' })
      .eq('id', id)
      .in('status', ['pending', 'approved']); // only if still in a sendable state
    if (lockErr) throw lockErr;

    let result;
    try {
      result = await paypal.createPayout({
        email: payout.paypal_email,
        amountCents: payout.amount_cents,
        senderBatchId: payout.id, // UUID = stable idempotency key
        recipientNote: 'Thanks for sharing CvClimber!',
      });
    } catch (ppErr) {
      // Flip to failed and stash the error body so admin can see what
      // went wrong in the UI (invalid recipient, insufficient funds, etc).
      console.error(`PayPal payout API error for payout ${id}:`, ppErr.message, ppErr.ppBody);
      await supabase
        .from('referral_payouts')
        .update({
          status: 'failed',
          paypal_error: ppErr.ppBody || { message: ppErr.message },
          paypal_mode: paypal._mode(),
        })
        .eq('id', id);
      return res.status(502).json({
        error: 'PayPal rejected the payout.',
        code: ppErr.ppHint || 'paypal_error',
        paypal_status: ppErr.ppStatus || 0,
      });
    }

    // Save the batch id so the reconciliation job can check status later.
    // We mark status='paid' only if PayPal accepted the batch (SUCCESS/PENDING
    // both mean the send is in motion). 'DENIED' means PayPal refused to
    // even queue it — revert to failed.
    const batchStatus = (result.batchStatus || '').toUpperCase();
    const accepted = batchStatus === 'SUCCESS' || batchStatus === 'PENDING' || batchStatus === 'PROCESSING';
    const finalStatus = accepted ? 'paid' : 'failed';

    const { error: updErr } = await supabase
      .from('referral_payouts')
      .update({
        status: finalStatus,
        paid_at: finalStatus === 'paid' ? new Date().toISOString() : null,
        paypal_batch_id: result.batchId,
        paypal_item_id: result.itemId,
        paypal_mode: paypal._mode(),
        paypal_error: accepted ? null : result.raw,
      })
      .eq('id', id);
    if (updErr) throw updErr;

    await logEvent('payout_sent', {
      userId: payout.user_id,
      metadata: {
        payout_id: id,
        amount_cents: payout.amount_cents,
        method: 'paypal_api',
        mode: paypal._mode(),
        batch_id: result.batchId,
        batch_status: batchStatus,
      },
    });

    return res.json({
      ok: accepted,
      status: finalStatus,
      batch_id: result.batchId,
      batch_status: batchStatus,
      mode: paypal._mode(),
    });
  } catch (err) {
    console.error('sendPayoutViaPaypal error:', err.message);
    return res.status(500).json({ error: 'Could not send payout' });
  }
};

// GET /api/admin/referrals/paypal/config-check
// Shape-only diagnostic for the admin UI. Returns whether credentials
// are set + a live OAuth round-trip to confirm they actually work.
// Never returns the secret values.
const paypalConfigCheck = async (req, res) => {
  try {
    const config = paypal.inspectConfig();
    const ping = await paypal.pingApi();
    return res.json({
      config,
      ping,
      overall_ok: config.client_id_present && config.client_secret_present && ping.ok,
    });
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
  sendPayoutViaPaypal,
  rejectPayout,
  paypalConfigCheck,
  getFunnel,
};
