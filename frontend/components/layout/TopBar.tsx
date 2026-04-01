'use client';

import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/jobs': 'Find Jobs',
  '/cv': 'CV Analyzer',
  '/tracker': 'Job Tracker',
};

export default function TopBar() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const title = pageTitles[pathname] || 'JobHunter';

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-6">
      <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      <p className="text-sm text-gray-500">
        Hello, <span className="font-medium text-gray-700">{user?.email || 'User'}</span>
      </p>
    </header>
  );
}
