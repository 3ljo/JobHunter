// Read the CSRF token from the readable `csrf_token` cookie.
//
// The backend sets two cookies on /login: an httpOnly `auth_token`
// (the actual session) and a non-httpOnly `csrf_token` we can read
// from JS. We echo the latter as `X-CSRF-Token` on every state-
// changing request — backend rejects the request if header and
// cookie don't match (double-submit cookie pattern).

export function readCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.split('; ').find((c) => c.startsWith('csrf_token='));
  if (!match) return null;
  return decodeURIComponent(match.split('=')[1]);
}
