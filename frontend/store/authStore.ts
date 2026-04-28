import { create } from 'zustand';
import { User } from '@/types';

// In-memory only auth store.
//
// The session token is held by the backend in an httpOnly cookie
// (set by /api/auth/login). The cookie is sent automatically by the
// browser on every same-site/cross-origin XHR with `withCredentials`,
// so the SPA NEVER sees the token directly. This makes any XSS
// considerably harder to weaponize — there's no token to exfiltrate
// from localStorage.
//
// `isAuthenticated` is the sole "are we logged in?" signal here. We
// check it on app boot by hitting /api/auth/me; if the server says
// yes, we're in. There is no token to persist or restore.

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}

async function clearSessionCaches() {
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
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) => {
    const prevUser = get().user;
    set({ user, isAuthenticated: !!user, isLoading: false });
    // If the identity changed, wipe sibling caches so we don't
    // surface the previous user's plan/profile briefly after login.
    if (prevUser?.id !== user?.id) {
      void clearSessionCaches();
    }
  },

  logout: () => {
    set({ user: null, isAuthenticated: false, isLoading: false });
    void clearSessionCaches();
  },
}));
