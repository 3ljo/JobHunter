'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Cookie, X } from 'lucide-react';
import { readConsent, writeConsent, type ConsentCategory } from '@/lib/consent';

// EU-strict consent banner. No tracking pixels fire until the
// visitor explicitly accepts — that's the GDPR/UK-GDPR bar. Splits
// into "analytics" (Plausible / GA) and "marketing" (Meta / TikTok
// pixels) so the visitor can opt into the former without the latter.

export default function CookieConsent() {
  const [open, setOpen] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    // Show only when we have no prior decision. Avoids a flash on
    // every page load for returning visitors.
    const existing = readConsent();
    if (!existing) {
      // Tiny delay so it doesn't punch in the moment the page loads.
      const t = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  const close = () => setOpen(false);

  const acceptAll = () => {
    writeConsent({
      decision: 'accepted',
      categories: { analytics: true, marketing: true },
    });
    close();
  };

  const rejectAll = () => {
    writeConsent({
      decision: 'rejected',
      categories: { analytics: false, marketing: false },
    });
    close();
  };

  const saveCustom = () => {
    const accepted = analytics || marketing;
    writeConsent({
      decision: accepted ? 'accepted' : 'rejected',
      categories: { analytics, marketing },
    });
    close();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[200] px-3 pb-3 sm:px-6 sm:pb-6"
      role="dialog"
      aria-live="polite"
      aria-labelledby="cookie-consent-title"
    >
      <div
        className="mx-auto max-w-3xl rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(13,17,48,0.96)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          border: '1px solid rgba(167,139,250,0.35)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)',
        }}
      >
        <div style={{ height: '2px', background: 'linear-gradient(90deg,transparent,rgba(118,77,240,0.9),transparent)' }} />

        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ background: 'rgba(118,77,240,0.18)', border: '1px solid rgba(118,77,240,0.35)' }}
            >
              <Cookie className="h-5 w-5" style={{ color: '#c4b5fd' }} />
            </div>
            <div className="min-w-0 flex-1">
              <h3
                id="cookie-consent-title"
                className="text-base font-bold tracking-tight"
                style={{ color: '#f5f3ff' }}
              >
                Cookies &amp; privacy
              </h3>
              <p className="mt-1 text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
                We use cookies for essential site features (always on) and, if you let us, to measure
                what's working and improve the product. You can change your mind anytime in our{' '}
                <Link href="/privacy" className="underline hover:text-white" style={{ color: '#c4b5fd' }}>
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
            <button
              type="button"
              onClick={rejectAll}
              aria-label="Reject all and close"
              className="flex h-7 w-7 items-center justify-center rounded-lg"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {showCustomize && (
            <div className="mt-4 space-y-2 rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <ConsentRow
                title="Strictly necessary"
                desc="Login session, CSRF protection, your preferences. Required."
                checked
                disabled
              />
              <ConsentRow
                title="Analytics"
                desc="Anonymous page views and feature usage so we can fix what's broken."
                checked={analytics}
                onChange={setAnalytics}
              />
              <ConsentRow
                title="Marketing"
                desc="Lets us measure ad performance on Meta / TikTok / Google."
                checked={marketing}
                onChange={setMarketing}
              />
            </div>
          )}

          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
            {!showCustomize && (
              <button
                type="button"
                onClick={() => setShowCustomize(true)}
                className="rounded-lg px-3 py-2 text-[12px] font-semibold"
                style={{ color: 'rgba(255,255,255,0.55)' }}
              >
                Customize
              </button>
            )}
            <button
              type="button"
              onClick={rejectAll}
              className="rounded-lg px-3 py-2 text-[12px] font-semibold"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.75)' }}
            >
              Reject non-essential
            </button>
            {showCustomize ? (
              <button
                type="button"
                onClick={saveCustom}
                className="rounded-lg px-4 py-2 text-[12px] font-bold"
                style={{
                  background: 'linear-gradient(135deg, rgba(118,77,240,0.4), rgba(91,33,182,0.4))',
                  border: '1px solid rgba(167,139,250,0.55)',
                  color: '#f5f3ff',
                  boxShadow: '0 6px 16px rgba(118,77,240,0.25)',
                }}
              >
                Save preferences
              </button>
            ) : (
              <button
                type="button"
                onClick={acceptAll}
                className="rounded-lg px-4 py-2 text-[12px] font-bold"
                style={{
                  background: 'linear-gradient(135deg, rgba(118,77,240,0.4), rgba(91,33,182,0.4))',
                  border: '1px solid rgba(167,139,250,0.55)',
                  color: '#f5f3ff',
                  boxShadow: '0 6px 16px rgba(118,77,240,0.25)',
                }}
              >
                Accept all
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ConsentRow({
  title, desc, checked, disabled, onChange,
}: {
  title: string;
  desc: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (next: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer select-none" style={{ cursor: disabled ? 'default' : 'pointer' }}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded accent-violet-500"
        style={{ accentColor: '#a78bfa' }}
      />
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-bold" style={{ color: '#f5f3ff' }}>{title}{disabled ? ' · always on' : ''}</p>
        <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.55)' }}>{desc}</p>
      </div>
    </label>
  );
}
