'use client';

import Link from 'next/link';
import AuthGuard from '@/components/auth/AuthGuard';
import Navbar from '@/components/layout/Navbar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="relative flex min-h-screen flex-col" style={{ background: '#07091a' }}>

        {/* ── AURORA LAYER ── */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          {/* Top-left — primary violet */}
          <div className="absolute rounded-full"
            style={{
              width: 900, height: 900,
              top: -200, left: -200,
              background: 'radial-gradient(circle, rgba(118,77,240,0.45) 0%, rgba(118,77,240,0.15) 40%, transparent 70%)',
              filter: 'blur(60px)',
            }} />
          {/* Top-right — fuchsia/pink */}
          <div className="absolute rounded-full"
            style={{
              width: 700, height: 700,
              top: -100, right: -150,
              background: 'radial-gradient(circle, rgba(192,38,211,0.35) 0%, rgba(168,85,247,0.12) 45%, transparent 70%)',
              filter: 'blur(70px)',
            }} />
          {/* Center — deep indigo */}
          <div className="absolute rounded-full"
            style={{
              width: 800, height: 800,
              top: '30%', left: '25%',
              background: 'radial-gradient(circle, rgba(79,70,229,0.25) 0%, rgba(67,56,202,0.08) 50%, transparent 70%)',
              filter: 'blur(80px)',
            }} />
          {/* Bottom-right — violet */}
          <div className="absolute rounded-full"
            style={{
              width: 700, height: 700,
              bottom: -150, right: -100,
              background: 'radial-gradient(circle, rgba(139,92,246,0.30) 0%, rgba(109,40,217,0.10) 50%, transparent 70%)',
              filter: 'blur(65px)',
            }} />
          {/* Bottom-left — cyan accent */}
          <div className="absolute rounded-full"
            style={{
              width: 500, height: 500,
              bottom: 0, left: '10%',
              background: 'radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 65%)',
              filter: 'blur(70px)',
            }} />
        </div>

        {/* ── NOISE GRAIN TEXTURE ── */}
        <div
          className="pointer-events-none fixed inset-0"
          style={{
            opacity: 0.035,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
            backgroundSize: '128px 128px',
          }}
        />

        {/* ── DOT GRID ── */}
        <div
          className="pointer-events-none fixed inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.55) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            opacity: 0.04,
          }}
        />

        {/* ── TOP SHIMMER ── */}
        <div
          className="pointer-events-none fixed inset-x-0 top-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(118,77,240,0.9), transparent)' }}
        />

        <Navbar />
        <main className="relative flex-1 mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8 py-4 md:py-8">
          {children}
        </main>

        {/* ── FOOTER ── */}
        <footer
          className="relative px-6 py-5"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <Link href="/dashboard" className="shrink-0">
              <img src="/aivent/logo.png" alt="JobHunter" style={{ height: '24px', width: 'auto', opacity: 0.5 }} />
            </Link>
            <p className="text-white/20 text-xs tracking-wide" style={{ fontWeight: 400 }}>
              &copy; {new Date().getFullYear()} JobHunter
            </p>
          </div>
        </footer>
      </div>
    </AuthGuard>
  );
}
