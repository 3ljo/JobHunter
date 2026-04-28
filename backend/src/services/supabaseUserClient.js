// Per-request Supabase client scoped to the calling user's JWT.
//
// The default `supabaseClient` uses the service role key, which
// bypasses every Row Level Security policy. That's necessary for a
// few admin operations (deleting a user, rotating a password from
// /reset-password, listing all users in /admin) but it's a giant
// blast radius if any other endpoint is ever tricked into running
// queries with attacker-controlled input.
//
// For non-admin endpoints, prefer this client: it forwards the
// caller's bearer token to Supabase, so RLS applies on every query.
// If the user can't see a row under RLS, neither can our backend.
//
// Use the SUPABASE_ANON_KEY (or a publishable key) here — never the
// service role.

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  console.warn(
    '[supabaseUserClient] No SUPABASE_ANON_KEY set — per-request user-scoped client will fall back to service role. RLS will NOT apply.'
  );
}

function createUserClient(accessToken) {
  if (!accessToken) {
    throw new Error('createUserClient requires an access token');
  }
  // If anon key isn't configured, fall back to service role with the
  // user JWT in the auth header. Supabase will still resolve
  // auth.uid() correctly from the JWT, so RLS *can* apply if it's
  // enabled — but service role can also override RLS, so this is a
  // weaker default. Configure SUPABASE_ANON_KEY to fix.
  const key = supabaseAnonKey || process.env.SUPABASE_SERVICE_ROLE_KEY;
  return createClient(supabaseUrl, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  });
}

module.exports = { createUserClient };
