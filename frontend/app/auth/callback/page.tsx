'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

type Status = 'loading' | 'verified' | 'error';

export default function AuthCallbackPage() {
  const router = useRouter();
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

    // Recovery links may also land here if Supabase config only allows one
    // redirect URL — forward to the dedicated reset page with the hash intact.
    if (type === 'recovery') {
      router.replace(`/reset-password${window.location.hash}`);
      return;
    }

    // Email-confirmation success (type=signup or type=email).
    if (params.get('access_token')) {
      setStatus('verified');
      window.history.replaceState(null, '', window.location.pathname);
      return;
    }

    setErrorMessage('This verification link is invalid or has expired.');
    setStatus('error');
  }, [router]);

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
