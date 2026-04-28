// Decode a Supabase JWT *without* verifying the signature.
//
// Supabase already verifies the signature when we call
// supabase.auth.getUser(token), so this is only used to inspect
// claims (aal, amr, role, exp) AFTER getUser() succeeds. Never
// trust these claims on a token that hasn't been verified.

function decodeUnsafe(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    const json = Buffer.from(padded, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// True if the token's `amr` (Authentication Methods References) claim
// indicates a recovery flow. Supabase issues recovery sessions when a
// password-reset email link is clicked. amr looks like
// [{"method":"recovery","timestamp":...}].
function isRecoveryToken(token) {
  const claims = decodeUnsafe(token);
  if (!claims || !Array.isArray(claims.amr)) return false;
  return claims.amr.some((entry) => entry && entry.method === 'recovery');
}

// Assurance level — Supabase issues `aal2` once the user has cleared
// an MFA challenge. Use to gate sensitive endpoints (delete account,
// change password, etc.) when MFA is enrolled.
function getAal(token) {
  const claims = decodeUnsafe(token);
  return claims && typeof claims.aal === 'string' ? claims.aal : 'aal1';
}

module.exports = { decodeUnsafe, isRecoveryToken, getAal };
