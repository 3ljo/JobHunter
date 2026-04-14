'use client';

import AuthGuard from '@/components/auth/AuthGuard';
import Navbar from '@/components/layout/Navbar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="relative min-h-screen bg-background">
        {/* AIvent-style ambient background */}
        <div className="pointer-events-none fixed inset-0">
          <div className="absolute -left-60 top-0 h-[700px] w-[700px] rounded-full bg-violet-600/[0.06] blur-[160px]" />
          <div className="absolute -right-60 bottom-0 h-[600px] w-[600px] rounded-full bg-fuchsia-500/[0.04] blur-[140px]" />
          <div className="absolute left-1/2 top-1/3 -translate-x-1/2 h-[400px] w-[400px] rounded-full bg-violet-500/[0.03] blur-[100px]" />
        </div>
        {/* Subtle dot grid */}
        <div
          className="pointer-events-none fixed inset-0 opacity-[0.02]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <Navbar />
        <main className="relative mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
