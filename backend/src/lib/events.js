// Event logger. One function, never throws, fire-and-forget.
// Callers pass a canonical event name + optional user id + optional JSON
// metadata; we insert into `events` without blocking the request path.
//
// Known event names (the 10 points we instrument):
//   referral_clicked        — visitor hit /?ref=CODE (tracking endpoint)
//   referral_signup         — new user registered with a referral code
//   referral_paid           — referee converted to paid (webhook)
//   reward_vested           — referral advanced from 'paid' → 'confirmed' (cron)
//   payout_requested        — user hit POST /api/referral/payout
//   payout_sent             — admin confirmed PayPal send (manual, future)
//   gift_pass_purchased     — gifted_passes row inserted (webhook)
//   gift_pass_redeemed      — recipient activated their pass
//   ats_share               — user opened the ATS ≥90% share card
//   hire_share              — user opened the "I got hired" share card

const supabase = require('../services/supabaseClient');

const KNOWN_EVENTS = new Set([
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
]);

async function logEvent(eventName, { userId = null, metadata = {} } = {}) {
  if (!eventName) return;
  // Soft-validate: unknown names still log (for forward-compat) but get
  // flagged so we notice drift from the canonical set.
  if (!KNOWN_EVENTS.has(eventName)) {
    console.warn(`logEvent: unknown event_name "${eventName}" — logging anyway`);
  }
  try {
    await supabase.from('events').insert({
      user_id: userId,
      event_name: eventName,
      metadata,
    });
  } catch (err) {
    // Never propagate. Telemetry must not break the caller's flow.
    console.warn('logEvent insert failed:', err.message);
  }
}

module.exports = { logEvent, KNOWN_EVENTS };
