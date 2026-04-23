// Progressive reward calculator for the Hired & Help referral program.
//
// Rewards scale with cumulative *confirmed* referrals (referrals that have
// converted to paid AND survived their 14-day no-refund window). Tier
// multipliers apply on top of the base amount.
//
// Base schedule (cumulative totals in parentheses):
//   #1 → $10  ($10)
//   #2 → $10  ($20)
//   #3 → $20  ($40)   ← hump
//   #4 → $10  ($50)
//   #5 → $25  ($75)   ← grants 'ambassador' tier
//   #6 → $10  ($85)
//   #7 → $10  ($95)
//   #8 → $10  ($105)
//   #9 → $10  ($115)
//   #10 → $85 ($200)  ← grants lifetime Pro
//   #11+ → $10 each (no further milestones specified)
//
// Tier multiplier: ambassador or founding_100 → 2×. Applied AFTER the
// base amount for the referral in question. Example: a user already
// holding founding_100 earns #1 = $20, #2 = $20, #3 = $40, …
//
// Tier *grants* from milestones (ambassador at #5, lifetimePro at #10)
// are returned to the caller so the webhook can write them on the user
// row. They are NOT self-multiplying: the referral that grants
// ambassador uses the PRE-ambassador multiplier for its own reward.

const BASE_SCHEDULE_CENTS = {
  1: 1000,
  2: 1000,
  3: 2000,
  4: 1000,
  5: 2500,
  6: 1000,
  7: 1000,
  8: 1000,
  9: 1000,
  10: 8500,
};
const DEFAULT_CENTS = 1000; // #11+ until the product ships new milestones

const MULTIPLIER_TIERS = new Set(['ambassador', 'founding_100']);

/**
 * @param {Object} args
 * @param {number} args.confirmedCountBefore
 *   Count of confirmed (paid & vested & not-refunded) referrals this user
 *   had BEFORE the current one. The current referral becomes #(count+1).
 * @param {'standard'|'ambassador'|'founding_100'} [args.tier='standard']
 *   The referrer's tier at the moment of calculation. Milestone grants
 *   happen AFTER the current reward is computed, so they don't affect
 *   the reward for the triggering referral.
 * @returns {{
 *   rewardCents: number,
 *   multiplier: 1 | 2,
 *   referralNumber: number,
 *   grantAmbassador: boolean,
 *   grantLifetimePro: boolean,
 * }}
 */
function calculateReward({ confirmedCountBefore, tier = 'standard' } = {}) {
  if (!Number.isInteger(confirmedCountBefore) || confirmedCountBefore < 0) {
    throw new TypeError('confirmedCountBefore must be a non-negative integer');
  }
  const referralNumber = confirmedCountBefore + 1;
  const base = BASE_SCHEDULE_CENTS[referralNumber] ?? DEFAULT_CENTS;
  const multiplier = MULTIPLIER_TIERS.has(tier) ? 2 : 1;
  const rewardCents = base * multiplier;

  // Milestones grant NEW tiers — effective on the NEXT referral.
  const grantAmbassador = referralNumber === 5;
  const grantLifetimePro = referralNumber === 10;

  return { rewardCents, multiplier, referralNumber, grantAmbassador, grantLifetimePro };
}

module.exports = { calculateReward, BASE_SCHEDULE_CENTS, MULTIPLIER_TIERS };
