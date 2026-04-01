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

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  setToken: (token) => {
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
    set({ token });
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },

  initializeAuth: () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      set({ token, isLoading: true });
    } else {
      set({ isLoading: false });
    }
  },
}));
