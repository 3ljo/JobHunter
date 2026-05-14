import { create } from 'zustand';
import { User } from '@/types';

// Auth store with dual-transport session.
//
// Primary transport: httpOnly `auth_token` cookie set by the backend
// on /api/auth/login. Backend reads it via requireAuth.
//
// Fallback transport: the access_token returned in the login response
// body, kept in this store and echoed as `Authorization: Bearer <t>`
// on every API call by the axios request interceptor (see lib/api.ts).
// Required because mobile Safari/Chrome and (since 2024) desktop
// Chrome all block third-party cookies by default — the cvclimber.lol
// frontend → onrender.com backend cookie never makes it back, every
// authed call 401s, and the response interceptor bounces the user to
// /login. The Bearer header survives third-party cookie blocking.
//
// The token is persisted to localStorage so a page reload doesn't
// silently log the user out. This widens the XSS blast radius
// vs. an httpOnly-only cookie, but the cookie-only model isn't
// reachable cross-site on modern browsers without a same-parent-
// domain backend, which we don't have yet (see SECURITY-HARDENING.md
// section 3 — `api.cvclimber.lol`).

const TOKEN_STORAGE_KEY = 'cvclimber_access_token';

function loadStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function persistToken(token: string | null) {
  if (typeof window === 'undefined') return;
  try {
    if (token) window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    else window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    /* localStorage unavailable (private mode, quota) — Bearer fallback
       just won't survive reload; cookie path still has a chance */
  }
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setSession: (user: User | null, accessToken?: string | null) => void;
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
  accessToken: loadStoredToken(),
  isLoading: true,
  isAuthenticated: false,

  setSession: (user, accessToken) => {
    const prevUser = get().user;
    const nextToken = accessToken === undefined ? get().accessToken : accessToken;
    persistToken(nextToken ?? null);
    set({
      user,
      accessToken: nextToken ?? null,
      isAuthenticated: !!user,
      isLoading: false,
    });
    if (prevUser?.id !== user?.id) {
      void clearSessionCaches();
    }
  },

  setUser: (user) => {
    get().setSession(user);
  },

  logout: () => {
    persistToken(null);
    set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
    void clearSessionCaches();
  },
}));
