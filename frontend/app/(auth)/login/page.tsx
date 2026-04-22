'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loginUser, resendVerification } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { setToken, setUser } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [unconfirmed, setUnconfirmed] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setUnconfirmed(false);
    try {
      const res = await loginUser(email, password);
      setToken(res.data.session.access_token);
      setUser(res.data.user);
      toast.success('Signed in successfully');
      router.push('/cv');
    } catch (err: any) {
      if (err.response?.data?.code === 'email_not_confirmed') {
        setUnconfirmed(true);
        toast.error('Please verify your email first');
      } else {
        toast.error(err.response?.data?.error || 'Failed to sign in');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await resendVerification(email);
      toast.success('Verification email resent');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to resend');
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
            </div>

            {unconfirmed && (
              <div
                className="rounded-xl px-4 py-3 text-sm"
                style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', color: '#fbbf24' }}
              >
                <p className="mb-2 font-600">Your email isn&apos;t verified yet.</p>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending || !email}
                  className="font-700 underline transition-opacity hover:opacity-80 disabled:opacity-50"
                >
                  {resending ? 'Sending...' : 'Resend verification email'}
                </button>
              </div>
            )}

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
