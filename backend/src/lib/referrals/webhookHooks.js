// Webhook-side referral mutations.
//
// onPaidConversion(userId): called from the LS webhook when a user first
//   becomes a paying subscriber OR completes a one-time order (Pass, Gift).
//   Finds the "signed_up" referral row for this user, calculates the
//   reward via calculateReward, flips it to "paid", sets vesting clock,
//   and grants milestone tiers on the referrer.
//
// onRefund(userId): called when a paid conversion refunds within the
//   14-day window. Flips the referral back to "refunded" and zeros the
//   reward.
//
// Both functions are idempotent — safe to call twice on the same user.

const supabase = require('../../services/supabaseClient');
const { calculateReward } = require('./calculateReward');

const VEST_DAYS = 14;

async function onPaidConversion(userId) {
  if (!userId) return;

  try {
    // Find this user's referral row (they're the referee). Only act on
    // rows that are still in an early status — idempotent.
    const { data: row } = await supabase
      .from('referrals')
      .select('id, referrer_id, status')
      .eq('referee_id', userId)
      .maybeSingle();

    if (!row) return;
    if (!['signed_up', 'clicked'].includes(row.status)) return;

    // Count the referrer's CONFIRMED referrals (not counting this one).
    const { data: confirmedRows } = await supabase
      .from('referrals')
      .select('id')
      .eq('referrer_id', row.referrer_id)
      .in('status', ['confirmed', 'paid_out']);
    const confirmedCountBefore = (confirmedRows || []).length;

    // Look up the referrer's current tier.
    const { data: refCode } = await supabase
      .from('referral_codes')
      .select('tier')
      .eq('user_id', row.referrer_id)
      .maybeSingle();
    const tier = refCode?.tier || 'standard';

    const reward = calculateReward({ confirmedCountBefore, tier });

    const now = new Date();
    const vestedAt = new Date(now.getTime() + VEST_DAYS * 24 * 60 * 60 * 1000);

    await supabase
      .from('referrals')
      .update({
        status: 'paid',
        reward_amount_cents: reward.rewardCents,
        paid_conversion_at: now.toISOString(),
        reward_vested_at: vestedAt.toISOString(),
      })
      .eq('id', row.id);

    // Grant milestone tiers on the referrer.
    if (reward.grantAmbassador && tier === 'standard') {
      await supabase
        .from('referral_codes')
        .update({ tier: 'ambassador' })
        .eq('user_id', row.referrer_id);
    }

    if (reward.grantLifetimePro) {
      // Grant lifetime Pro by writing a never-expiring subscription row.
      // Keeps existing subscription flow working — rate limiter just
      // reads the plan field, doesn't care how it was set.
      try {
        await supabase.from('subscriptions').upsert(
          {
            user_id: row.referrer_id,
            plan: 'pro',
            status: 'active',
            billing_interval: null,
            current_period_start: now.toISOString(),
            current_period_end: null, // null = doesn't expire
            cancel_at_period_end: false,
          },
          { onConflict: 'user_id' }
        );
      } catch (err) {
        console.warn('lifetime-pro grant write failed:', err.message);
      }
    }
  } catch (err) {
    console.warn('onPaidConversion failed:', err.message);
  }
}

async function onRefund(userId) {
  if (!userId) return;

  try {
    const { data: row } = await supabase
      .from('referrals')
      .select('id, status, reward_vested_at, paid_conversion_at')
      .eq('referee_id', userId)
      .maybeSingle();

    if (!row) return;
    // Only reverse while still inside the vesting window. After vesting,
    // the reward has already moved to 'confirmed' or been paid out.
    if (row.status !== 'paid') return;

    // Refunds *after* vesting are ignored here (we keep the reward). The
    // spec says "refund within 14 days" specifically.
    const paidAt = row.paid_conversion_at ? new Date(row.paid_conversion_at) : null;
    if (!paidAt) return;
    const daysSince = (Date.now() - paidAt.getTime()) / (24 * 60 * 60 * 1000);
    if (daysSince > VEST_DAYS) return;

    await supabase
      .from('referrals')
      .update({
        status: 'refunded',
        reward_amount_cents: 0,
        reward_vested_at: null,
      })
      .eq('id', row.id);
  } catch (err) {
    console.warn('onRefund failed:', err.message);
  }
}

module.exports = { onPaidConversion, onRefund, VEST_DAYS };
