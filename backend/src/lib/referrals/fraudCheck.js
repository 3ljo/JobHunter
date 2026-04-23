// Referral fraud heuristic: flag any referrer who generated more than
// N new signups in the last 24 hours. Called from the daily cron.
// Safe + idempotent — only flips status from non-terminal states to 'fraud'.

const supabase = require('../../services/supabaseClient');

const WINDOW_HOURS = 24;
const THRESHOLD = 5; // signups per window before we flag

async function flagSuspiciousReferrers() {
  const since = new Date(Date.now() - WINDOW_HOURS * 60 * 60 * 1000).toISOString();

  // All referrals created in the last 24h that aren't already terminal.
  const { data: recent } = await supabase
    .from('referrals')
    .select('id, referrer_id, status, created_at')
    .gte('created_at', since)
    .in('status', ['signed_up', 'paid']);

  if (!recent || recent.length === 0) return { flagged: 0, referrers: 0 };

  // Group by referrer.
  const counts = new Map();
  for (const r of recent) {
    if (!counts.has(r.referrer_id)) counts.set(r.referrer_id, []);
    counts.get(r.referrer_id).push(r);
  }

  let flagged = 0;
  let referrers = 0;
  for (const [, rows] of counts) {
    if (rows.length <= THRESHOLD) continue;
    referrers++;
    // Flip EVERY one of their recent non-terminal referrals to 'fraud'.
    // Admin can unflag manually if it's a false positive.
    const ids = rows.map((r) => r.id);
    const { error } = await supabase
      .from('referrals')
      .update({
        status: 'fraud',
        reward_amount_cents: 0,
      })
      .in('id', ids);
    if (!error) flagged += ids.length;
  }

  return { flagged, referrers };
}

module.exports = { flagSuspiciousReferrers, WINDOW_HOURS, THRESHOLD };
