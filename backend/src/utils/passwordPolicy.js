// Centralized password policy. Used by /register, /reset-password,
// and /change-password so the rules can't drift between endpoints.
//
//  - 8-char minimum.
//  - Reject HIBP-pwned passwords. Fails open on HIBP outage.
//  - 4096-byte upper bound to defend bcrypt-style cost-of-input
//    attacks on Supabase's hashing path.

const { pwnedCount } = require('../services/hibp');

const MIN_LENGTH = 8;
const MAX_LENGTH = 4096;

async function validatePassword(password) {
  if (typeof password !== 'string') {
    return { ok: false, error: 'Password is required' };
  }
  if (password.length < MIN_LENGTH) {
    return { ok: false, error: `Password must be at least ${MIN_LENGTH} characters` };
  }
  if (password.length > MAX_LENGTH) {
    return { ok: false, error: 'Password is too long' };
  }
  const count = await pwnedCount(password);
  if (count > 0) {
    return {
      ok: false,
      error: 'This password has appeared in known data breaches. Please choose a different one.',
    };
  }
  return { ok: true };
}

module.exports = { validatePassword, MIN_LENGTH, MAX_LENGTH };
