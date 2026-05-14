import { create } from 'zustand';
import { getMyUsage, getProfile } from '@/lib/api';
import { Profile } from '@/types';

// Shared cache for user-scoped account data consumed by Settings.
// Bundling profile + monthly usage here means Settings mounts (and any future
// account-scoped views) hit the cache with zero network calls within the TTL.

export interface MonthlyUsage {
  cv_today: number;
  cv_limit: number;
  cl_today: number;
  cl_limit: number;
  month_total: number;
  total_cvs: number;
}

interface AccountState {
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
  const [usageRes, profileRes] = await Promise.allSettled([
    getMyUsage(),
    getProfile(),
  ]);
  set({
    myUsage: usageRes.status === 'fulfilled' ? usageRes.value.data.usage : null,
    profile: profileRes.status === 'fulfilled' ? profileRes.value.data.profile : null,
    loaded: true,
    isLoading: false,
    _lastFetchedAt: Date.now(),
  });
}

export const useAccountStore = create<AccountState>((set, get) => ({
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
    myUsage: null,
    profile: null,
    loaded: false,
    isLoading: false,
    _lastFetchedAt: null,
    _inFlight: null,
  }),
}));
