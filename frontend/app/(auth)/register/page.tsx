'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { registerUser, loginUser, validateReferralCode } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { Mail, Lock, ShieldCheck, Check, Eye, EyeOff, Gift } from 'lucide-react';

function getPasswordStrength(password: string): number {
  let score = 0;
  if (password.length >= 6) score += 25;
  if (password.length >= 10) score += 25;
  if (/[A-Z]/.test(password)) score += 25;
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
  const router = useRouter();
  const { setToken, setUser } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showReferral, setShowReferral] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [referralValid, setReferralValid] = useState<boolean | null>(null);
  const searchParams = useSearchParams();

  // Pre-fill referral code from URL (e.g. /register?ref=REF-ABC123)
  useState(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setReferralCode(ref);
      setShowReferral(true);
      validateReferralCode(ref)
        .then(() => setReferralValid(true))
        .catch(() => setReferralValid(false));
    }
  });

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await registerUser(email, password, referralCode || undefined);
      const loginRes = await loginUser(email, password);
      setToken(loginRes.data.session.access_token);
      setUser(loginRes.data.user);
      toast.success('Account created successfully');
      router.push('/cv');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

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
            <img src="/aivent/logo.png" alt="AIvent" style={{ height: '36px', width: 'auto' }} />
          </div>

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
                  placeholder="At least 6 characters"
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
                  className="h-12 rounded-xl border-white/10 bg-white/[0.04] pl-10 pr-16 text-sm font-500 text-white placeholder:text-white/25 transition-all focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                  style={{ backdropFilter: 'blur(10px)' }}
                  required
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  {passwordsMatch && (
                    <Check className="h-4 w-4 text-emerald-400" />
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
            </div>

            {/* Referral code — collapsible */}
            <div>
              {!showReferral ? (
                <button
                  type="button"
                  onClick={() => setShowReferral(true)}
                  className="flex items-center gap-2 text-xs font-600 transition-colors hover:text-white"
                  style={{ color: 'oklch(0.59 0.245 291)' }}
                >
                  <Gift className="h-3.5 w-3.5" />
                  Have a referral code?
                </button>
              ) : (
                <div className="space-y-1.5">
                  <Label htmlFor="referral" className="text-xs font-700 uppercase tracking-widest text-white/50">
                    Referral Code
                  </Label>
                  <div className="group relative">
                    <Gift className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 transition-colors group-focus-within:text-violet-400" />
                    <Input
                      id="referral"
                      type="text"
                      placeholder="e.g. REF-ABC123"
                      value={referralCode}
                      onChange={(e) => {
                        setReferralCode(e.target.value.toUpperCase());
                        setReferralValid(null);
                      }}
                      onBlur={async () => {
                        if (referralCode.trim()) {
                          try {
                            await validateReferralCode(referralCode.trim());
                            setReferralValid(true);
                          } catch {
                            setReferralValid(false);
                          }
                        }
                      }}
                      className="h-12 rounded-xl border-white/10 bg-white/[0.04] pl-10 pr-10 text-sm font-500 text-white placeholder:text-white/25 transition-all focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                      style={{ backdropFilter: 'blur(10px)' }}
                    />
                    {referralValid === true && (
                      <Check className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
                    )}
                    {referralValid === false && (
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-red-400 text-xs font-600">Invalid</span>
                    )}
                  </div>
                  {referralValid === true && (
                    <p className="text-xs font-500" style={{ color: '#34d399' }}>
                      You will get 30% off your first paid month!
                    </p>
                  )}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="btn-aivent fx-slide w-full mt-2"
              data-hover={loading ? 'CREATING...' : 'CREATE ACCOUNT'}
              disabled={loading}
              style={{ height: '48px', borderRadius: '12px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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
          <img src="/aivent/logo.png" alt="AIvent" style={{ height: '44px', width: 'auto' }} className="mb-10 opacity-90" />
          <h1 className="text-white leading-[1.1] mb-6" style={{ fontSize: 'clamp(32px, 3.5vw, 48px)', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Your Career Journey{' '}
            <span style={{ color: 'oklch(0.59 0.245 291)' }}>Starts Here</span>
          </h1>
          <p className="text-white/55 text-base leading-relaxed mb-10" style={{ fontWeight: 400 }}>
            Join thousands of job seekers using AI-powered insights to craft the perfect CV and land interviews faster.
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
