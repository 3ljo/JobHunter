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
      {/* Ambient glow effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-violet-600/15 blur-[120px]" />
        <div className="absolute -bottom-20 left-0 h-[400px] w-[400px] rounded-full bg-fuchsia-500/10 blur-[100px]" />
        <div className="absolute left-1/3 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/5 blur-[80px]" />
      </div>

      {/* Left panel - form */}
      <div className="relative flex w-full items-center justify-center px-6 lg:w-1/2">
        <div className="absolute right-0 top-[10%] hidden h-[80%] w-px bg-gradient-to-b from-transparent via-border to-transparent lg:block" />

        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600">
              <span className="text-sm font-black text-white leading-none tracking-tighter">JH</span>
            </div>
            <span className="text-lg font-semibold text-foreground tracking-tight">JobHunter</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Create your account
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Start optimizing your job applications today
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Email
              </Label>
              <div className="group relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 transition-colors group-focus-within:text-violet-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 rounded-xl border-border bg-card pl-10 text-sm text-foreground placeholder:text-muted-foreground/60 transition-all focus:border-violet-500/40 focus:bg-card focus:ring-1 focus:ring-violet-500/20"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Password
              </Label>
              <div className="group relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 transition-colors group-focus-within:text-violet-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 rounded-xl border-border bg-card pl-10 text-sm text-foreground placeholder:text-muted-foreground/60 transition-all focus:border-violet-500/40 focus:bg-card focus:ring-1 focus:ring-violet-500/20"
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
                  <p className={`text-xs ${getStrengthTextColor(strength)}`}>
                    {getStrengthLabel(strength)}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Confirm Password
              </Label>
              <div className="group relative">
                <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 transition-colors group-focus-within:text-violet-400" />
                <Input
                  id="confirm"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-11 rounded-xl border-border bg-card pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground/60 transition-all focus:border-violet-500/40 focus:bg-card focus:ring-1 focus:ring-violet-500/20"
                  required
                />
                {passwordsMatch && (
                  <Check className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
                )}
              </div>
            </div>

            <Button
              type="submit"
              className="group relative mt-2 h-11 w-full rounded-xl bg-violet-600 text-sm font-semibold text-white transition-all hover:bg-violet-500 hover:shadow-lg hover:shadow-violet-500/25 active:scale-[0.98]"
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

          <p className="mt-8 text-center text-sm text-muted-foreground/60">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-violet-400 transition-colors hover:text-violet-300">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right panel - branding */}
      <div className="relative hidden w-1/2 lg:flex lg:flex-col lg:justify-between p-12">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600">
              <span className="text-sm font-black text-white leading-none tracking-tighter">JH</span>
            </div>
            <span className="text-lg font-semibold text-foreground tracking-tight">JobHunter</span>
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-foreground">
            Your career journey{' '}
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              starts here.
            </span>
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Join thousands of job seekers who use AI-powered insights
            to craft the perfect CV and land interviews faster.
          </p>

          {/* Social proof */}
          <div className="mt-8 flex items-center gap-6">
            <div>
              <p className="text-2xl font-bold text-foreground">10K+</p>
              <p className="text-xs text-muted-foreground">CVs Analyzed</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <p className="text-2xl font-bold text-foreground">85%</p>
              <p className="text-xs text-muted-foreground">Score Improvement</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <p className="text-2xl font-bold text-foreground">3x</p>
              <p className="text-xs text-muted-foreground">More Interviews</p>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-sm text-muted-foreground/60">&copy; {new Date().getFullYear()} JobHunter</p>
        </div>
      </div>
    </div>
  );
}
