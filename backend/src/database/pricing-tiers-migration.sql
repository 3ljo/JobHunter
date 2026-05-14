-- PRICING TIERS MIGRATION (2026-04)
-- Expands the `subscriptions.plan` and `subscriptions.billing_interval` CHECK
-- constraints to allow the new 4-tier ladder:
--   free · starter (one-time 7-day pass) · pro · pro_voice
-- plus the legacy `pro_plus` alias (runtime maps it to pro_voice).
--
-- Safe to run multiple times — drops the constraints only if they exist, then
-- re-creates with the widened value set. No data is rewritten.
--
-- Run via: psql / Supabase SQL editor, or `node backend/src/database/runSchema.js`
-- (add this file to its list).

BEGIN;

-- Widen plan CHECK
ALTER TABLE subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_plan_check;

ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_plan_check
  CHECK (plan IN ('free', 'starter', 'pro', 'pro_voice', 'pro_plus'));

-- Widen billing_interval CHECK (adds `once` for the Starter pass)
ALTER TABLE subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_billing_interval_check;

ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_billing_interval_check
  CHECK (billing_interval IN ('month', 'year', 'once'));

COMMIT;
