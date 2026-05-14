-- Fast email → user_id lookup, called by the payment webhook handlers
-- when LS / PayPal strip our custom_data. Without this, the fallback
-- has to paginate through auth.admin.listUsers() which is O(n) over
-- all users and hits a ~50-user-per-page rate limit.
--
-- This function is SECURITY DEFINER so the service role (which already
-- has full access) can call it without needing to expose the auth
-- schema via PostgREST. Returns NULL if no user matches.
--
-- Email comparison is case-insensitive. auth.users.email is unique
-- and indexed, so this is O(log n) and stays sub-millisecond even at
-- millions of users.
--
-- Run via Supabase SQL Editor. Idempotent — safe to re-run.

CREATE OR REPLACE FUNCTION public.find_user_id_by_email(p_email TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  uid UUID;
BEGIN
  IF p_email IS NULL OR length(trim(p_email)) = 0 THEN
    RETURN NULL;
  END IF;
  SELECT id INTO uid
  FROM auth.users
  WHERE lower(email) = lower(trim(p_email))
  LIMIT 1;
  RETURN uid;
END;
$$;

-- Lock down: only the service role can execute. The function is in
-- public schema so PostgREST exposes it, but EXECUTE on anon/authenticated
-- is revoked. Without this, a logged-in user could probe for any email's
-- user_id, which is an enumeration leak.
REVOKE ALL ON FUNCTION public.find_user_id_by_email(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.find_user_id_by_email(TEXT) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.find_user_id_by_email(TEXT) TO service_role;
