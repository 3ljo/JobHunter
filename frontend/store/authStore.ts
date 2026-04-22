import { create } from 'zustand';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
  initializeAuth: () => void;
}

// Clear sibling stores' caches when the session changes — prevents the
// previous user's plan/profile from leaking into the new session for ~1 min
// (previously surfaced as "FREE for 2 minutes after login as Pro").
async function clearSessionCaches() {
  // Lazy-import to avoid a require cycle with stores that import api.ts.
  const [{ useSubscriptionStore }, { useAccountStore }, { useDashboardStore }] = await Promise.all([
    import('@/store/subscriptionStore'),
    import('@/store/accountStore'),
    import('@/store/dashboardStore'),
  ]);
  useSubscriptionStore.getState().clear();
  useAccountStore.getState().clear();
  useDashboardStore.getState().clear?.();
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),

  setToken: (token) => {
    const prev = get().token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
    set({ token });
    // If the identity changed, wipe sibling caches so we don't show stale data.
    if (prev !== token) {
      void clearSessionCaches();
    }
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    void clearSessionCaches();
  },

  initializeAuth: () => {
    const { user } = useAuthStore.getState();
    if (user) {
      set({ isLoading: false });
      return;
    }
    const token = localStorage.getItem('auth_token');
    if (token) {
      set({ token, isLoading: true });
    } else {
      set({ isLoading: false });
    }
  },
}));
