'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AdminGuard from '@/components/admin/AdminGuard';
import { LayoutDashboard, Users, BarChart3, Settings, ArrowLeft, Menu, X, Tag, Gift } from 'lucide-react';

const NAV = [
  { href: '/bosi', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/bosi/users', label: 'Users', icon: Users },
  { href: '/bosi/usage', label: 'Usage & Costs', icon: BarChart3 },
  { href: '/bosi/promos', label: 'Promo Codes', icon: Tag },
  { href: '/bosi/referrals', label: 'Referrals', icon: Gift },
  { href: '/bosi/settings', label: 'Settings', icon: Settings },
] as const;

export default function BosiLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navContent = (
    <>
      {/* Logo */}
      <div className="mb-8 px-2">
        <div className="flex items-center gap-2.5">
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-black"
            style={{ background: 'rgba(118,77,240,0.25)', color: '#a78bfa', border: '1px solid rgba(118,77,240,0.4)' }}
          >
            B
          </div>
          <div>
            <p className="text-white text-sm font-bold tracking-tight">Bosi Panel</p>
            <p className="text-white/50 text-[10px] uppercase tracking-widest font-semibold">Admin</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {NAV.map((item) => {
          const active = pathname === item.href || (item.href !== '/bosi' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
              style={{
                color: active ? '#fff' : 'rgba(255,255,255,0.6)',
                background: active ? 'rgba(118,77,240,0.2)' : 'transparent',
                borderLeft: active ? '2px solid #764DF0' : '2px solid transparent',
              }}
            >
              <item.icon className="h-4 w-4" style={{ color: active ? '#a78bfa' : 'rgba(255,255,255,0.4)' }} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Back to app */}
      <Link
        href="/dashboard"
        className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors"
        style={{ color: 'rgba(255,255,255,0.45)' }}
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to App
      </Link>
    </>
  );

  return (
    <AdminGuard>
      <div className="flex min-h-screen" style={{ background: '#0f1225' }}>

        {/* Desktop Sidebar */}
        <aside
          className="hidden md:flex fixed top-0 left-0 h-screen w-60 flex-col py-6 px-4"
          style={{
            background: '#161937',
            borderRight: '1px solid rgba(255,255,255,0.10)',
            zIndex: 50,
          }}
        >
          {navContent}
        </aside>

        {/* Mobile overlay */}
        {mobileOpen && (
          <div
            className="md:hidden fixed inset-0"
            style={{ background: 'rgba(0,0,0,0.6)', zIndex: 55 }}
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Mobile Sidebar */}
        <aside
          className="md:hidden fixed top-0 left-0 h-screen w-64 flex flex-col py-6 px-4 transition-transform duration-300"
          style={{
            background: '#161937',
            borderRight: '1px solid rgba(255,255,255,0.10)',
            zIndex: 60,
            transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          }}
        >
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute top-4 right-4 text-white/40 hover:text-white/80"
          >
            <X className="h-5 w-5" />
          </button>
          {navContent}
        </aside>

        {/* Main content */}
        <main className="md:ml-60 flex-1 min-h-screen w-full">
          {/* Top bar */}
          <div
            className="sticky top-0 h-14 flex items-center px-4 md:px-8 gap-3"
            style={{
              background: 'rgba(15,18,37,0.92)',
              backdropFilter: 'blur(12px)',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              zIndex: 40,
            }}
          >
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden text-white/60 hover:text-white/90"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-white/80 text-sm font-semibold uppercase tracking-widest">
              {NAV.find((n) => n.href === pathname || (n.href !== '/bosi' && pathname.startsWith(n.href)))?.label || 'Dashboard'}
            </h1>
          </div>

          <div className="p-4 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </AdminGuard>
  );
}
