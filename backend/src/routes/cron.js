// Cron routes — hit by Render's Cron Jobs service on a schedule.
// Authenticated by a shared secret passed in the X-Cron-Key header
// (CRON_SECRET env var). No Supabase auth — this endpoint runs on
// behalf of the platform, not a user.

const express = require('express');
const router = express.Router();
const supabase = require('../services/supabaseClient');
const { flagSuspiciousReferrers } = require('../lib/referrals/fraudCheck');
const { logEvent } = require('../lib/events');

function requireCronSecret(req, res, next) {
  const expected = process.env.CRON_SECRET;
  const provided = req.headers['x-cron-key'];
  if (!expected) {
    return res.status(500).json({ error: 'CRON_SECRET not configured on server' });
  }
  if (!provided || provided !== expected) {
    return res.status(401).json({ error: 'Bad cron secret' });
  }
  next();
}

// POST /api/cron/approve-vested
// Daily at 00:00 UTC via Render Cron Jobs.
// 1) Auto-advances referrals from 'paid' → 'confirmed' once they pass
//    their 14-day vesting timestamp (and weren't refunded).
// 2) Runs the suspicious-referrer fraud heuristic.
router.post('/approve-vested', requireCronSecret, async (req, res) => {
  const nowIso = new Date().toISOString();
  try {
    // Advance vested referrals.
    const { data: vested, error: vestErr } = await supabase
      .from('referrals')
      .update({ status: 'confirmed' })
      .eq('status', 'paid')
      .lte('reward_vested_at', nowIso)
      .select('id, referrer_id, reward_amount_cents');

    if (vestErr) throw vestErr;

    // One event per row that vested today. Small N — cron runs once/day.
    for (const r of vested || []) {
      await logEvent('reward_vested', {
        userId: r.referrer_id,
        metadata: { referral_id: r.id, reward_cents: r.reward_amount_cents },
      });
    }

    const fraudResult = await flagSuspiciousReferrers();

    return res.json({
      ok: true,
      ran_at: nowIso,
      vested_confirmed: (vested || []).length,
      fraud_flagged: fraudResult.flagged,
      fraud_referrers: fraudResult.referrers,
    });
  } catch (err) {
    console.error('cron approve-vested failed:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
