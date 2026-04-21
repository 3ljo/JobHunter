import { create } from 'zustand';
import { Subscription } from '@/types';
import { getSubscription } from '@/lib/api';

export interface UsageBucket {
  used: number;
  limit: number;
  remaining: number;
}

export interface UsageSnapshot {
  cv: UsageBucket;
  cover_letter: UsageBucket;
  mock_interview: UsageBucket;
  resetsAt: string;
}

interface SubscriptionState {
  subscription: Subscription | null;
  limits: { cv_limit: number; cl_limit: number; mi_limit?: number } | null;
  usage: UsageSnapshot | null;
  isLoading: boolean;

  // Internal cache bookkeeping — not meant for components
  _lastFetchedAt: number | null;
  _inFlight: Promise<void> | null;

  // Idempotent loader: no-op if fresh, shared promise if one is in flight,
  // network fetch otherwise. Safe to call from every component that mounts.
  fetchSubscription: () => Promise<void>;

  // Force a refetch regardless of cache (use after mutations that change usage)
  refresh: () => Promise<void>;

  // Drop the cache so the next fetchSubscription() goes to network
  invalidate: () => void;

  bumpLocalUsage: (feature: 'cv' | 'cover_letter' | 'mock_interview') => void;
  clear: () => void;
}

const TTL_MS = 60_000;

const emptyUsage = (): UsageSnapshot => ({
  cv:             { used: 0, limit: 3, remaining: 3 },
  cover_letter:   { used: 0, limit: 5, remaining: 5 },
  mock_interview: { used: 0, limit: 0, remaining: 0 },
  resetsAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
});

async function runFetch(set: (partial: Partial<SubscriptionState>) => void): Promise<void> {
  set({ isLoading: true });
  try {
    const res = await getSubscription();
    set({
      subscription: res.data.subscription,
      limits: res.data.limits,
      usage: res.data.usage ?? emptyUsage(),
      isLoading: false,
      _lastFetchedAt: Date.now(),
    });
  } catch {
    set({
      subscription: { plan: 'free', status: 'active', billing_interval: null, current_period_end: null, cancel_at_period_end: false },
      limits: { cv_limit: 3, cl_limit: 5, mi_limit: 0 },
      usage: emptyUsage(),
      isLoading: false,
      _lastFetchedAt: Date.now(),
    });
  }
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  subscription: null,
  limits: null,
  usage: null,
  isLoading: false,
  _lastFetchedAt: null,
  _inFlight: null,

  fetchSubscription: async () => {
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

  // Optimistically increment local usage after a successful analysis.
  bumpLocalUsage: (feature) => {
    const state = get();
    if (!state.usage) return;
    const bucket = state.usage[feature];
    const next: UsageSnapshot = {
      ...state.usage,
      [feature]: {
        used: bucket.used + 1,
        limit: bucket.limit,
        remaining: Math.max(0, bucket.remaining - 1),
      },
    };
    set({ usage: next });
  },

  clear: () => set({
    subscription: null,
    limits: null,
    usage: null,
    isLoading: false,
    _lastFetchedAt: null,
    _inFlight: null,
  }),
}));
