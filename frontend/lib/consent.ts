// Tiny client-side helper for the cookie/privacy consent flow.
//
// Writes a single localStorage entry that any analytics or marketing
// pixel can read before firing. Categories are deliberately
// fine-grained so we can ship Plausible (analytics) without needing
// the same opt-in as a Meta Pixel (marketing).

export type ConsentCategory = 'analytics' | 'marketing';
export type ConsentDecision = 'accepted' | 'rejected';

export interface ConsentState {
  decision: ConsentDecision;
  categories: Record<ConsentCategory, boolean>;
  decidedAt: number;
  // Bump on schema changes to force a re-prompt — e.g. when we
  // introduce a new tracking partner that wasn't in the original
  // banner. Increment in code; visitors are re-asked once.
  version: number;
}

export const CONSENT_STORAGE_KEY = 'cvc_consent_v1';
export const CONSENT_SCHEMA_VERSION = 1;

export function readConsent(): ConsentState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentState;
    if (parsed.version !== CONSENT_SCHEMA_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeConsent(state: Omit<ConsentState, 'decidedAt' | 'version'>): void {
  if (typeof window === 'undefined') return;
  try {
    const full: ConsentState = {
      ...state,
      decidedAt: Date.now(),
      version: CONSENT_SCHEMA_VERSION,
    };
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(full));
    window.dispatchEvent(new CustomEvent('cvc:consent-changed', { detail: full }));
  } catch {}
}

export function clearConsent(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(CONSENT_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('cvc:consent-changed', { detail: null }));
  } catch {}
}

export function hasConsent(category: ConsentCategory): boolean {
  const state = readConsent();
  return Boolean(state?.categories?.[category]);
}
