'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { forgotPassword } from '@/lib/api';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';

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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-violet-600/12 blur-[120px]" />
      </div>
      {/* Dot grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }}
      />

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="mb-12 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg shadow-violet-500/30">
            <span className="text-sm font-black text-white leading-none">JH</span>
          </div>
          <span className="text-lg font-bold text-foreground tracking-tight">JobHunter</span>
        </div>

        {!sent ? (
          <>
            <div className="mb-8">
              <h2 className="text-3xl font-800 tracking-tight text-foreground mb-2">
                Reset your password
              </h2>
              <p className="text-sm text-muted-foreground font-400">
                Enter your email and we&apos;ll send you a reset link
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-700 uppercase tracking-widest text-muted-foreground">
                  Email
                </Label>
                <div className="group relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 transition-colors group-focus-within:text-violet-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 rounded-xl border-border bg-card pl-10 text-sm font-500 text-foreground placeholder:text-muted-foreground/40 transition-all focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="group mt-2 h-12 w-full rounded-xl bg-violet-600 text-sm font-700 uppercase tracking-widest text-white transition-all hover:bg-violet-500 hover:shadow-xl hover:shadow-violet-500/25 active:scale-[0.98]"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Sending...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Send Reset Link
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                )}
              </Button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
            <h2 className="text-3xl font-800 tracking-tight text-foreground mb-3">
              Check your email
            </h2>
            <p className="text-sm text-muted-foreground mb-8 font-400">
              We sent a password reset link to{' '}
              <span className="font-600 text-foreground">{email}</span>
            </p>
            <Button
              variant="outline"
              onClick={() => setSent(false)}
              className="rounded-xl border-border font-600 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              Try another email
            </Button>
          </div>
        )}

        <div className="mt-10 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-500 text-muted-foreground/60 transition-colors hover:text-violet-400"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
