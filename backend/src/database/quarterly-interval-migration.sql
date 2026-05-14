-- QUARTERLY INTERVAL MIGRATION (2026-05)
-- Adds 'quarter' to the subscriptions.billing_interval CHECK constraint so
-- Pro / Pro+ subscriptions can be billed every 3 months in addition to the
-- existing monthly and yearly cadences.
--
-- Safe to run multiple times — drops the constraint only if it exists, then
-- re-creates with the widened value set. No data is rewritten.
--
-- Run via: psql / Supabase SQL editor, or `node backend/src/database/runSchema.js`.

BEGIN;

ALTER TABLE subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_billing_interval_check;

ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_billing_interval_check
  CHECK (billing_interval IN ('month', 'quarter', 'year', 'once'));

COMMIT;
