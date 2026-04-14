'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { registerUser, loginUser } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { Mail, Lock, ShieldCheck, ArrowRight, Check } from 'lucide-react';

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
  const router = useRouter();
  const { setToken, setUser } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

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
      await registerUser(email, password);
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
    <div className="relative flex min-h-screen overflow-hidden bg-background">

      {/* ── LEFT PANEL — Form ── */}
      <div className="relative flex w-full items-center justify-center px-6 lg:w-1/2">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-violet-600/8 blur-[100px]" />
        </div>
        {/* Right border */}
        <div className="absolute right-0 top-[10%] hidden h-[80%] w-px bg-gradient-to-b from-transparent via-border to-transparent lg:block" />

        <div className="relative z-10 w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg shadow-violet-500/30">
              <span className="text-sm font-black text-white leading-none">JH</span>
            </div>
            <span className="text-lg font-bold text-foreground tracking-tight">JobHunter</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-800 tracking-tight text-foreground mb-2">
              Create your account
            </h2>
            <p className="text-sm text-muted-foreground font-400">
              Start optimizing your job applications today
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

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-700 uppercase tracking-widest text-muted-foreground">
                Password
              </Label>
              <div className="group relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 transition-colors group-focus-within:text-violet-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-xl border-border bg-card pl-10 text-sm font-500 text-foreground placeholder:text-muted-foreground/40 transition-all focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                  required
                />
              </div>
              {password && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex gap-1">
                    {[25, 50, 75, 100].map((threshold) => (
                      <div
                        key={threshold}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          strength >= threshold ? getStrengthColor(strength) : 'bg-muted'
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
              <Label htmlFor="confirm" className="text-xs font-700 uppercase tracking-widest text-muted-foreground">
                Confirm Password
              </Label>
              <div className="group relative">
                <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 transition-colors group-focus-within:text-violet-400" />
                <Input
                  id="confirm"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-12 rounded-xl border-border bg-card pl-10 pr-10 text-sm font-500 text-foreground placeholder:text-muted-foreground/40 transition-all focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                  required
                />
                {passwordsMatch && (
                  <Check className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
                )}
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
                  Creating account...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Create Account
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground/60 font-400">
            Already have an account?{' '}
            <Link href="/login" className="font-600 text-violet-400 transition-colors hover:text-violet-300">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL — Branding ── */}
      <div className="relative hidden w-1/2 lg:flex lg:flex-col lg:justify-between p-12 overflow-hidden">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 right-0 h-[500px] w-[500px] rounded-full bg-violet-600/20 blur-[120px]" />
          <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-fuchsia-600/10 blur-[100px]" />
        </div>
        {/* Dot grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }}
        />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg shadow-violet-500/30">
            <span className="text-sm font-black text-white leading-none">JH</span>
          </div>
          <span className="text-lg font-bold text-foreground tracking-tight">JobHunter</span>
        </div>

        {/* Main copy */}
        <div className="relative z-10 max-w-md">
          <h1 className="text-5xl font-800 leading-[1.1] tracking-tight text-foreground mb-6">
            Your career journey{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, #a78bfa 0%, #764df0 100%)' }}
            >
              starts here.
            </span>
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground mb-10 font-400">
            Join thousands of job seekers using AI-powered insights to craft the perfect CV and land interviews faster.
          </p>

          {/* Social proof */}
          <div className="flex items-center gap-8">
            {[
              { value: '10K+', label: 'CVs Analyzed' },
              { value: '85%', label: 'Score Boost' },
              { value: '3×', label: 'More Interviews' },
            ].map((stat, i) => (
              <div key={stat.label} className="flex items-center gap-8">
                <div className="text-center">
                  <p className="text-3xl font-800 tracking-tight text-foreground">{stat.value}</p>
                  <p className="text-xs font-600 uppercase tracking-wider text-muted-foreground mt-1">{stat.label}</p>
                </div>
                {i < 2 && <div className="h-10 w-px bg-border" />}
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-sm text-muted-foreground/50 font-400">&copy; {new Date().getFullYear()} JobHunter</p>
        </div>
      </div>
    </div>
  );
}
