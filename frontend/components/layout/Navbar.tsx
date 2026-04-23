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

const navItems = [
  { href: '/dashboard',    label: 'Dashboard'    },
  { href: '/cv',           label: 'CV Analyzer'  },
  { href: '/create-cv',    label: 'Create CV'    },
  { href: '/cover-letter', label: 'Cover Letter' },
  { href: '/interview',    label: 'Interview', badge: 'PRO VOICE' },
  { href: '/tracker',      label: 'Tracker'      },
  { href: '/cv-history',   label: 'History'      },
];

const NAV_HEIGHT = 72;

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

  // Only derive the visible badge once we actually know the plan — otherwise
  // a null subscription would flash "Free" on first render for paid users.
  const planReady = !!subscription;
  const rawPlan = subscription?.plan;
  // `pro_plus` is a legacy alias for `pro_voice`.
  const isProVoice = rawPlan === 'pro_voice' || rawPlan === 'pro_plus';
  const isPro = rawPlan === 'pro';
  const isStarter = rawPlan === 'starter';
  const planLabel = isProVoice ? 'Pro Voice' : isPro ? 'Pro' : isStarter ? '7-Day Pass' : 'Free';
  const planColor = isProVoice ? '#c084fc' : isPro ? '#764DF0' : isStarter ? '#34d399' : 'rgba(255,255,255,0.5)';
  const planBg = isProVoice ? 'rgba(192,132,252,0.18)' : isPro ? 'rgba(118,77,240,0.18)' : isStarter ? 'rgba(52,211,153,0.18)' : 'rgba(255,255,255,0.08)';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Transparent when idle; when scrolled, add a barely-there tint + hairline.
  // The backdrop blur is always on so content behind the bar stays legible.
  const headerStyle: React.CSSProperties = scrolled
    ? {
        background: 'rgba(10,13,40,0.35)',
        backdropFilter: 'blur(14px) saturate(140%)',
        WebkitBackdropFilter: 'blur(14px) saturate(140%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }
    : {
        background: 'transparent',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderBottom: '1px solid transparent',
      };

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={headerStyle}
      >
        <div
          className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6"
          style={{ height: NAV_HEIGHT }}
        >

          {/* ── LOGO ── */}
          <Link href="/dashboard" className="flex-shrink-0 flex items-center">
            <img
              src="/aivent/logo.png"
              alt="CvClimber"
              style={{ height: '40px', width: 'auto' }}
            />
          </Link>

          {/* ── DESKTOP NAV — floating glass pill ── */}
          <nav
            className="hidden lg:flex items-center gap-1 rounded-full px-1.5 py-1.5"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
            }}
          >
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const badge = 'badge' in item ? item.badge : undefined;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-all duration-200"
                  style={{
                    color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
                    background: isActive
                      ? 'linear-gradient(135deg, rgba(118,77,240,0.95), rgba(139,92,246,0.85))'
                      : 'transparent',
                    boxShadow: isActive
                      ? '0 4px 14px rgba(118,77,240,0.35), inset 0 1px 0 rgba(255,255,255,0.15)'
                      : 'none',
                    letterSpacing: '0.005em',
                  }}
                  onMouseEnter={e => {
                    if (isActive) return;
                    (e.currentTarget as HTMLElement).style.color = '#fff';
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
                  }}
                  onMouseLeave={e => {
                    if (isActive) return;
                    (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.6)';
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }}
                >
                  {item.label}
                  {badge && (
                    <span
                      className="text-[9px] font-black px-1.5 py-0.5 rounded"
                      style={{ background: 'rgba(192,132,252,0.15)', color: '#c084fc', border: '1px solid rgba(192,132,252,0.3)' }}
                    >
                      {badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* ── RIGHT SIDE ── */}
          <div className="flex items-center gap-2">

            {/* User pill — rounded-full, glass */}
            <DropdownMenu>
              <DropdownMenuTrigger
                className="hidden md:flex items-center gap-2 rounded-full pl-1 pr-3 py-1 text-[13px] font-semibold transition-all duration-200 outline-none"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  color: 'rgba(255,255,255,0.85)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = 'rgba(255,255,255,0.07)';
                  el.style.borderColor = 'rgba(118,77,240,0.35)';
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = 'rgba(255,255,255,0.04)';
                  el.style.borderColor = 'rgba(255,255,255,0.07)';
                }}
              >
                {/* Circular avatar */}
                <div
                  className="h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-black text-white shrink-0"
                  style={{
                    background: 'linear-gradient(135deg,#764DF0,#442490)',
                    boxShadow: '0 2px 8px rgba(118,77,240,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
                  }}
                >
                  {user?.email?.charAt(0).toUpperCase() ?? 'U'}
                </div>
                {planReady ? (
                  <span
                    className="hidden lg:block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                    style={{ background: planBg, color: planColor, letterSpacing: '0.08em' }}
                  >
                    {planLabel}
                  </span>
                ) : (
                  <span
                    className="hidden lg:block h-4 w-10 rounded-full animate-pulse"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  />
                )}
                <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                sideOffset={10}
                className="w-56 rounded-2xl p-1.5"
                style={{
                  background: 'rgba(16,20,53,0.92)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  boxShadow: '0 16px 48px rgba(0,0,0,0.55)',
                }}
              >
                <div className="px-3 py-2">
                  <p className="text-[11px] text-white/35 font-medium mb-0.5">Signed in as</p>
                  <p className="text-xs font-semibold truncate text-white/90">
                    {user?.email ?? ''}
                  </p>
                </div>
                <DropdownMenuSeparator style={{ background: 'rgba(255,255,255,0.06)' }} />
                <DropdownMenuItem
                  onClick={() => router.push('/referrals')}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm cursor-pointer mt-1 text-white/75 hover:text-white focus:text-white"
                >
                  <Gift className="h-4 w-4 opacity-70" style={{ color: '#34d399' }} />
                  Refer &amp; earn
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push('/pricing')}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm cursor-pointer text-white/75 hover:text-white focus:text-white"
                >
                  <Crown className="h-4 w-4 opacity-70" />
                  Pricing
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push('/settings')}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm cursor-pointer text-white/75 hover:text-white focus:text-white"
                >
                  <Settings className="h-4 w-4 opacity-70" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator style={{ background: 'rgba(255,255,255,0.06)', margin: '6px 0' }} />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm cursor-pointer"
                  style={{ color: '#f87171' }}
                >
                  <LogOut className="h-4 w-4 opacity-80" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile hamburger — rounded-full to match pill language */}
            <button
              className="lg:hidden flex items-center justify-center w-10 h-10 rounded-full text-white/80 hover:text-white transition-colors"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
              }}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* ── MOBILE DROPDOWN ── */}
        {mobileOpen && (
          <div
            className="lg:hidden px-4 sm:px-6 pb-5 pt-2"
            style={{
              background: 'rgba(10,13,40,0.92)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="flex flex-col gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const badge = 'badge' in item ? item.badge : undefined;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all"
                    style={{
                      color: isActive ? '#fff' : 'rgba(255,255,255,0.7)',
                      background: isActive
                        ? 'linear-gradient(135deg, rgba(118,77,240,0.9), rgba(139,92,246,0.75))'
                        : 'transparent',
                      boxShadow: isActive ? '0 4px 14px rgba(118,77,240,0.3)' : 'none',
                    }}
                  >
                    {item.label}
                    {badge && (
                      <span
                        className="text-[9px] font-black px-1.5 py-0.5 rounded"
                        style={{ background: 'rgba(192,132,252,0.15)', color: '#c084fc', border: '1px solid rgba(192,132,252,0.3)' }}
                      >
                        {badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            <div className="mt-4 pt-4 space-y-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <Link
                href="/referrals"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/70 hover:text-white hover:bg-white/[0.04] transition-all"
              >
                <Gift className="h-4 w-4" style={{ color: '#34d399' }} />
                Refer &amp; earn
              </Link>
              <Link
                href="/pricing"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/70 hover:text-white hover:bg-white/[0.04] transition-all"
              >
                <Crown className="h-4 w-4" />
                Pricing
              </Link>
              <Link
                href="/settings"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/70 hover:text-white hover:bg-white/[0.04] transition-all"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
              <button
                onClick={() => { setMobileOpen(false); handleLogout(); }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all hover:bg-red-500/10"
                style={{ color: '#f87171' }}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        )}
      </header>

      {/* spacer so content doesn't hide under the fixed bar */}
      <div style={{ height: NAV_HEIGHT }} />
    </>
  );
}
