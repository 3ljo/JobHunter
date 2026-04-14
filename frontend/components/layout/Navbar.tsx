'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LayoutDashboard, FileSearch, History, Kanban, Menu, X, LogOut, FileSignature, Settings, Sun, Moon } from 'lucide-react';
import { useThemeStore } from '@/store/themeStore';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/cv', label: 'CV Analyzer', icon: FileSearch },
  { href: '/cover-letter', label: 'Cover Letter', icon: FileSignature },
  { href: '/tracker', label: 'Tracker', icon: Kanban },
  { href: '/cv-history', label: 'History', icon: History },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6 lg:px-8">

        {/* Logo */}
        <Link href="/cv" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-md shadow-violet-500/20 transition-shadow group-hover:shadow-lg group-hover:shadow-violet-500/30">
            <span className="text-sm font-black text-white leading-none">JH</span>
          </div>
          <span className="text-base font-bold text-foreground hidden sm:block tracking-tight">JobHunter</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center">
          <div className="flex items-center rounded-xl bg-card/80 border border-border/50 p-1 gap-0.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-600 transition-all ${
                    isActive
                      ? 'bg-violet-600 text-white shadow-sm shadow-violet-500/30'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
                  }`}
                >
                  <item.icon className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="hidden md:flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger className="hidden md:flex items-center gap-2 rounded-lg border border-border/50 bg-card/60 px-2.5 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-card hover:border-violet-500/30 transition-all cursor-pointer group">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="bg-violet-600/25 text-violet-300 text-xs font-700">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="hidden lg:block text-xs font-600 max-w-[120px] truncate">{user?.email?.split('@')[0] || 'Account'}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 border-border/60 bg-card">
              <DropdownMenuItem onClick={() => router.push('/settings')} className="cursor-pointer font-500">
                <Settings className="h-4 w-4 mr-2 text-muted-foreground" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="text-red-400 cursor-pointer font-500">
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile hamburger */}
          <button
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/60 bg-background/95 backdrop-blur-xl">
          <nav className="flex flex-col px-4 py-3 gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-600 transition-all ${
                    isActive
                      ? 'text-white bg-violet-600 shadow-sm shadow-violet-500/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <div className="border-t border-border/60 mt-2 pt-2 space-y-1">
              <button
                onClick={toggleTheme}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-600 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
              <Link
                href="/settings"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-600 transition-all ${
                  pathname === '/settings'
                    ? 'text-white bg-violet-600'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                }`}
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
              <button
                onClick={() => { setMobileOpen(false); handleLogout(); }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-600 text-red-400 hover:bg-accent/50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign out</span>
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
