'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu, X, LogOut, Settings, Sun, Moon, ChevronDown } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/cv', label: 'CV Analyzer' },
  { href: '/cover-letter', label: 'Cover Letter' },
  { href: '/tracker', label: 'Tracker' },
  { href: '/cv-history', label: 'History' },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const dark = theme === 'dark';

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const navBg = dark
    ? 'rgba(13,16,48,0.85)'
    : 'rgba(255,255,255,0.85)';

  const navBorder = dark
    ? '1px solid rgba(255,255,255,0.06)'
    : '1px solid rgba(0,0,0,0.07)';

  return (
    <>
      <header
        className="sticky top-0 z-50 w-full backdrop-blur-2xl"
        style={{
          background: navBg,
          borderBottom: navBorder,
          boxShadow: dark
            ? '0 4px 30px rgba(0,0,0,0.5), inset 0 -1px 0 rgba(118,77,240,0.2)'
            : '0 4px 20px rgba(0,0,0,0.06), inset 0 -1px 0 rgba(118,77,240,0.12)',
        }}
      >
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-4 md:px-6 lg:px-8">

          {/* ── LOGO ── */}
          <Link href="/dashboard" className="flex items-center gap-3 shrink-0 group">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl font-black text-white text-sm transition-transform duration-200 group-hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #764DF0 0%, #442490 100%)',
                boxShadow: '0 0 18px rgba(118,77,240,0.5)',
              }}
            >
              JH
            </div>
            <span
              className="text-[15px] font-black tracking-tight hidden sm:block"
              style={{ color: dark ? '#fff' : '#0f0f1a' }}
            >
              Job<span style={{ color: '#764DF0' }}>Hunter</span>
            </span>
          </Link>

          {/* ── DESKTOP NAV ── */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative px-4 py-2 rounded-lg text-[13px] font-semibold transition-all duration-200"
                  style={isActive ? {
                    background: 'linear-gradient(135deg, #764DF0, #5a35d4)',
                    color: '#fff',
                    boxShadow: '0 2px 18px rgba(118,77,240,0.45), inset 0 1px 0 rgba(255,255,255,0.15)',
                  } : {
                    color: dark ? 'rgba(255,255,255,0.5)' : 'rgba(15,15,26,0.5)',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      const el = e.currentTarget as HTMLElement;
                      el.style.color = dark ? 'rgba(255,255,255,0.9)' : 'rgba(15,15,26,0.85)';
                      el.style.background = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      const el = e.currentTarget as HTMLElement;
                      el.style.color = dark ? 'rgba(255,255,255,0.5)' : 'rgba(15,15,26,0.5)';
                      el.style.background = 'transparent';
                    }
                  }}
                >
                  {item.label}
                  {isActive && (
                    <span
                      className="absolute -bottom-[1px] left-1/2 -translate-x-1/2 h-px w-4/5 rounded-full"
                      style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* ── RIGHT SIDE ── */}
          <div className="flex items-center gap-2">

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="hidden md:flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200"
              style={{ color: dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';
                el.style.color = dark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.8)';
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = 'transparent';
                el.style.color = dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
              }}
            >
              {dark ? <Sun className="h-[17px] w-[17px]" /> : <Moon className="h-[17px] w-[17px]" />}
            </button>

            {/* User dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger>
                <button
                  className="hidden md:flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-semibold transition-all duration-200 outline-none"
                  style={{
                    background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                    border: dark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
                    color: dark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.65)',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = 'rgba(118,77,240,0.4)';
                    el.style.boxShadow = '0 0 14px rgba(118,77,240,0.18)';
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
                    el.style.boxShadow = 'none';
                  }}
                >
                  {/* Avatar circle */}
                  <div
                    className="h-6 w-6 rounded-lg flex items-center justify-center text-xs font-black text-white shrink-0"
                    style={{ background: 'linear-gradient(135deg, #764DF0, #442490)' }}
                  >
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="hidden lg:block max-w-[110px] truncate">
                    {user?.email?.split('@')[0] || 'Account'}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="w-52 rounded-xl p-1"
                style={{
                  background: dark ? '#12163a' : '#ffffff',
                  border: dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                  boxShadow: dark ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 32px rgba(0,0,0,0.12)',
                }}
              >
                <div className="px-3 py-2 mb-1">
                  <p className="text-xs font-semibold truncate" style={{ color: dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
                    {user?.email || 'preview@localhost.com'}
                  </p>
                </div>
                <DropdownMenuSeparator style={{ background: dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)' }} />
                <DropdownMenuItem
                  onClick={() => router.push('/settings')}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm cursor-pointer mt-1"
                  style={{ color: dark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}
                >
                  <Settings className="h-4 w-4 opacity-60" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm cursor-pointer"
                  style={{ color: '#f87171' }}
                >
                  <LogOut className="h-4 w-4 opacity-70" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden h-9 w-9 flex items-center justify-center rounded-lg transition-all duration-200"
              style={{ color: dark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* ── MOBILE MENU ── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-x-0 z-40 backdrop-blur-2xl"
          style={{
            top: 68,
            background: dark ? 'rgba(13,16,48,0.97)' : 'rgba(255,255,255,0.97)',
            borderBottom: dark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.08)',
            boxShadow: dark ? '0 12px 40px rgba(0,0,0,0.5)' : '0 12px 40px rgba(0,0,0,0.1)',
          }}
        >
          <nav className="px-4 py-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
                  style={isActive ? {
                    background: 'linear-gradient(135deg, #764DF0, #5a35d4)',
                    color: '#fff',
                    boxShadow: '0 2px 16px rgba(118,77,240,0.4)',
                  } : {
                    color: dark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)',
                  }}
                >
                  {item.label}
                </Link>
              );
            })}

            <div className="pt-3 mt-3 space-y-1" style={{ borderTop: dark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.07)' }}>
              <button
                onClick={() => { toggleTheme(); }}
                className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all"
                style={{ color: dark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)' }}
              >
                {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {dark ? 'Light Mode' : 'Dark Mode'}
              </button>
              <Link
                href="/settings"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all"
                style={pathname === '/settings' ? {
                  background: 'linear-gradient(135deg, #764DF0, #5a35d4)',
                  color: '#fff',
                } : {
                  color: dark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)',
                }}
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
              <button
                onClick={() => { setMobileOpen(false); handleLogout(); }}
                className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all"
                style={{ color: '#f87171' }}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
