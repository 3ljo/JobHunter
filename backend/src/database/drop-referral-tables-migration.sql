-- DROP LEGACY REFERRAL TABLES (2026-04)
-- Removes the old referral system tables. The new "Hired & Help" referral
-- program replaces this with a fundamentally different schema
-- (referral_payouts, gifted_passes, status enum, etc.) and will be added in
-- a separate migration.
--
-- Promo codes are UNTOUCHED — they're a separate feature and stay.
--
-- Safe to run even if tables don't exist (IF EXISTS). CASCADE drops any
-- dependent constraints / RLS policies.

BEGIN;

DROP TABLE IF EXISTS referrals CASCADE;
DROP TABLE IF EXISTS referral_codes CASCADE;

-- Clean up any legacy RPC the old system may have installed.
DROP FUNCTION IF EXISTS increment_referral_count(code_text TEXT);

COMMIT;
