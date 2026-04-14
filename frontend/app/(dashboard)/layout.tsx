'use client';

import AuthGuard from '@/components/auth/AuthGuard';
import Navbar from '@/components/layout/Navbar';
import { useThemeStore } from '@/store/themeStore';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { theme } = useThemeStore();
  const dark = theme === 'dark';

  return (
    <AuthGuard>
      <div className="relative min-h-screen" style={{ background: dark ? '#07091a' : '#f6f5ff' }}>

        {/* ── AURORA LAYER (dark) / SOFT BLOBS (light) ── */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          {dark ? (
            <>
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
            </>
          ) : (
            <>
              <div className="absolute rounded-full"
                style={{
                  width: 800, height: 800,
                  top: -200, left: -200,
                  background: 'radial-gradient(circle, rgba(118,77,240,0.12) 0%, transparent 65%)',
                  filter: 'blur(60px)',
                }} />
              <div className="absolute rounded-full"
                style={{
                  width: 600, height: 600,
                  top: 0, right: -100,
                  background: 'radial-gradient(circle, rgba(192,38,211,0.09) 0%, transparent 65%)',
                  filter: 'blur(60px)',
                }} />
              <div className="absolute rounded-full"
                style={{
                  width: 600, height: 600,
                  bottom: -100, right: '20%',
                  background: 'radial-gradient(circle, rgba(79,70,229,0.10) 0%, transparent 65%)',
                  filter: 'blur(60px)',
                }} />
            </>
          )}
        </div>

        {/* ── NOISE GRAIN TEXTURE ── */}
        <div
          className="pointer-events-none fixed inset-0"
          style={{
            opacity: dark ? 0.035 : 0.025,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
            backgroundSize: '128px 128px',
          }}
        />

        {/* ── DOT GRID ── */}
        <div
          className="pointer-events-none fixed inset-0"
          style={{
            backgroundImage: dark
              ? 'radial-gradient(circle, rgba(255,255,255,0.55) 1px, transparent 1px)'
              : 'radial-gradient(circle, rgba(0,0,0,0.10) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            opacity: dark ? 0.04 : 0.06,
          }}
        />

        {/* ── TOP SHIMMER ── */}
        <div
          className="pointer-events-none fixed inset-x-0 top-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(118,77,240,0.9), transparent)' }}
        />

        <Navbar />
        <main className="relative mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
