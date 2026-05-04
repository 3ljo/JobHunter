'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { registerUser, resendVerification } from '@/lib/api';
import { friendlyError } from '@/lib/errorMessages';
import toast from 'react-hot-toast';
import { Mail, Lock, ShieldCheck, Check, X as XIcon, Eye, EyeOff, MailCheck } from 'lucide-react';

// 12-char minimum is enforced server-side AND client-side. The
// strength meter awards at length thresholds the user can actually
// reach (12, 16, 20+) plus character-class diversity.
const MIN_LENGTH = 12;

function getPasswordStrength(password: string): number {
  let score = 0;
  if (password.length >= MIN_LENGTH) score += 25;
  if (password.length >= 16) score += 25;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 25;
  if (/[0-9!@#$%^&*]/.test(password)) score += 25;
  return score;
}

function getStrengthLabel(score: number): string {
  if (score <= 25) return 'Weak';
  if (score <= 50) return 'Fair';
  if (score <= 75) return 'Good';
  return 'Strong';
}

function getStrengthColor(score: number): string {
  if (score <= 25) return 'bg-red-500';
  if (score <= 50) return 'bg-yellow-500';
  if (score <= 75) return 'bg-violet-500';
  return 'bg-emerald-500';
}

function getStrengthTextColor(score: number): string {
  if (score <= 25) return 'text-red-400';
  if (score <= 50) return 'text-yellow-400';
  if (score <= 75) return 'text-violet-400';
  return 'text-emerald-400';
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      toast.error('Please accept the Terms and Privacy Policy to continue');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < MIN_LENGTH) {
      toast.error(`Password must be at least ${MIN_LENGTH} characters`);
      return;
    }
    setLoading(true);
    try {
      await registerUser(email, password);
      // Backend always returns the same generic message regardless of
      // whether the email is new or already registered (enumeration
      // resistance). The UX is the same in both cases: tell the user
      // to check their inbox; if they have an existing account, the
      // backend silently sends them a recovery email so they can get
      // back in.
      setSubmitted(true);
    } catch (err: any) {
      // The only errors that should land here are validation
      // failures (malformed email, password breach hit, etc.) and
      // rate-limit responses.
      toast.error(friendlyError(err, 'register'));
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

  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length >= MIN_LENGTH && password !== confirmPassword;

  return (
    <div className="relative flex min-h-screen overflow-hidden" style={{ background: '#101435' }}>

      {/* ── LEFT PANEL — Form ── */}
      <div className="relative flex w-full items-center justify-center px-6 lg:w-1/2">
        {/* Aurora glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute rounded-full" style={{ width: 600, height: 600, top: -100, left: -100, background: 'radial-gradient(circle, rgba(118,77,240,0.25) 0%, transparent 70%)', filter: 'blur(60px)' }} />
          <div className="absolute rounded-full" style={{ width: 400, height: 400, bottom: -50, right: -50, background: 'radial-gradient(circle, rgba(192,38,211,0.15) 0%, transparent 70%)', filter: 'blur(60px)' }} />
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
        {/* Right border */}
        <div className="absolute right-0 top-[10%] hidden h-[80%] w-px lg:block" style={{ background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.08), transparent)' }} />

        <div className="relative z-10 w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-10 lg:hidden">
            <img src="/aivent/logo.png" alt="AIvent" style={{ height: '64px', width: 'auto' }} />
          </div>

          {submitted ? (
            <div className="text-center">
              <div
                className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{ background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.20)' }}
              >
                <MailCheck className="h-8 w-8 text-emerald-400" />
              </div>
              <h2 className="text-white tracking-tight mb-3" style={{ fontSize: 'clamp(28px, 3vw, 36px)', fontWeight: 800 }}>
                Check your email
              </h2>
              <p className="text-white/50 text-sm mb-8" style={{ fontWeight: 400 }}>
                If <span className="font-600 text-white">{email}</span> is new, we sent a verification link.
                If an account already exists, we sent a recovery link instead.
              </p>
              <button
                onClick={handleResend}
                disabled={resending}
                className="btn-aivent btn-line fx-slide"
                data-hover={resending ? 'SENDING...' : 'RESEND EMAIL'}
                style={{ borderRadius: '12px' }}
              >
                <span>{resending ? 'Sending...' : 'Resend email'}</span>
              </button>
              <p className="mt-8 text-center text-sm text-white/40" style={{ fontWeight: 400 }}>
                Already verified?{' '}
                <Link href="/login" className="font-600 transition-colors hover:text-white" style={{ color: 'oklch(0.59 0.245 291)' }}>
                  Sign in
                </Link>
              </p>
            </div>
          ) : (
          <>
          <div className="mb-8">
            <span className="aivent-subtitle" style={{ marginBottom: '12px', display: 'block' }}>Get Started</span>
            <h2 className="text-white tracking-tight mb-2" style={{ fontSize: 'clamp(28px, 3vw, 36px)', fontWeight: 800 }}>
              Create your account
            </h2>
            <p className="text-white/50 text-sm" style={{ fontWeight: 400 }}>
              Start optimizing your job applications today
            </p>
          </div>

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
              <Label htmlFor="password" className="text-xs font-700 uppercase tracking-widest text-white/50">
                Password
              </Label>
              <div className="group relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 transition-colors group-focus-within:text-violet-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 12 characters"
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
              {password && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex gap-1">
                    {[25, 50, 75, 100].map((threshold) => (
                      <div
                        key={threshold}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          strength >= threshold ? getStrengthColor(strength) : 'bg-white/10'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs font-600 ${getStrengthTextColor(strength)}`}>
                    {getStrengthLabel(strength)}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm" className="text-xs font-700 uppercase tracking-widest text-white/50">
                Confirm Password
              </Label>
              <div className="group relative">
                <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 transition-colors group-focus-within:text-violet-400" />
                <Input
                  id="confirm"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-12 rounded-xl bg-white/[0.04] pl-10 pr-16 text-sm font-500 text-white placeholder:text-white/25 transition-all focus:ring-2"
                  style={{
                    backdropFilter: 'blur(10px)',
                    borderColor: passwordsMismatch
                      ? 'rgba(239,68,68,0.55)'
                      : 'rgba(255,255,255,0.1)',
                    boxShadow: passwordsMismatch
                      ? '0 0 0 1px rgba(239,68,68,0.35)'
                      : undefined,
                  }}
                  required
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  {passwordsMatch && (
                    <Check className="h-4 w-4 text-emerald-400" />
                  )}
                  {passwordsMismatch && (
                    <XIcon className="h-4 w-4 text-red-400" />
                  )}
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="text-white/30 hover:text-white/60 transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {passwordsMismatch && (
                <p className="text-[11px] text-red-400 pt-1" style={{ fontWeight: 500 }}>
                  Passwords don't match.
                </p>
              )}
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded"
                style={{ accentColor: '#a78bfa' }}
                required
              />
              <span className="text-[12px] leading-relaxed text-white/60" style={{ fontWeight: 400 }}>
                I agree to the{' '}
                <Link href="/terms" target="_blank" className="font-600 underline transition-colors hover:text-white" style={{ color: 'oklch(0.59 0.245 291)' }}>
                  Terms of Service
                </Link>
                {' '}and{' '}
                <Link href="/privacy" target="_blank" className="font-600 underline transition-colors hover:text-white" style={{ color: 'oklch(0.59 0.245 291)' }}>
                  Privacy Policy
                </Link>
                .
              </span>
            </label>

            <button
              type="submit"
              className="btn-aivent fx-slide w-full mt-2"
              data-hover={loading ? 'CREATING...' : 'CREATE ACCOUNT'}
              disabled={loading || !agreedToTerms}
              style={{ height: '48px', borderRadius: '12px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: agreedToTerms ? 1 : 0.55 }}
            >
              <span>{loading ? 'Creating account...' : 'Create Account'}</span>
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-white/40" style={{ fontWeight: 400 }}>
            Already have an account?{' '}
            <Link href="/login" className="font-600 transition-colors hover:text-white" style={{ color: 'oklch(0.59 0.245 291)' }}>
              Sign in
            </Link>
          </p>
          </>
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL — Parallax branding ── */}
      <div className="relative hidden w-1/2 lg:flex lg:flex-col lg:items-center lg:justify-center overflow-hidden">
        {/* Background image */}
        <img
          src="/aivent/background/3.webp"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0" style={{ background: 'rgba(16,20,53,0.70)' }} />
        {/* Gradient fade to left panel */}
        <div className="absolute inset-y-0 left-0 w-1/3" style={{ background: 'linear-gradient(270deg, transparent 0%, #101435 100%)' }} />
        {/* Top fade */}
        <div className="absolute top-0 left-0 right-0" style={{ height: '120px', background: 'linear-gradient(180deg, #101435 0%, transparent 100%)' }} />
        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0" style={{ height: '120px', background: 'linear-gradient(0deg, #101435 0%, transparent 100%)' }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center px-12 max-w-lg">
          <img src="/aivent/logo.png" alt="AIvent" style={{ height: '80px', width: 'auto' }} className="mb-10 opacity-90" />
          <h1 className="text-white leading-[1.1] mb-6" style={{ fontSize: 'clamp(32px, 3.5vw, 48px)', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Your Career Journey{' '}
            <span style={{ color: 'oklch(0.59 0.245 291)' }}>Starts Here</span>
          </h1>
          <p className="text-white/55 text-base leading-relaxed mb-10" style={{ fontWeight: 400 }}>
            AI-powered insights to score your CV against any job, fix the gaps, and write a cover letter that lands interviews.
          </p>

          {/* Feature image */}
          <div className="relative rounded-xl overflow-hidden w-full" style={{ maxWidth: '360px' }}>
            <img src="/aivent/misc/c2.webp" alt="AI Job Search" className="w-full object-contain" />
          </div>
        </div>
      </div>
    </div>
  );
}
