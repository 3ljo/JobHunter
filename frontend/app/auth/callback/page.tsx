'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { getMe, attributeReferral } from '@/lib/api';
import { getReferralCookie, clearReferralCookie, getDeviceFingerprint } from '@/lib/referralCookie';

type Status = 'loading' | 'verified' | 'error';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { setToken, setUser } = useAuthStore();
  const [status, setStatus] = useState<Status>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
    const params = new URLSearchParams(hash);

    const errorDescription = params.get('error_description');
    if (errorDescription) {
      setErrorMessage(errorDescription.replace(/\+/g, ' '));
      setStatus('error');
      return;
    }

    const type = params.get('type');
    const accessToken = params.get('access_token');

    // Recovery links may also land here if Supabase config only allows one
    // redirect URL — forward to the dedicated reset page with the hash intact.
    if (type === 'recovery') {
      router.replace(`/reset-password${window.location.hash}`);
      return;
    }

    // OAuth sign-in (e.g. Google) — Supabase returns a session in the hash with
    // no `type`. provider_token presence is the tell. Log the user straight in.
    if (accessToken && (params.get('provider_token') || !type)) {
      (async () => {
        setToken(accessToken);
        try {
          const res = await getMe();
          setUser(res.data.user);

          // OAuth signups bypass /api/auth/register entirely, so the
          // referral never gets attributed there. Do it here: if the
          // visitor has a `cv_ref` cookie, POST it to /api/referral/attribute
          // (idempotent on the backend — no-op if already attributed).
          const refCode = getReferralCookie();
          if (refCode) {
            try {
              await attributeReferral(refCode, getDeviceFingerprint());
              clearReferralCookie();
            } catch {
              // Attribution is best-effort — never block the login flow.
            }
          }

          router.replace('/cv');
        } catch {
          setErrorMessage('Could not complete sign-in. Try again.');
          setStatus('error');
        }
      })();
      return;
    }

    // Email-confirmation success (type=signup or type=email).
    if (accessToken) {
      setStatus('verified');
      window.history.replaceState(null, '', window.location.pathname);
      return;
    }

    setErrorMessage('This verification link is invalid or has expired.');
    setStatus('error');
  }, [router, setToken, setUser]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6" style={{ background: '#101435' }}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute rounded-full" style={{ width: 700, height: 700, top: '20%', left: '30%', background: 'radial-gradient(circle, rgba(118,77,240,0.20) 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute rounded-full" style={{ width: 400, height: 400, bottom: '10%', right: '20%', background: 'radial-gradient(circle, rgba(192,38,211,0.12) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      <div className="relative z-10 w-full max-w-sm text-center">
        <div className="mb-12 flex justify-center">
          <img src="/aivent/logo.png" alt="AIvent" style={{ height: '72px', width: 'auto' }} />
        </div>

        {status === 'loading' && (
          <>
            <div
              className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{ background: 'rgba(118,77,240,0.10)', border: '1px solid rgba(118,77,240,0.20)' }}
            >
              <Loader2 className="h-8 w-8 text-violet-400 animate-spin" />
            </div>
            <h2 className="text-white tracking-tight" style={{ fontSize: 'clamp(28px, 3vw, 36px)', fontWeight: 800 }}>
              Verifying...
            </h2>
          </>
        )}

        {status === 'verified' && (
          <>
            <div
              className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{ background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.20)' }}
            >
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
            <h2 className="text-white tracking-tight mb-3" style={{ fontSize: 'clamp(28px, 3vw, 36px)', fontWeight: 800 }}>
              Email verified
            </h2>
            <p className="text-white/50 text-sm mb-8" style={{ fontWeight: 400 }}>
              Your account is ready. Sign in to continue.
            </p>
            <Link href="/login" className="btn-aivent fx-slide" data-hover="SIGN IN" style={{ borderRadius: '12px' }}>
              <span>Sign in</span>
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div
              className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.20)' }}
            >
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
            <h2 className="text-white tracking-tight mb-3" style={{ fontSize: 'clamp(28px, 3vw, 36px)', fontWeight: 800 }}>
              Verification failed
            </h2>
            <p className="text-white/50 text-sm mb-8" style={{ fontWeight: 400 }}>
              {errorMessage}
            </p>
            <Link href="/register" className="btn-aivent btn-line fx-slide" data-hover="TRY AGAIN" style={{ borderRadius: '12px' }}>
              <span>Try again</span>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
