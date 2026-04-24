// Referral-code cookie helpers. Set once when a visitor lands with
// ?ref=CODE; read at signup to attribute the referral server-side.
// 90-day TTL — matches the spec.
//
// The server-side middleware (frontend/middleware.ts) is the primary
// setter; these client helpers cover:
//   - SPA navigations that don't re-hit middleware
//   - Manual overrides from the register form
//   - Post-signup clear to prevent double-attribution

const COOKIE_NAME = 'cv_ref';
const MAX_AGE_DAYS = 90;
const CODE_RE = /^[A-Z0-9]{4,16}$/;

function cookieFlags(): string {
  const maxAge = MAX_AGE_DAYS * 24 * 60 * 60;
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
  return `path=/; max-age=${maxAge}; SameSite=Lax${secure}`;
}

export function setReferralCookie(code: string): void {
  if (typeof document === 'undefined') return;
  const clean = (code || '').trim().toUpperCase();
  if (!clean || !CODE_RE.test(clean)) return;
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(clean)}; ${cookieFlags()}`;
}

export function getReferralCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const parts = document.cookie.split(';').map((p) => p.trim());
  for (const p of parts) {
    if (p.startsWith(`${COOKIE_NAME}=`)) {
      const v = decodeURIComponent(p.slice(COOKIE_NAME.length + 1));
      const clean = v.trim().toUpperCase();
      return clean && CODE_RE.test(clean) ? clean : null;
    }
  }
  return null;
}

export function clearReferralCookie(): void {
  if (typeof document === 'undefined') return;
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax${secure}`;
}

// Cheap client-side fingerprint for fraud detection. Not a real
// fingerprint library — just enough signal that a casual attacker can't
// trivially swap browsers to double-claim. Nothing here is privacy-
// sensitive (UA string, screen dimensions, timezone offset).
export function getDeviceFingerprint(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const parts = [
      navigator.userAgent || '',
      navigator.language || '',
      new Date().getTimezoneOffset().toString(),
      `${window.screen?.width || 0}x${window.screen?.height || 0}`,
      window.screen?.colorDepth?.toString() || '',
    ];
    // Hash via a simple FNV-1a so the fingerprint is short and stable.
    let h = 0x811c9dc5;
    const joined = parts.join('|');
    for (let i = 0; i < joined.length; i++) {
      h ^= joined.charCodeAt(i);
      h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) | 0;
    }
    return (h >>> 0).toString(16);
  } catch {
    return null;
  }
}
