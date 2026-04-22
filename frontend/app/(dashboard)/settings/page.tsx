'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  Settings, User, CreditCard, BarChart3, Gift, AlertTriangle,
  Mail, Lock, Eye, EyeOff, Crown, ExternalLink, FileText, FileSignature,
  Zap, Copy, Check, Users, Trash2, LogOut,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle,
  DialogDescription, DialogClose,
} from '@/components/ui/dialog';

import { useAuthStore } from '@/store/authStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useAccountStore } from '@/store/accountStore';
import {
  changePassword, deleteAccount,
  updateProfile, createPortalSession,
} from '@/lib/api';

type TabKey = 'account' | 'billing' | 'usage' | 'referrals' | 'danger';

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { subscription, fetchSubscription } = useSubscriptionStore();
  const { referralCode, myUsage: usage, load: loadAccount } = useAccountStore();

  const [tab, setTab] = useState<TabKey>('account');

  useEffect(() => {
    fetchSubscription();
    loadAccount();
  }, [fetchSubscription, loadAccount]);

  return (
    <div className="space-y-6 max-w-3xl">
      <header className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-700/10 ring-1 ring-violet-500/25 shadow-[0_0_16px_rgba(118,77,240,0.15)]">
          <Settings className="h-4 w-4 text-violet-400" />
        </div>
        <div>
          <h1 className="text-xl font-black text-foreground tracking-tight">Settings</h1>
          <p className="text-muted-foreground/60 text-xs">Manage your account, plan, and data</p>
        </div>
      </header>

      <Tabs value={tab} onValueChange={(v: any) => setTab(v as TabKey)}>
        <TabsList variant="line" className="w-full justify-start gap-1 overflow-x-auto">
          <TabsTrigger value="account"><User className="h-3.5 w-3.5" /> Account</TabsTrigger>
          <TabsTrigger value="billing"><CreditCard className="h-3.5 w-3.5" /> Billing</TabsTrigger>
          <TabsTrigger value="usage"><BarChart3 className="h-3.5 w-3.5" /> Usage</TabsTrigger>
          <TabsTrigger value="referrals"><Gift className="h-3.5 w-3.5" /> Referrals</TabsTrigger>
          <TabsTrigger value="danger"><AlertTriangle className="h-3.5 w-3.5" /> Danger</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="mt-6 space-y-6">
          <ProfileCard />
          <EmailReadOnlyCard currentEmail={user?.email ?? ''} />
          <PasswordCard />
        </TabsContent>

        <TabsContent value="billing" className="mt-6 space-y-6">
          <BillingCard subscription={subscription} />
        </TabsContent>

        <TabsContent value="usage" className="mt-6 space-y-6">
          <UsageCard usage={usage} />
        </TabsContent>

        <TabsContent value="referrals" className="mt-6 space-y-6">
          <ReferralsCard referralCode={referralCode?.code ?? null} timesUsed={referralCode?.times_used ?? 0} />
        </TabsContent>

        <TabsContent value="danger" className="mt-6 space-y-6">
          <SignOutCard onSignOut={() => { logout(); router.push('/login'); }} />
          <DeleteAccountCard onDeleted={() => { logout(); router.push('/login'); }} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Reusable card shell
// ─────────────────────────────────────────────────────────────────────────────
function Card({
  title, icon: Icon, accent = 'violet', children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: 'violet' | 'red';
  children: React.ReactNode;
}) {
  const accentColor = accent === 'red' ? 'border-red-500/15' : 'border-white/[0.07]';
  const lineColor = accent === 'red' ? 'via-red-500/20' : 'via-violet-500/20';
  const iconColor = accent === 'red' ? 'text-red-400' : 'text-violet-400';
  return (
    <div className={`relative overflow-hidden rounded-2xl border ${accentColor} bg-card p-6`}>
      <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${lineColor} to-transparent`} />
      <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
        <Icon className={`h-4 w-4 ${iconColor}`} />
        {title}
      </h2>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Profile (full name) — backed by accountStore so dashboard greeting updates
// ─────────────────────────────────────────────────────────────────────────────
function ProfileCard() {
  const { profile, loaded, refresh } = useAccountStore();
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);

  // Hydrate the input once profile arrives from the store.
  useEffect(() => {
    if (profile) setFullName(profile.full_name || '');
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({ full_name: fullName });
      await refresh();
      toast.success('Profile updated');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card title="Profile" icon={User}>
      <form onSubmit={handleSave} className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Full name</Label>
          <Input
            type="text"
            placeholder={!loaded ? 'Loading…' : 'How should we address you?'}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={!loaded}
            className="h-10 rounded-xl border-border bg-card/80 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20"
          />
          <p className="text-[11px] text-muted-foreground/60">
            Used to greet you on the dashboard and printed on every CV you generate.
          </p>
        </div>
        <Button
          type="submit"
          disabled={saving || !loaded}
          className="h-10 rounded-xl bg-gradient-to-b from-violet-500 to-violet-700 text-sm font-semibold text-white transition-all shadow-[0_2px_20px_rgba(118,77,240,0.3)] hover:shadow-[0_4px_28px_rgba(118,77,240,0.45)] hover:from-violet-400 hover:to-violet-600 active:scale-[0.97]"
        >
          {saving ? 'Saving…' : 'Save profile'}
        </Button>
      </form>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Email — read-only (account email is fixed; tied to login provider)
// ─────────────────────────────────────────────────────────────────────────────
function EmailReadOnlyCard({ currentEmail }: { currentEmail: string }) {
  return (
    <Card title="Email" icon={Mail}>
      <div className="flex h-10 items-center rounded-xl border border-border bg-card/80 px-3 text-sm text-muted-foreground">
        {currentEmail || '—'}
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Password
// ─────────────────────────────────────────────────────────────────────────────
function PasswordCard() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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
      toast.success('Password updated');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Password" icon={Lock}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">New password</Label>
          <div className="group relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 transition-colors group-focus-within:text-violet-400" />
            <Input
              type={showNew ? 'text' : 'password'}
              placeholder="At least 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="h-10 rounded-xl border-border bg-card/80 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20"
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
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Confirm new password</Label>
          <div className="group relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 transition-colors group-focus-within:text-violet-400" />
            <Input
              type={showConfirm ? 'text' : 'password'}
              placeholder="Confirm your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="h-10 rounded-xl border-border bg-card/80 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20"
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
          className="h-10 rounded-xl bg-gradient-to-b from-violet-500 to-violet-700 text-sm font-semibold text-white shadow-[0_2px_20px_rgba(118,77,240,0.3)] hover:from-violet-400 hover:to-violet-600 active:scale-[0.97]"
        >
          {loading ? 'Updating…' : 'Update password'}
        </Button>
      </form>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Billing / subscription
// ─────────────────────────────────────────────────────────────────────────────
function BillingCard({ subscription }: { subscription: any }) {
  const [portalLoading, setPortalLoading] = useState(false);

  const openPortal = async () => {
    setPortalLoading(true);
    try {
      const res = await createPortalSession();
      window.location.href = res.data.url;
    } catch {
      toast.error('Failed to open billing portal');
      setPortalLoading(false);
    }
  };

  return (
    <Card title="Subscription" icon={Crown}>
      <div className="flex flex-wrap items-center justify-between gap-4">
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
              onClick={openPortal}
              disabled={portalLoading}
              variant="outline"
              className="rounded-xl border-white/10 text-sm hover:bg-white/5 transition-all"
            >
              {portalLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Opening…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Manage billing
                </span>
              )}
            </Button>
          )}
          <Link
            href="/pricing"
            className="btn-aivent fx-slide"
            data-hover={subscription?.plan === 'free' ? 'UPGRADE' : 'CHANGE PLAN'}
          >
            <span>{subscription?.plan === 'free' ? 'Upgrade' : 'Change plan'}</span>
          </Link>
        </div>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Usage stats
// ─────────────────────────────────────────────────────────────────────────────
function UsageCard({ usage }: { usage: any }) {
  if (!usage) {
    return (
      <Card title="Your Usage" icon={BarChart3}>
        <p className="text-sm text-muted-foreground/60">Loading usage…</p>
      </Card>
    );
  }
  return (
    <Card title="Your Usage" icon={BarChart3}>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <UsageTile icon={FileText} label="CVs Today" value={usage.cv_today} limit={usage.cv_limit} accent />
        <UsageTile icon={FileSignature} label="Letters Today" value={usage.cl_today} limit={usage.cl_limit} accent />
        <UsageTile icon={Zap} label="This Month" value={usage.month_total} sub="AI calls" />
        <UsageTile icon={FileText} label="Total CVs" value={usage.total_cvs} sub="analyzed" />
      </div>
    </Card>
  );
}

function UsageTile({
  icon: Icon, label, value, limit, sub, accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  limit?: number;
  sub?: string;
  accent?: boolean;
}) {
  const bg = accent ? 'rgba(118,77,240,0.06)' : 'rgba(255,255,255,0.02)';
  const border = accent ? 'rgba(118,77,240,0.12)' : 'rgba(255,255,255,0.06)';
  const iconColor = accent ? 'text-violet-400' : 'text-muted-foreground';
  const pct = limit ? Math.min((value / limit) * 100, 100) : 0;
  const overLimit = limit ? value >= limit : false;
  return (
    <div className="rounded-xl p-3" style={{ background: bg, border: `1px solid ${border}` }}>
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-black text-foreground">{value}</span>
        {limit !== undefined && <span className="text-xs text-muted-foreground/60">/ {limit}</span>}
      </div>
      {limit !== undefined ? (
        <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: overLimit ? '#ef4444' : '#764DF0' }}
          />
        </div>
      ) : (
        <p className="text-[10px] text-muted-foreground/50 mt-1">{sub}</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Referrals
// ─────────────────────────────────────────────────────────────────────────────
function ReferralsCard({ referralCode, timesUsed }: { referralCode: string | null; timesUsed: number }) {
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);
  const referralLink = referralCode
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${referralCode}`
    : '';

  const copy = (text: string, kind: 'code' | 'link') => {
    navigator.clipboard.writeText(text);
    setCopied(kind);
    toast.success('Copied!');
    setTimeout(() => setCopied(null), 2000);
  };

  if (!referralCode) {
    return (
      <Card title="Referral Program" icon={Gift}>
        <p className="text-sm text-muted-foreground/60">Your referral code is being generated. Refresh in a moment.</p>
      </Card>
    );
  }

  return (
    <Card title="Referral Program" icon={Gift}>
      <p className="text-xs text-muted-foreground/60 mb-4">
        Share your code. Friends get <span className="text-emerald-400 font-semibold">30% off</span> their first month, you get a <span className="text-emerald-400 font-semibold">free month</span> when they subscribe.
      </p>

      <div className="space-y-3">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">Your code</label>
          <div className="flex items-center gap-2">
            <div
              className="flex-1 flex items-center h-10 rounded-xl px-4 text-sm font-mono font-bold text-white tracking-wider"
              style={{ background: 'rgba(118,77,240,0.08)', border: '1px solid rgba(118,77,240,0.2)' }}
            >
              {referralCode}
            </div>
            <button
              onClick={() => copy(referralCode, 'code')}
              className="h-10 w-10 rounded-xl flex items-center justify-center transition-all"
              style={{ background: 'rgba(118,77,240,0.1)', border: '1px solid rgba(118,77,240,0.2)' }}
              title="Copy code"
            >
              {copied === 'code' ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-violet-400" />}
            </button>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">Shareable link</label>
          <div className="flex items-center gap-2">
            <div
              className="flex-1 flex items-center h-10 rounded-xl px-4 text-xs text-white/60 truncate"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              {referralLink}
            </div>
            <button
              onClick={() => copy(referralLink, 'link')}
              className="h-10 w-10 rounded-xl flex items-center justify-center transition-all shrink-0"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              title="Copy link"
            >
              {copied === 'link' ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
            </button>
          </div>
        </div>

        <div
          className="flex items-center gap-3 rounded-xl p-3"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <Users className="h-4 w-4 text-muted-foreground" />
          <div>
            <span className="text-lg font-black text-foreground tabular-nums">{timesUsed}</span>
            <span className="text-xs text-muted-foreground/60 ml-1.5">
              {timesUsed === 1 ? 'person' : 'people'} referred
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sign out
// ─────────────────────────────────────────────────────────────────────────────
function SignOutCard({ onSignOut }: { onSignOut: () => void }) {
  return (
    <Card title="Sign Out" icon={LogOut}>
      <p className="text-xs text-muted-foreground mb-4">Sign out of your account on this device.</p>
      <Button
        onClick={onSignOut}
        variant="outline"
        className="rounded-xl border-white/10 text-sm hover:bg-white/5"
      >
        Sign out
      </Button>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Delete account — typed-confirmation modal
// ─────────────────────────────────────────────────────────────────────────────
function DeleteAccountCard({ onDeleted }: { onDeleted: () => void }) {
  const { user } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const expected = user?.email ?? '';
  const canDelete = confirm.trim().toLowerCase() === expected.toLowerCase() && expected.length > 0;

  const handleDelete = async () => {
    if (!canDelete) return;
    setLoading(true);
    try {
      await deleteAccount();
      toast.success('Account deleted');
      setOpen(false);
      onDeleted();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete account');
      setLoading(false);
    }
  };

  return (
    <Card title="Delete Account" icon={Trash2} accent="red">
      <p className="text-xs text-muted-foreground mb-4">
        Permanently delete your account and all associated data — CVs, cover letters, tracked applications, and subscription. This cannot be undone.
      </p>
      <Dialog open={open} onOpenChange={setOpen}>
        <Button
          type="button"
          onClick={() => setOpen(true)}
          variant="outline"
          className="rounded-xl border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300"
        >
          <Trash2 className="h-3.5 w-3.5 mr-2" />
          Delete my account
        </Button>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete account?</DialogTitle>
            <DialogDescription>
              This permanently removes your account, CVs, cover letters, and any active subscription. There is no undo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Type <span className="text-foreground font-mono">{expected}</span> to confirm
            </Label>
            <Input
              type="text"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={expected}
              className="h-10 rounded-xl border-border bg-card/80 text-sm text-foreground"
              autoComplete="off"
            />
          </div>
          <DialogFooter>
            <DialogClose
              render={
                <Button type="button" variant="outline" className="rounded-xl border-white/10">
                  Cancel
                </Button>
              }
            />
            <Button
              type="button"
              onClick={handleDelete}
              disabled={!canDelete || loading}
              className="rounded-xl bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
            >
              {loading ? 'Deleting…' : 'Permanently delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
