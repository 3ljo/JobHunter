import { create } from 'zustand';
import { getMyReferralCode, getMyReferrals, getMyUsage, getProfile } from '@/lib/api';
import { Profile } from '@/types';

// Shared cache for user-scoped account data consumed by Settings and Referrals.
// Both pages were refetching the same referral code endpoint on every mount —
// bundling them here means any sequence of Settings ↔ Referrals visits within
// the TTL hits the cache with zero network calls.

export interface Referral {
  id: string;
  referred_email: string;
  referrer_reward_applied: boolean;
  referred_reward_applied: boolean;
  created_at: string;
}

export interface MonthlyUsage {
  cv_today: number;
  cv_limit: number;
  cl_today: number;
  cl_limit: number;
  month_total: number;
  total_cvs: number;
}

interface AccountState {
  referralCode: { code: string; times_used: number } | null;
  referrals: Referral[];
  myUsage: MonthlyUsage | null;
  profile: Profile | null;
  loaded: boolean;
  isLoading: boolean;

  _lastFetchedAt: number | null;
  _inFlight: Promise<void> | null;

  load: () => Promise<void>;
  refresh: () => Promise<void>;
  invalidate: () => void;
  clear: () => void;
}

const TTL_MS = 60_000;

async function runFetch(set: (partial: Partial<AccountState>) => void): Promise<void> {
  set({ isLoading: true });
  // Use allSettled so one failing endpoint doesn't blank out the others.
  const [codeRes, refRes, usageRes, profileRes] = await Promise.allSettled([
    getMyReferralCode(),
    getMyReferrals(),
    getMyUsage(),
    getProfile(),
  ]);
  set({
    referralCode: codeRes.status === 'fulfilled'
      ? { code: codeRes.value.data.referral_code.code, times_used: codeRes.value.data.referral_code.times_used || 0 }
      : null,
    referrals: refRes.status === 'fulfilled' ? (refRes.value.data.referrals || []) : [],
    myUsage: usageRes.status === 'fulfilled' ? usageRes.value.data.usage : null,
    profile: profileRes.status === 'fulfilled' ? profileRes.value.data.profile : null,
    loaded: true,
    isLoading: false,
    _lastFetchedAt: Date.now(),
  });
}

export const useAccountStore = create<AccountState>((set, get) => ({
  referralCode: null,
  referrals: [],
  myUsage: null,
  profile: null,
  loaded: false,
  isLoading: false,
  _lastFetchedAt: null,
  _inFlight: null,

  load: async () => {
    const { _lastFetchedAt, _inFlight } = get();
    if (_inFlight) return _inFlight;
    if (_lastFetchedAt && Date.now() - _lastFetchedAt < TTL_MS) return;

    const promise = runFetch(set).finally(() => set({ _inFlight: null }));
    set({ _inFlight: promise });
    return promise;
  },

  refresh: async () => {
    const { _inFlight } = get();
    if (_inFlight) return _inFlight;
    const promise = runFetch(set).finally(() => set({ _inFlight: null }));
    set({ _inFlight: promise });
    return promise;
  },

  invalidate: () => set({ _lastFetchedAt: null }),

  clear: () => set({
    referralCode: null,
    referrals: [],
    myUsage: null,
    profile: null,
    loaded: false,
    isLoading: false,
    _lastFetchedAt: null,
    _inFlight: null,
  }),
}));
