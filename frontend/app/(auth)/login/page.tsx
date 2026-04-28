'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  loginUser,
  resendVerification,
  challengeMfaLogin,
  verifyMfaLogin,
} from '@/lib/api';
import { friendlyError } from '@/lib/errorMessages';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSession } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resending, setResending] = useState(false);

  // MFA second-factor state. When the backend tells us mfa_required,
  // we keep the partial (aal1) access token in memory — never persisted —
  // and prompt for a code. The token never leaves this tab.
  const [mfaState, setMfaState] = useState<null | {
    partialToken: string;
    factorId: string;
    challengeId: string;
  }>(null);
  const [mfaCode, setMfaCode] = useState('');

  // Pre-fill email when arriving from /redeem or /register.
  useEffect(() => {
    const qEmail = searchParams.get('email');
    if (qEmail) setEmail(qEmail);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await loginUser(email, password);
      const data = res.data;

      // Account has MFA enrolled — request a TOTP challenge and pivot
      // the form to ask for the 6-digit code.
      if ('mfa_required' in data && data.mfa_required) {
        const challenge = await challengeMfaLogin(data.partial_session.access_token, data.factor_id);
        setMfaState({
          partialToken: data.partial_session.access_token,
          factorId: data.factor_id,
          challengeId: challenge.data.challenge_id,
        });
        return;
      }

      // No MFA — backend already issued the session cookie. Stash
      // the access token for the Bearer-header fallback (mobile +
      // 3rd-party-cookie-blocking browsers) and proceed.
      setSession(data.user, data.session.access_token);
      toast.success('Signed in successfully');
      router.push('/cv');
    } catch (err: any) {
      // Backend returns one generic 401 for any failure — wrong
      // password, unknown account, unconfirmed email. We can't and
      // shouldn't try to distinguish on the client.
      toast.error(friendlyError(err, 'login'));
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaState) return;
    setLoading(true);
    try {
      const res = await verifyMfaLogin(
        mfaState.partialToken,
        mfaState.factorId,
        mfaState.challengeId,
        mfaCode.trim()
      );
      setSession(res.data.user, res.data.session.access_token);
      toast.success('Signed in successfully');
      router.push('/cv');
    } catch (err: any) {
      toast.error('Invalid code. Try again.');
      setMfaCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await resendVerification(email);
      toast.success('If your email needs verification, a new link is on its way.');
    } catch (err: any) {
      toast.error(friendlyError(err, 'verify'));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden" style={{ background: '#101435' }}>

      {/* ── LEFT PANEL — Parallax branding ── */}
      <div className="relative hidden w-1/2 lg:flex lg:flex-col lg:items-center lg:justify-center overflow-hidden">
        {/* Background image */}
        <img
          src="/aivent/background/8.webp"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0" style={{ background: 'rgba(16,20,53,0.70)' }} />
        {/* Gradient fade to right panel */}
        <div className="absolute inset-y-0 right-0 w-1/3" style={{ background: 'linear-gradient(90deg, transparent 0%, #101435 100%)' }} />
        {/* Top fade */}
        <div className="absolute top-0 left-0 right-0" style={{ height: '120px', background: 'linear-gradient(180deg, #101435 0%, transparent 100%)' }} />
        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0" style={{ height: '120px', background: 'linear-gradient(0deg, #101435 0%, transparent 100%)' }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center px-12 max-w-lg">
          <img src="/aivent/logo.png" alt="AIvent" style={{ height: '80px', width: 'auto' }} className="mb-10 opacity-90" />
          <h1 className="text-white leading-[1.1] mb-6" style={{ fontSize: 'clamp(32px, 3.5vw, 48px)', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Land Your Dream Job with{' '}
            <span style={{ color: 'oklch(0.59 0.245 291)' }}>AI Precision</span>
          </h1>
          <p className="text-white/55 text-base leading-relaxed mb-10" style={{ fontWeight: 400 }}>
            Analyze your CV, generate cover letters, and track applications — all in one place.
          </p>

          {/* Glassmorphic stats */}
          <div
            className="grid grid-cols-3 divide-x divide-white/10 rounded-xl px-6 py-5 w-full mb-10"
            style={{ background: 'rgba(0,0,0,0.22)', backdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {[
              { v: '10K+', l: 'CVs Analyzed' },
              { v: '85%', l: 'Score Boost' },
              { v: '3x', l: 'More Interviews' },
            ].map((s) => (
              <div key={s.l} className="text-center px-3">
                <h3 className="text-white text-xl mb-0.5" style={{ fontWeight: 800 }}>{s.v}</h3>
                <p className="text-white/50 text-xs" style={{ fontWeight: 500 }}>{s.l}</p>
              </div>
            ))}
          </div>

          {/* Feature image */}
          <div className="relative rounded-xl overflow-hidden w-full" style={{ maxWidth: '360px' }}>
            <img src="/aivent/misc/c2.webp" alt="AI Job Search" className="w-full object-contain" />
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — Form ── */}
      <div className="relative flex w-full items-center justify-center px-6 lg:w-1/2">
        {/* Aurora glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute rounded-full" style={{ width: 600, height: 600, top: -100, right: -100, background: 'radial-gradient(circle, rgba(118,77,240,0.25) 0%, transparent 70%)', filter: 'blur(60px)' }} />
          <div className="absolute rounded-full" style={{ width: 400, height: 400, bottom: -50, left: -50, background: 'radial-gradient(circle, rgba(192,38,211,0.15) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        </div>
        {/* Dot grid */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.55) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            opacity: 0.03,
          }}
        />
        {/* Noise grain */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            opacity: 0.03,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
            backgroundSize: '128px 128px',
          }}
        />

        <div className="relative z-10 w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-10 lg:hidden">
            <img src="/aivent/logo.png" alt="AIvent" style={{ height: '64px', width: 'auto' }} />
          </div>

          <div className="mb-8">
            <span className="aivent-subtitle" style={{ marginBottom: '12px', display: 'block' }}>Welcome Back</span>
            <h2 className="text-white tracking-tight mb-2" style={{ fontSize: 'clamp(28px, 3vw, 36px)', fontWeight: 800 }}>
              Sign in to your account
            </h2>
            <p className="text-white/50 text-sm" style={{ fontWeight: 400 }}>
              Continue your job search journey
            </p>
          </div>

          {mfaState ? (
            <form onSubmit={handleMfaSubmit} className="space-y-5">
              <div
                className="rounded-xl px-4 py-3 text-sm flex items-start gap-3"
                style={{ background: 'rgba(118,77,240,0.08)', border: '1px solid rgba(118,77,240,0.25)', color: '#c4b5fd' }}
              >
                <ShieldCheck className="h-5 w-5 mt-0.5" />
                <p>Open your authenticator app and enter the 6-digit code.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mfa-code" className="text-xs font-700 uppercase tracking-widest text-white/50">
                  Authentication code
                </Label>
                <Input
                  id="mfa-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]*"
                  maxLength={8}
                  placeholder="123456"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                  className="h-12 rounded-xl border-white/10 bg-white/[0.04] px-4 text-center text-base font-700 tracking-[0.4em] text-white placeholder:text-white/25 transition-all focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                  style={{ backdropFilter: 'blur(10px)' }}
                  required
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="btn-aivent fx-slide w-full mt-2"
                data-hover={loading ? 'VERIFYING...' : 'VERIFY'}
                disabled={loading || mfaCode.length < 6}
                style={{ height: '48px', borderRadius: '12px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <span>{loading ? 'Verifying...' : 'Verify'}</span>
              </button>
              <button
                type="button"
                onClick={() => { setMfaState(null); setMfaCode(''); }}
                className="w-full text-center text-xs font-500 text-white/40 hover:text-white/70"
              >
                Cancel
              </button>
            </form>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-700 uppercase tracking-widest text-white/50">
                Email
              </Label>
              <div className="group relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 transition-colors group-focus-within:text-violet-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-xl border-white/10 bg-white/[0.04] pl-10 text-sm font-500 text-white placeholder:text-white/25 transition-all focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                  style={{ backdropFilter: 'blur(10px)' }}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-700 uppercase tracking-widest text-white/50">
                  Password
                </Label>
                <Link href="/forgot-password" className="text-xs font-500 text-white/35 transition-colors hover:text-violet-400">
                  Forgot?
                </Link>
              </div>
              <div className="group relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 transition-colors group-focus-within:text-violet-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-xl border-white/10 bg-white/[0.04] pl-10 pr-10 text-sm font-500 text-white placeholder:text-white/25 transition-all focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                  style={{ backdropFilter: 'blur(10px)' }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending || !email}
                  className="text-[11px] font-500 text-white/35 hover:text-violet-400 transition-colors disabled:opacity-50"
                >
                  {resending ? 'Sending...' : 'Resend verification email'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-aivent fx-slide w-full mt-2"
              data-hover={loading ? 'SIGNING IN...' : 'SIGN IN'}
              disabled={loading}
              style={{ height: '48px', borderRadius: '12px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <span>{loading ? 'Signing in...' : 'Sign In'}</span>
            </button>
          </form>
          )}

          <p className="mt-8 text-center text-sm text-white/40" style={{ fontWeight: 400 }}>
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-600 transition-colors hover:text-white" style={{ color: 'oklch(0.59 0.245 291)' }}>
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
