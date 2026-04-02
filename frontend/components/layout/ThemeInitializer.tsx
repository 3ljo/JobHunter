'use client';

import { useEffect } from 'react';

export default function ThemeInitializer() {
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return null;
}
