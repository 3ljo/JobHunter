'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { resetPassword } from '@/lib/api';
import toast from 'react-hot-toast';
import { Lock, ShieldCheck, Check, Eye, EyeOff, ArrowLeft, AlertTriangle } from 'lucide-react';

// Supabase delivers the recovery token in the URL hash fragment, e.g.
// #access_token=...&refresh_token=...&type=recovery&expires_in=3600
function parseHashTokens(): { accessToken: string | null; type: string | null; errorDescription: string | null } {
  if (typeof window === 'undefined') return { accessToken: null, type: null, errorDescription: null };
  const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
  const params = new URLSearchParams(hash);
  return {
    accessToken: params.get('access_token'),
    type: params.get('type'),
    errorDescription: params.get('error_description'),
  };
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { accessToken, type, errorDescription } = parseHashTokens();
    if (errorDescription) {
      setLinkError(errorDescription);
      return;
    }
    if (!accessToken || type !== 'recovery') {
      setLinkError('This reset link is invalid or has expired.');
      return;
    }
    setAccessToken(accessToken);
    // Strip the hash so tokens don't sit in the URL bar.
    window.history.replaceState(null, '', window.location.pathname);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 12) {
      toast.error('Password must be at least 12 characters');
      return;
    }
    setLoading(true);
    try {
      // Recovery token rides in the Authorization header (handled in
      // lib/api.ts) so it doesn't end up in any request-body capture.
      await resetPassword(accessToken, password);
      toast.success('Password updated! Please sign in.');
      router.push('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

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

        {linkError ? (
          <div className="text-center">
            <div
              className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.20)' }}
            >
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
            <h2 className="text-white tracking-tight mb-3" style={{ fontSize: 'clamp(28px, 3vw, 36px)', fontWeight: 800 }}>
              Link expired
            </h2>
            <p className="text-white/50 text-sm mb-8" style={{ fontWeight: 400 }}>
              {linkError}
            </p>
            <Link href="/forgot-password" className="btn-aivent btn-line fx-slide" data-hover="REQUEST NEW LINK" style={{ borderRadius: '12px' }}>
              <span>Request new link</span>
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8 text-center">
              <span className="aivent-subtitle" style={{ marginBottom: '12px', display: 'block' }}>Account Recovery</span>
              <h2 className="text-white tracking-tight mb-2" style={{ fontSize: 'clamp(28px, 3vw, 36px)', fontWeight: 800 }}>
                Set a new password
              </h2>
              <p className="text-white/50 text-sm" style={{ fontWeight: 400 }}>
                Choose a strong password you haven&apos;t used before
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-700 uppercase tracking-widest text-white/50">
                  New Password
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
                    {passwordsMatch && <Check className="h-4 w-4 text-emerald-400" />}
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

              <button
                type="submit"
                className="btn-aivent fx-slide w-full mt-2"
                data-hover={loading ? 'UPDATING...' : 'UPDATE PASSWORD'}
                disabled={loading || !accessToken}
                style={{ height: '48px', borderRadius: '12px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <span>{loading ? 'Updating...' : 'Update Password'}</span>
              </button>
            </form>
          </>
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
