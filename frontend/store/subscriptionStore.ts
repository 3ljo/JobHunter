import { create } from 'zustand';
import { Subscription } from '@/types';
import { getSubscription } from '@/lib/api';

interface SubscriptionState {
  subscription: Subscription | null;
  limits: { cv_limit: number; cl_limit: number } | null;
  isLoading: boolean;
  fetchSubscription: () => Promise<void>;
  clear: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  subscription: null,
  limits: null,
  isLoading: false,

  fetchSubscription: async () => {
    set({ isLoading: true });
    try {
      const res = await getSubscription();
      set({
        subscription: res.data.subscription,
        limits: res.data.limits,
        isLoading: false,
      });
    } catch {
      set({
        subscription: { plan: 'free', status: 'active', billing_interval: null, current_period_end: null, cancel_at_period_end: false },
        limits: { cv_limit: 3, cl_limit: 5 },
        isLoading: false,
      });
    }
  },

  clear: () => set({ subscription: null, limits: null, isLoading: false }),
}));
