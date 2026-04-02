'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/authStore';
import { changePassword } from '@/lib/api';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Settings, Lock, LogOut, Mail, Shield } from 'lucide-react';

export default function SettingsPage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

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
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 ring-1 ring-violet-500/20">
          <Settings className="h-4 w-4 text-violet-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Settings</h1>
          <p className="text-muted-foreground text-xs">Manage your account</p>
        </div>
      </div>

      {/* Account Info */}
      <div className="rounded-2xl border border-border bg-card/70 p-6 space-y-4">
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
      <div className="rounded-2xl border border-border bg-card/70 p-6">
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
                type="password"
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-10 rounded-xl border-border bg-card/80 pl-10 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20"
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Confirm New Password</Label>
            <div className="group relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 transition-colors group-focus-within:text-violet-400" />
              <Input
                type="password"
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-10 rounded-xl border-border bg-card/80 pl-10 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20"
                required
              />
            </div>
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="h-10 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-violet-500/20 active:scale-[0.98]"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Updating...
              </span>
            ) : (
              'Update Password'
            )}
          </Button>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="rounded-2xl border border-red-500/10 bg-card/70 p-6">
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
