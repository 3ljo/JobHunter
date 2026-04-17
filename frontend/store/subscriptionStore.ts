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
  fetchSubscription: () => Promise<void>;
  bumpLocalUsage: (feature: 'cv' | 'cover_letter' | 'mock_interview') => void;
  clear: () => void;
}

const emptyUsage = (): UsageSnapshot => ({
  cv:             { used: 0, limit: 3, remaining: 3 },
  cover_letter:   { used: 0, limit: 5, remaining: 5 },
  mock_interview: { used: 0, limit: 0, remaining: 0 },
  resetsAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
});

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  subscription: null,
  limits: null,
  usage: null,
  isLoading: false,

  fetchSubscription: async () => {
    set({ isLoading: true });
    try {
      const res = await getSubscription();
      set({
        subscription: res.data.subscription,
        limits: res.data.limits,
        usage: res.data.usage ?? emptyUsage(),
        isLoading: false,
      });
    } catch {
      set({
        subscription: { plan: 'free', status: 'active', billing_interval: null, current_period_end: null, cancel_at_period_end: false },
        limits: { cv_limit: 3, cl_limit: 5, mi_limit: 0 },
        usage: emptyUsage(),
        isLoading: false,
      });
    }
  },

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

  clear: () => set({ subscription: null, limits: null, usage: null, isLoading: false }),
}));
