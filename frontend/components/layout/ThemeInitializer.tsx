'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/store/themeStore';

export default function ThemeInitializer() {
  const { setTheme } = useThemeStore();

  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const theme = saved || 'dark';
    setTheme(theme);
  }, [setTheme]);

  return null;
}
