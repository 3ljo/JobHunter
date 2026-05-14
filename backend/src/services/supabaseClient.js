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

// Resolve a user_id from an email address by paging through auth.users.
// Used as a fallback by the payment webhook handlers when the provider
// strips our custom_data (e.g. LS's "Want this for free?" simplified flow).
//
// Paginates up to ~1000 users (20 pages × 50). Returns null if not found.
// Email comparison is case-insensitive — Supabase stores emails as-typed
// but auth treats them as case-insensitive, so we normalize too.
supabase.findUserIdByEmail = async (email) => {
  const normalized = (email || '').toLowerCase().trim();
  if (!normalized) return null;
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
