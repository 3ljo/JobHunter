'use client';

import { create } from 'zustand';

interface SidebarStore {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  toggleCollapsed: () => void;
  setMobileOpen: (open: boolean) => void;
}

export const useSidebarStore = create<SidebarStore>((set) => ({
  isCollapsed: typeof window !== 'undefined'
    ? localStorage.getItem('sidebar-collapsed') === 'true'
    : false,
  isMobileOpen: false,
  toggleCollapsed: () =>
    set((state) => {
      const next = !state.isCollapsed;
      localStorage.setItem('sidebar-collapsed', String(next));
      return { isCollapsed: next };
    }),
  setMobileOpen: (open) => set({ isMobileOpen: open }),
}));
