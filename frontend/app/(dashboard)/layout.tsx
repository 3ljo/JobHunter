'use client';

import AuthGuard from '@/components/auth/AuthGuard';
import Navbar from '@/components/layout/Navbar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="relative min-h-screen bg-background">
        {/* AIvent deep ambient glow layers */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -left-80 -top-40 h-[900px] w-[900px] rounded-full bg-violet-600/[0.09] blur-[200px]" />
          <div className="absolute -right-80 -bottom-40 h-[800px] w-[800px] rounded-full bg-fuchsia-500/[0.07] blur-[180px]" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-violet-500/[0.04] blur-[140px]" />
          <div className="absolute right-1/4 top-10 h-[350px] w-[350px] rounded-full bg-indigo-600/[0.06] blur-[120px]" />
          <div className="absolute left-1/3 bottom-0 h-[300px] w-[300px] rounded-full bg-violet-400/[0.04] blur-[100px]" />
        </div>
        {/* Subtle dot grid — slightly more visible */}
        <div
          className="pointer-events-none fixed inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        {/* Top shimmer line */}
        <div className="pointer-events-none fixed inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/60 to-transparent" />
        <Navbar />
        <main className="relative mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
