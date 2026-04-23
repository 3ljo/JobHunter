// Referral-code cookie helpers. Set once when a visitor lands with
// ?ref=CODE; read at signup to attribute the referral server-side.
// 90-day TTL — matches the spec.

const COOKIE_NAME = 'cv_ref';
const MAX_AGE_DAYS = 90;

export function setReferralCookie(code: string): void {
  if (typeof document === 'undefined') return;
  const clean = (code || '').trim().toUpperCase();
  if (!clean) return;
  // SameSite=Lax so it survives the cross-redirect from LS checkout
  // back to the frontend; not httpOnly because we read it from JS.
  const maxAge = MAX_AGE_DAYS * 24 * 60 * 60;
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(clean)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function getReferralCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const parts = document.cookie.split(';').map((p) => p.trim());
  for (const p of parts) {
    if (p.startsWith(`${COOKIE_NAME}=`)) {
      const v = decodeURIComponent(p.slice(COOKIE_NAME.length + 1));
      return v || null;
    }
  }
  return null;
}

export function clearReferralCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
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
