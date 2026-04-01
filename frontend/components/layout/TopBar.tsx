'use client';

import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useSidebarStore } from '@/store/sidebarStore';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/cv': 'CV Analyzer',
  '/tracker': 'Job Tracker',
};

export default function TopBar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { setMobileOpen } = useSidebarStore();

  const title = pageTitles[pathname] || 'JobHunter';

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-card/80 backdrop-blur-sm px-4 md:px-6">
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button
          className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
          onClick={() => setMobileOpen(true)}
        >
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <h1 className="text-base md:text-lg font-semibold text-foreground">{title}</h1>
      </div>
      <p className="text-sm text-muted-foreground hidden sm:block">
        Hello, <span className="font-medium text-foreground">{user?.email || 'User'}</span>
      </p>
    </header>
  );
}
