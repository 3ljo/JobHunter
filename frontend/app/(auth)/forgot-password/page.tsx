'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { forgotPassword } from '@/lib/api';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
      toast.success('Reset link sent! Check your email.');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6" style={{ background: '#101435' }}>
      {/* Aurora glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute rounded-full" style={{ width: 700, height: 700, top: '20%', left: '30%', background: 'radial-gradient(circle, rgba(118,77,240,0.20) 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute rounded-full" style={{ width: 400, height: 400, bottom: '10%', right: '20%', background: 'radial-gradient(circle, rgba(192,38,211,0.12) 0%, transparent 70%)', filter: 'blur(60px)' }} />
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
        {/* Logo */}
        <div className="mb-12 flex justify-center">
          <img src="/aivent/logo.png" alt="AIvent" style={{ height: '72px', width: 'auto' }} />
        </div>

        {!sent ? (
          <>
            <div className="mb-8 text-center">
              <span className="aivent-subtitle" style={{ marginBottom: '12px', display: 'block' }}>Account Recovery</span>
              <h2 className="text-white tracking-tight mb-2" style={{ fontSize: 'clamp(28px, 3vw, 36px)', fontWeight: 800 }}>
                Reset your password
              </h2>
              <p className="text-white/50 text-sm" style={{ fontWeight: 400 }}>
                Enter your email and we&apos;ll send you a reset link
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

              <button
                type="submit"
                className="btn-aivent fx-slide w-full mt-2"
                data-hover={loading ? 'SENDING...' : 'SEND RESET LINK'}
                disabled={loading}
                style={{ height: '48px', borderRadius: '12px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <span>{loading ? 'Sending...' : 'Send Reset Link'}</span>
              </button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <div
              className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{ background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.20)' }}
            >
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
            <h2 className="text-white tracking-tight mb-3" style={{ fontSize: 'clamp(28px, 3vw, 36px)', fontWeight: 800 }}>
              Check your email
            </h2>
            <p className="text-white/50 text-sm mb-8" style={{ fontWeight: 400 }}>
              We sent a password reset link to{' '}
              <span className="font-600 text-white">{email}</span>
            </p>
            <button
              onClick={() => setSent(false)}
              className="btn-aivent btn-line fx-slide"
              data-hover="TRY ANOTHER"
              style={{ borderRadius: '12px' }}
            >
              <span>Try another email</span>
            </button>
          </div>
        )}

        <div className="mt-10 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-500 text-white/40 transition-colors hover:text-violet-400"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
