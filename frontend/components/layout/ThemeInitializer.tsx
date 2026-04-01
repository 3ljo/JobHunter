'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/store/themeStore';

export default function ThemeInitializer() {
  const setTheme = useThemeStore((s) => s.setTheme);

  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const theme = saved || 'light';
    setTheme(theme);
  }, [setTheme]);

  return null;
}
