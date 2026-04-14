'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loginUser } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { Mail, Lock, ArrowRight, Sparkles, FileSearch, Zap, BarChart3 } from 'lucide-react';

const features = [
  { icon: FileSearch, text: 'AI CV Analysis & ATS Scoring' },
  { icon: Sparkles, text: 'Tailored Cover Letter Generator' },
  { icon: BarChart3, text: 'Job Application Tracker' },
  { icon: Zap, text: 'Instant Optimization Suggestions' },
];

export default function LoginPage() {
  const router = useRouter();
  const { setToken, setUser } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await loginUser(email, password);
      setToken(res.data.session.access_token);
      setUser(res.data.user);
      toast.success('Signed in successfully');
      router.push('/cv');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-background">

      {/* ── LEFT PANEL — Branding ── */}
      <div className="relative hidden w-1/2 lg:flex lg:flex-col lg:justify-between p-12 overflow-hidden">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 -left-20 h-[500px] w-[500px] rounded-full bg-violet-600/20 blur-[120px]" />
          <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-fuchsia-600/10 blur-[100px]" />
        </div>
        {/* Dot grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }}
        />
        {/* Right border */}
        <div className="absolute right-0 top-[10%] h-[80%] w-px bg-gradient-to-b from-transparent via-border to-transparent" />

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
            Land your dream job with{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, #a78bfa 0%, #764df0 100%)' }}
            >
              AI precision.
            </span>
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground mb-10 font-400">
            Analyze your CV, generate cover letters, and track applications — all in one place.
          </p>

          <div className="space-y-3">
            {features.map((f) => (
              <div key={f.text} className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15 shrink-0">
                  <f.icon className="h-4 w-4 text-violet-400" />
                </div>
                <span className="text-sm font-500 text-muted-foreground">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-sm text-muted-foreground/50 font-400">&copy; {new Date().getFullYear()} JobHunter</p>
        </div>
      </div>

      {/* ── RIGHT PANEL — Form ── */}
      <div className="relative flex w-full items-center justify-center px-6 lg:w-1/2">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-violet-600/8 blur-[100px]" />
        </div>

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
              Welcome back
            </h2>
            <p className="text-sm text-muted-foreground font-400">
              Sign in to continue your job search
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-700 uppercase tracking-widest text-muted-foreground">
                  Password
                </Label>
                <Link href="/forgot-password" className="text-xs font-500 text-muted-foreground/60 transition-colors hover:text-violet-400">
                  Forgot?
                </Link>
              </div>
              <div className="group relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 transition-colors group-focus-within:text-violet-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Sign In
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground/60 font-400">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-600 text-violet-400 transition-colors hover:text-violet-300">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
