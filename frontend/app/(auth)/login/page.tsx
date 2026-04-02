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
import { Mail, Lock, ArrowRight } from 'lucide-react';

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
      {/* Ambient glow effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-violet-600/15 blur-[120px]" />
        <div className="absolute -bottom-20 right-0 h-[400px] w-[400px] rounded-full bg-violet-500/10 blur-[100px]" />
        <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-fuchsia-500/5 blur-[80px]" />
      </div>

      {/* Left panel - branding */}
      <div className="relative hidden w-1/2 lg:flex lg:flex-col lg:justify-between p-12">
        {/* Decorative grid */}
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
            Land your dream job with{' '}
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              AI-powered
            </span>{' '}
            precision.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Analyze, refine, and tailor your CV to match any job description.
            Stand out from the crowd with intelligent insights.
          </p>

          {/* Feature pills */}
          <div className="mt-8 flex flex-wrap gap-2">
            {['CV Analysis', 'Smart Matching', 'ATS Optimization'].map((feature) => (
              <span
                key={feature}
                className="rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground"
              >
                {feature}
              </span>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-sm text-muted-foreground/60">&copy; {new Date().getFullYear()} JobHunter</p>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="relative flex w-full items-center justify-center px-6 lg:w-1/2">
        {/* Subtle border on the left */}
        <div className="absolute left-0 top-[10%] hidden h-[80%] w-px bg-gradient-to-b from-transparent via-border to-transparent lg:block" />

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
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter your credentials to access your account
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Password
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-muted-foreground/60 transition-colors hover:text-violet-400"
                >
                  Forgot?
                </Link>
              </div>
              <div className="group relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 transition-colors group-focus-within:text-violet-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 rounded-xl border-border bg-card pl-10 text-sm text-foreground placeholder:text-muted-foreground/60 transition-all focus:border-violet-500/40 focus:bg-card focus:ring-1 focus:ring-violet-500/20"
                  required
                />
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

          <p className="mt-8 text-center text-sm text-muted-foreground/60">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-medium text-violet-400 transition-colors hover:text-violet-300">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
