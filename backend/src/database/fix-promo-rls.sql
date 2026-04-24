-- Migration: fix promo_codes + promo_code_usage RLS
--
-- Symptom: admin POST /api/admin/promos returns 500 with
--   "new row violates row-level security policy for table promo_codes"
--
-- Root cause: both tables have RLS enabled with ONLY a SELECT policy.
-- On Supabase, the service role is normally configured to bypass RLS,
-- but this depends on the specific Postgres role that executes the
-- query. If the service-role key is missing/wrong on the app server,
-- OR if the table has FORCE ROW LEVEL SECURITY, the backend's INSERT
-- goes through the `authenticated`/`anon` role and RLS rejects it.
--
-- These tables have no per-user scoping (no user_id column on
-- promo_codes; promo_code_usage is backend-managed). There is no
-- legitimate reason to expose them to client-side writes — the UI
-- never writes them directly. Safest fix: open up SELECT/INSERT/
-- UPDATE/DELETE to the service role explicitly, and keep the
-- "anyone can SELECT active" policy that the public checkout page
-- needs for code validation.
--
-- Run in Supabase SQL Editor → Save → re-test admin promo create.

-- Service role bypass (belt-and-braces — works even if Postgres
-- isn't auto-bypassing for some reason).
DO $$
BEGIN
  -- promo_codes: full access for service_role
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'promo_codes' AND policyname = 'service_role full access'
  ) THEN
    CREATE POLICY "service_role full access" ON promo_codes
      FOR ALL TO service_role
      USING (true) WITH CHECK (true);
  END IF;

  -- promo_code_usage: full access for service_role
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'promo_code_usage' AND policyname = 'service_role full access'
  ) THEN
    CREATE POLICY "service_role full access" ON promo_code_usage
      FOR ALL TO service_role
      USING (true) WITH CHECK (true);
  END IF;
END $$;

-- If the above policy still gets bypassed by a FORCE flag, uncomment
-- these two lines to disable RLS entirely on these admin-only tables.
-- Safe because neither table is accessed directly from client JS.
-- ALTER TABLE promo_codes DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE promo_code_usage DISABLE ROW LEVEL SECURITY;
