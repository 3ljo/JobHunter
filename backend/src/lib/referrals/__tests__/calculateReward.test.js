// Tests for calculateReward. Uses Node's built-in test runner (no deps).
// Run: `node --test src/lib/referrals/__tests__/calculateReward.test.js`
//   or `node --test src/lib/referrals/**/*.test.js`
const { test } = require('node:test');
const assert = require('node:assert/strict');

const { calculateReward } = require('../calculateReward');

// ─── base schedule (standard tier) ──────────────────────────────
test('referral #1 at standard tier → $10, no milestone', () => {
  const r = calculateReward({ confirmedCountBefore: 0 });
  assert.equal(r.rewardCents, 1000);
  assert.equal(r.referralNumber, 1);
  assert.equal(r.multiplier, 1);
  assert.equal(r.grantAmbassador, false);
  assert.equal(r.grantLifetimePro, false);
});

test('referral #3 at standard tier → $20 (the first hump)', () => {
  const r = calculateReward({ confirmedCountBefore: 2 });
  assert.equal(r.rewardCents, 2000);
  assert.equal(r.referralNumber, 3);
});

test('referral #5 at standard tier → $25 AND grants ambassador', () => {
  const r = calculateReward({ confirmedCountBefore: 4 });
  assert.equal(r.rewardCents, 2500);
  assert.equal(r.multiplier, 1, 'tier grant does NOT self-apply');
  assert.equal(r.grantAmbassador, true);
  assert.equal(r.grantLifetimePro, false);
});

test('referral #10 at standard tier → $85 AND grants lifetime Pro', () => {
  const r = calculateReward({ confirmedCountBefore: 9 });
  assert.equal(r.rewardCents, 8500);
  assert.equal(r.grantLifetimePro, true);
  assert.equal(r.grantAmbassador, false);
});

test('referral #11+ falls back to default $10', () => {
  const r = calculateReward({ confirmedCountBefore: 10 });
  assert.equal(r.rewardCents, 1000);
  assert.equal(r.referralNumber, 11);
  assert.equal(r.grantAmbassador, false);
  assert.equal(r.grantLifetimePro, false);
});

test('cumulative totals match the spec (standard tier, 1..10)', () => {
  let total = 0;
  for (let i = 0; i < 10; i++) {
    total += calculateReward({ confirmedCountBefore: i }).rewardCents;
  }
  // Spec: cumulative at 10 = $200
  assert.equal(total, 20000, `expected $200 total, got $${(total / 100).toFixed(2)}`);
});

test('cumulative at 3 is exactly $40 (spec anchor)', () => {
  let total = 0;
  for (let i = 0; i < 3; i++) {
    total += calculateReward({ confirmedCountBefore: i }).rewardCents;
  }
  assert.equal(total, 4000);
});

test('cumulative at 5 is exactly $75 (spec anchor)', () => {
  let total = 0;
  for (let i = 0; i < 5; i++) {
    total += calculateReward({ confirmedCountBefore: i }).rewardCents;
  }
  assert.equal(total, 7500);
});

// ─── tier multiplier ─────────────────────────────────────────────
test('ambassador tier → 2× reward for every referral', () => {
  assert.equal(calculateReward({ confirmedCountBefore: 0, tier: 'ambassador' }).rewardCents, 2000);
  assert.equal(calculateReward({ confirmedCountBefore: 2, tier: 'ambassador' }).rewardCents, 4000);
  assert.equal(calculateReward({ confirmedCountBefore: 9, tier: 'ambassador' }).rewardCents, 17000);
});

test('founding_100 tier → 2× reward', () => {
  assert.equal(calculateReward({ confirmedCountBefore: 0, tier: 'founding_100' }).rewardCents, 2000);
  assert.equal(calculateReward({ confirmedCountBefore: 4, tier: 'founding_100' }).rewardCents, 5000);
});

test('unknown/empty tier does not multiply', () => {
  assert.equal(calculateReward({ confirmedCountBefore: 0, tier: undefined }).rewardCents, 1000);
  assert.equal(calculateReward({ confirmedCountBefore: 0, tier: 'standard' }).rewardCents, 1000);
  assert.equal(calculateReward({ confirmedCountBefore: 0, tier: 'made_up_tier' }).rewardCents, 1000);
});

// ─── edge cases around tier grants ───────────────────────────────
test('referral #5 for a founding_100 user → 2× AND grants ambassador', () => {
  // Already 2× from founding_100; ambassador grant is additive but does
  // not stack multipliers (both are in the MULTIPLIER_TIERS set).
  const r = calculateReward({ confirmedCountBefore: 4, tier: 'founding_100' });
  assert.equal(r.rewardCents, 5000, '$25 × 2 = $50');
  assert.equal(r.grantAmbassador, true);
});

test('referral #5 at ambassador tier is a no-op grant but still pays out', () => {
  // If they're already ambassador (e.g. promoted manually), we still
  // fire grantAmbassador=true. The webhook should be idempotent on the
  // tier write.
  const r = calculateReward({ confirmedCountBefore: 4, tier: 'ambassador' });
  assert.equal(r.rewardCents, 5000);
  assert.equal(r.grantAmbassador, true);
});

// ─── input validation ───────────────────────────────────────────
test('negative confirmedCountBefore throws', () => {
  assert.throws(() => calculateReward({ confirmedCountBefore: -1 }), TypeError);
});

test('non-integer confirmedCountBefore throws', () => {
  assert.throws(() => calculateReward({ confirmedCountBefore: 1.5 }), TypeError);
  assert.throws(() => calculateReward({ confirmedCountBefore: 'one' }), TypeError);
  assert.throws(() => calculateReward({ confirmedCountBefore: null }), TypeError);
});

test('missing args object throws on confirmedCountBefore check', () => {
  assert.throws(() => calculateReward(), TypeError);
});
