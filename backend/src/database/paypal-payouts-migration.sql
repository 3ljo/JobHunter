-- Migration: PayPal Payouts API integration on referral_payouts
--
-- 1. Expand the status CHECK to include 'rejected' (used by admin
--    rejectPayout) and 'processing' (in-flight with PayPal but not
--    confirmed paid yet).
-- 2. Add columns to track the PayPal Payouts API response so we can
--    reconcile later:
--      - paypal_batch_id     — top-level batch ID returned by POST /payouts
--      - paypal_item_id      — per-recipient payout_item_id (for status queries)
--      - paypal_transaction_id — once PayPal confirms the send
--      - paypal_mode         — 'sandbox' or 'live' at send time (audit trail
--                              so a reconciliation can't be fooled if the
--                              app flips mode between send and verify)
--      - paypal_error        — JSON blob of whatever PayPal returned if the
--                              call 4xx'd or the batch errored
-- Safe to re-run.

BEGIN;

-- Drop the old CHECK and recreate with the wider set.
ALTER TABLE referral_payouts DROP CONSTRAINT IF EXISTS referral_payouts_status_check;
ALTER TABLE referral_payouts
  ADD CONSTRAINT referral_payouts_status_check
  CHECK (status IN ('pending','approved','processing','paid','failed','rejected'));

ALTER TABLE referral_payouts
  ADD COLUMN IF NOT EXISTS paypal_batch_id TEXT,
  ADD COLUMN IF NOT EXISTS paypal_item_id TEXT,
  ADD COLUMN IF NOT EXISTS paypal_transaction_id TEXT,
  ADD COLUMN IF NOT EXISTS paypal_mode TEXT CHECK (paypal_mode IN ('sandbox','live')),
  ADD COLUMN IF NOT EXISTS paypal_error JSONB;

-- Quick lookup by batch id for the reconciliation cron / webhook.
CREATE INDEX IF NOT EXISTS idx_referral_payouts_paypal_batch ON referral_payouts(paypal_batch_id);

COMMIT;
