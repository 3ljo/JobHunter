'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu, X, LogOut, Settings, ChevronDown, Crown, Gift } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';

const navItems = [
  { href: '/dashboard',    label: 'Dashboard'    },
  { href: '/cv',           label: 'CV Analyzer'  },
  { href: '/cover-letter', label: 'Cover Letter' },
  { href: '/interview',    label: 'Interview', badge: 'PRO+' },
  { href: '/tracker',      label: 'Tracker'      },
  { href: '/cv-history',   label: 'History'      },
];

export default function Navbar() {
  const pathname   = usePathname();
  const router     = useRouter();
  const { user, logout }      = useAuthStore();
  const { subscription, fetchSubscription } = useSubscriptionStore();
  const [scrolled,    setScrolled]    = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const planLabel = subscription?.plan === 'pro_plus' ? 'Pro+' : subscription?.plan === 'pro' ? 'Pro' : 'Free';
  const planColor = subscription?.plan === 'pro_plus' ? '#c084fc' : subscription?.plan === 'pro' ? '#764DF0' : 'rgba(255,255,255,0.4)';
  const planBg = subscription?.plan === 'pro_plus' ? 'rgba(192,132,252,0.15)' : subscription?.plan === 'pro' ? 'rgba(118,77,240,0.15)' : 'rgba(255,255,255,0.06)';

  /* scroll detection — same as landing page */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <>
      {/* ══ HEADER ══ */}
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={
          scrolled
            ? {
                background: 'rgba(16,20,53,0.93)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
              }
            : {
                background: 'rgba(16,20,53,0.72)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }
        }
      >
        <div className="mx-auto flex h-[96px] max-w-7xl items-center justify-between px-6">

          {/* ── LOGO ── */}
          <Link href="/dashboard" className="flex-shrink-0">
            <img
              src="/aivent/logo.png"
              alt="CvClimber"
              style={{ height: '64px', width: 'auto' }}
            />
          </Link>

          {/* ── DESKTOP NAV ── */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative px-4 py-2 text-sm font-semibold transition-colors duration-200 inline-flex items-center gap-1.5"
                  style={{
                    color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
                    letterSpacing: '0.01em',
                  }}
                >
                  {item.label}
                  {item.badge && (
                    <span
                      className="text-[9px] font-black px-1.5 py-0.5 rounded"
                      style={{ background: 'rgba(192,132,252,0.15)', color: '#c084fc', border: '1px solid rgba(192,132,252,0.3)' }}
                    >
                      {item.badge}
                    </span>
                  )}
                  {/* violet underline — same scaleX transition as landing page */}
                  <span
                    className="absolute left-4 right-4 transition-all duration-300"
                    style={{
                      bottom: '0px',
                      height: '2px',
                      background: '#764DF0',
                      opacity: isActive ? 1 : 0,
                      transform: isActive ? 'scaleX(1)' : 'scaleX(0)',
                      transformOrigin: 'center',
                    }}
                  />
                </Link>
              );
            })}
          </nav>

          {/* ── RIGHT SIDE ── */}
          <div className="flex items-center gap-2">

            {/* Language switcher */}
            <LanguageSwitcher />

            {/* User dropdown — styled like landing page CTA area */}
            <DropdownMenu>
              <DropdownMenuTrigger
                className="hidden md:flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-bold transition-all duration-200 outline-none"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.75)',
                  letterSpacing: '0.01em',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = 'rgba(255,255,255,0.1)';
                  el.style.borderColor = 'rgba(118,77,240,0.45)';
                  el.style.color = '#fff';
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = 'rgba(255,255,255,0.06)';
                  el.style.borderColor = 'rgba(255,255,255,0.1)';
                  el.style.color = 'rgba(255,255,255,0.75)';
                }}
              >
                {/* Avatar */}
                <div
                  className="h-6 w-6 rounded-md flex items-center justify-center text-xs font-black text-white shrink-0"
                  style={{ background: 'linear-gradient(135deg,#764DF0,#442490)' }}
                >
                  {user?.email?.charAt(0).toUpperCase() ?? 'U'}
                </div>
                <span className="hidden lg:block max-w-[100px] truncate">
                  {user?.email?.split('@')[0] ?? 'Account'}
                </span>
                <span
                  className="hidden lg:block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                  style={{ background: planBg, color: planColor }}
                >
                  {planLabel}
                </span>
                <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="w-52 rounded-xl p-1"
                style={{
                  background: '#12163a',
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                }}
              >
                <div className="px-3 py-2 mb-1">
                  <p className="text-xs font-semibold truncate text-white/40">
                    {user?.email ?? ''}
                  </p>
                </div>
                <DropdownMenuSeparator style={{ background: 'rgba(255,255,255,0.07)' }} />
                <DropdownMenuItem
                  onClick={() => router.push('/referrals')}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm cursor-pointer mt-1 text-white/70 hover:text-white"
                >
                  <Gift className="h-4 w-4 opacity-60" />
                  Referrals
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push('/pricing')}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm cursor-pointer text-white/70 hover:text-white"
                >
                  <Crown className="h-4 w-4 opacity-60" />
                  Pricing
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push('/settings')}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm cursor-pointer text-white/70 hover:text-white"
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

            {/* Mobile hamburger — same as landing page */}
            <button
              className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg text-white/70 hover:text-white transition-colors"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* ── MOBILE DROPDOWN ── same style as landing page */}
        {mobileOpen && (
          <div
            className="lg:hidden px-6 pb-6 pt-2"
            style={{
              background: 'rgba(16,20,53,0.97)',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 py-3 text-sm font-semibold border-b transition-colors duration-200"
                  style={{
                    color: isActive ? '#764DF0' : 'rgba(255,255,255,0.7)',
                    borderColor: 'rgba(255,255,255,0.06)',
                  }}
                >
                  {item.label}
                  {item.badge && (
                    <span
                      className="text-[9px] font-black px-1.5 py-0.5 rounded"
                      style={{ background: 'rgba(192,132,252,0.15)', color: '#c084fc', border: '1px solid rgba(192,132,252,0.3)' }}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}

            <div className="mt-5 space-y-2">
              <Link
                href="/referrals"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 py-3 text-sm font-semibold text-white/55 hover:text-white transition-colors"
              >
                <Gift className="h-4 w-4" />
                Referrals
              </Link>
              <Link
                href="/pricing"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 py-3 text-sm font-semibold text-white/55 hover:text-white transition-colors"
              >
                <Crown className="h-4 w-4" />
                Pricing
              </Link>
              <Link
                href="/settings"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 py-3 text-sm font-semibold text-white/55 hover:text-white transition-colors"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
              <button
                onClick={() => { setMobileOpen(false); handleLogout(); }}
                className="flex w-full items-center gap-3 py-3 text-sm font-semibold transition-colors"
                style={{ color: '#f87171' }}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        )}
      </header>

      {/* spacer so content doesn't hide under fixed navbar */}
      <div style={{ height: '72px' }} />
    </>
  );
}
