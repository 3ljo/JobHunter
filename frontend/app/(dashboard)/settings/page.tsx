'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/authStore';
import { changePassword, getMyUsage } from '@/lib/api';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Settings, Lock, LogOut, Mail, Shield, Eye, EyeOff, BarChart3, FileText, FileSignature, Zap, Crown, ExternalLink, Gift, Copy, Check, Users } from 'lucide-react';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { createPortalSession, getMyReferralCode, getMyReferrals } from '@/lib/api';
import Link from 'next/link';

interface UsageData {
  cv_today: number;
  cv_limit: number;
  cl_today: number;
  cl_limit: number;
  month_total: number;
  total_cvs: number;
}

export default function SettingsPage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const { subscription, fetchSubscription } = useSubscriptionStore();
  const [portalLoading, setPortalLoading] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralCount, setReferralCount] = useState(0);
  const [referralCopied, setReferralCopied] = useState(false);

  useEffect(() => {
    getMyUsage()
      .then((res) => setUsage(res.data.usage))
      .catch(() => {});
    fetchSubscription();
    getMyReferralCode()
      .then((res) => {
        setReferralCode(res.data.referral_code.code);
        setReferralCount(res.data.referral_code.times_used || 0);
      })
      .catch(() => {});
  }, [fetchSubscription]);

  const referralLink = referralCode
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${referralCode}`
    : '';

  const handleCopyReferral = (text: string) => {
    navigator.clipboard.writeText(text);
    setReferralCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setReferralCopied(false), 2000);
  };

  const handleManageBilling = async () => {
    setPortalLoading(true);
    try {
      const res = await createPortalSession();
      window.location.href = res.data.url;
    } catch {
      toast.error('Failed to open billing portal');
      setPortalLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await changePassword(newPassword);
      toast.success('Password updated successfully');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-700/10 ring-1 ring-violet-500/25 shadow-[0_0_16px_rgba(118,77,240,0.15)]">
          <Settings className="h-4.5 w-4.5 text-violet-400" />
        </div>
        <div>
          <h1 className="text-xl font-black text-foreground tracking-tight">Settings</h1>
          <p className="text-muted-foreground/60 text-xs">Manage your account</p>
        </div>
      </div>

      {/* Usage Dashboard */}
      {usage && (
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-card p-6">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            Your Usage
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* CV Today */}
            <div className="rounded-xl p-3" style={{ background: 'rgba(118,77,240,0.06)', border: '1px solid rgba(118,77,240,0.12)' }}>
              <div className="flex items-center gap-1.5 mb-2">
                <FileText className="h-3.5 w-3.5 text-violet-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">CVs Today</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-foreground">{usage.cv_today}</span>
                <span className="text-xs text-muted-foreground/60">/ {usage.cv_limit}</span>
              </div>
              <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min((usage.cv_today / usage.cv_limit) * 100, 100)}%`,
                    background: usage.cv_today >= usage.cv_limit ? '#ef4444' : '#764DF0',
                  }}
                />
              </div>
            </div>

            {/* CL Today */}
            <div className="rounded-xl p-3" style={{ background: 'rgba(118,77,240,0.06)', border: '1px solid rgba(118,77,240,0.12)' }}>
              <div className="flex items-center gap-1.5 mb-2">
                <FileSignature className="h-3.5 w-3.5 text-violet-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Letters Today</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-foreground">{usage.cl_today}</span>
                <span className="text-xs text-muted-foreground/60">/ {usage.cl_limit}</span>
              </div>
              <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min((usage.cl_today / usage.cl_limit) * 100, 100)}%`,
                    background: usage.cl_today >= usage.cl_limit ? '#ef4444' : '#764DF0',
                  }}
                />
              </div>
            </div>

            {/* Month Total */}
            <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-1.5 mb-2">
                <Zap className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">This Month</span>
              </div>
              <span className="text-xl font-black text-foreground">{usage.month_total}</span>
              <p className="text-[10px] text-muted-foreground/50 mt-1">AI calls</p>
            </div>

            {/* Total CVs */}
            <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-1.5 mb-2">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total CVs</span>
              </div>
              <span className="text-xl font-black text-foreground">{usage.total_cvs}</span>
              <p className="text-[10px] text-muted-foreground/50 mt-1">analyzed</p>
            </div>
          </div>
        </div>
      )}

      {/* Subscription */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-card p-6">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
          <Crown className="h-4 w-4 text-violet-400" />
          Subscription
        </h2>

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg font-black text-foreground capitalize">
                {subscription?.plan === 'pro_plus' ? 'Pro+' : subscription?.plan || 'Free'}
              </span>
              <span
                className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                style={{
                  background: subscription?.status === 'active' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                  color: subscription?.status === 'active' ? '#34d399' : '#f87171',
                }}
              >
                {subscription?.status || 'active'}
              </span>
            </div>

            {subscription?.plan !== 'free' && subscription?.current_period_end && (
              <p className="text-xs text-muted-foreground/60">
                {subscription.cancel_at_period_end ? 'Cancels' : 'Renews'} on{' '}
                {new Date(subscription.current_period_end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                {subscription.billing_interval && ` (${subscription.billing_interval}ly)`}
              </p>
            )}

            {subscription?.plan === 'free' && (
              <p className="text-xs text-muted-foreground/60">Upgrade to unlock more analyses and features</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {subscription?.plan !== 'free' && (
              <Button
                onClick={handleManageBilling}
                disabled={portalLoading}
                variant="outline"
                className="rounded-xl border-white/10 text-sm hover:bg-white/5 transition-all"
              >
                {portalLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Opening...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <ExternalLink className="h-3.5 w-3.5" />
                    Manage Billing
                  </span>
                )}
              </Button>
            )}
            <Link
              href="/pricing"
              className="btn-aivent fx-slide"
              data-hover={subscription?.plan === 'free' ? 'UPGRADE' : 'CHANGE PLAN'}
            >
              <span>{subscription?.plan === 'free' ? 'Upgrade' : 'Change Plan'}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Referral Program */}
      {referralCode && (
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-card p-6">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
            <Gift className="h-4 w-4 text-violet-400" />
            Referral Program
          </h2>

          <p className="text-xs text-muted-foreground/60 mb-4">
            Share your code with friends. They get <span className="text-emerald-400 font-semibold">30% off</span> their first month, and you get a <span className="text-emerald-400 font-semibold">free month</span> when they subscribe.
          </p>

          {/* Referral code */}
          <div className="mb-4">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">Your Referral Code</label>
            <div className="flex items-center gap-2">
              <div
                className="flex-1 flex items-center h-10 rounded-xl px-4 text-sm font-mono font-bold text-white tracking-wider"
                style={{ background: 'rgba(118,77,240,0.08)', border: '1px solid rgba(118,77,240,0.2)' }}
              >
                {referralCode}
              </div>
              <button
                onClick={() => handleCopyReferral(referralCode)}
                className="h-10 w-10 rounded-xl flex items-center justify-center transition-all"
                style={{ background: 'rgba(118,77,240,0.1)', border: '1px solid rgba(118,77,240,0.2)' }}
                title="Copy code"
              >
                {referralCopied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-violet-400" />}
              </button>
            </div>
          </div>

          {/* Shareable link */}
          <div className="mb-4">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">Shareable Link</label>
            <div className="flex items-center gap-2">
              <div
                className="flex-1 flex items-center h-10 rounded-xl px-4 text-xs text-white/60 truncate"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                {referralLink}
              </div>
              <button
                onClick={() => handleCopyReferral(referralLink)}
                className="h-10 w-10 rounded-xl flex items-center justify-center transition-all shrink-0"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                title="Copy link"
              >
                <Copy className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Stats */}
          <div
            className="flex items-center gap-3 rounded-xl p-3"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <span className="text-lg font-black text-foreground tabular-nums">{referralCount}</span>
              <span className="text-xs text-muted-foreground/60 ml-1.5">
                {referralCount === 1 ? 'person' : 'people'} referred
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Account Info */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-card p-6 space-y-4">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          Account
        </h2>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Email</Label>
          <div className="flex h-10 items-center rounded-xl border border-border bg-card/80 px-3 text-sm text-muted-foreground">
            {user?.email || '—'}
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-card p-6">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
          <Shield className="h-4 w-4 text-muted-foreground" />
          Change Password
        </h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">New Password</Label>
            <div className="group relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 transition-colors group-focus-within:text-violet-400" />
              <Input
                type={showNew ? 'text' : 'password'}
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-10 rounded-xl border-border bg-card/80 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20"
                required
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
                tabIndex={-1}
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Confirm New Password</Label>
            <div className="group relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 transition-colors group-focus-within:text-violet-400" />
              <Input
                type={showConfirm ? 'text' : 'password'}
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-10 rounded-xl border-border bg-card/80 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="h-10 rounded-xl bg-gradient-to-b from-violet-500 to-violet-700 text-sm font-semibold text-white transition-all shadow-[0_2px_20px_rgba(118,77,240,0.3)] hover:shadow-[0_4px_28px_rgba(118,77,240,0.45)] hover:from-violet-400 hover:to-violet-600 active:scale-[0.97]"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="lds-roller-sm" style={{ color: '#fff' }}><span /><span /><span /><span /><span /><span /><span /><span /></span>
                Updating...
              </span>
            ) : (
              'Update Password'
            )}
          </Button>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="relative overflow-hidden rounded-2xl border border-red-500/15 bg-card p-6">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-500/20 to-transparent" />
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
          <LogOut className="h-4 w-4 text-red-400" />
          Sign Out
        </h2>
        <p className="text-xs text-muted-foreground mb-4">Sign out of your account on this device.</p>
        <Button
          onClick={handleLogout}
          variant="outline"
          className="rounded-xl border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
}
