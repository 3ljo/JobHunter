'use client';

import { create } from 'zustand';

interface ThemeStore {
  theme: 'dark';
  setTheme: () => void;
}

export const useThemeStore = create<ThemeStore>(() => ({
  theme: 'dark',
  setTheme: () => {
    document.documentElement.classList.add('dark');
  },
}));
