// Supabase admin client configuration
// Uses service role key for server-side operations with full access

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create Supabase admin client with service role privileges
// Server-side config: disable session persistence to ensure service role always bypasses RLS
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Resolve a user_id from an email address. Used as a fallback by the
// payment webhook handlers when the provider strips our custom_data
// (e.g. LS's "Want this for free?" simplified flow).
//
// Fast path: calls the find_user_id_by_email Postgres RPC, which queries
// auth.users on its indexed email column. O(log n), sub-millisecond even
// at millions of users. The function is SECURITY DEFINER and locked to
// service_role only (see backend/src/database/find-user-by-email-rpc.sql).
//
// Slow-path fallback: if the RPC isn't installed yet (returns 404 / "function
// not found"), page through auth.admin.listUsers up to 1000 users. Logs
// a one-time warning so the missing migration is visible.
//
// Email comparison is case-insensitive on both paths.
let warnedMissingRpc = false;
supabase.findUserIdByEmail = async (email) => {
  const normalized = (email || '').toLowerCase().trim();
  if (!normalized) return null;

  // Fast path
  try {
    const { data, error } = await supabase.rpc('find_user_id_by_email', { p_email: normalized });
    if (!error) {
      return data || null;
    }
    // PGRST202 = function not found in the schema cache (migration not run yet).
    // PGRST204 = function not in cache. Fall back silently but warn once.
    const fallbackCodes = new Set(['PGRST202', 'PGRST204', '42883', '404']);
    if (!fallbackCodes.has(String(error.code || ''))) {
      console.error('findUserIdByEmail RPC failed:', error.message, error.code, error.hint);
      return null;
    }
    if (!warnedMissingRpc) {
      console.warn(
        '[supabaseClient] find_user_id_by_email RPC not installed — ' +
        'using slow listUsers fallback. Run backend/src/database/find-user-by-email-rpc.sql.'
      );
      warnedMissingRpc = true;
    }
  } catch (err) {
    console.error('findUserIdByEmail RPC threw:', err.message);
    // continue to fallback
  }

  // Slow-path fallback
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 50 });
    if (error) {
      console.error('supabaseClient.findUserIdByEmail: listUsers failed:', error.message);
      return null;
    }
    const users = data?.users || [];
    const hit = users.find((u) => (u.email || '').toLowerCase() === normalized);
    if (hit) return hit.id;
    if (users.length < 50) return null; // last page
  }
  return null;
};

module.exports = supabase;
