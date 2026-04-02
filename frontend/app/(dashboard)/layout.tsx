'use client';

import AuthGuard from '@/components/auth/AuthGuard';
import Navbar from '@/components/layout/Navbar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="relative min-h-screen bg-background">
        {/* Subtle ambient background */}
        <div className="pointer-events-none fixed inset-0">
          <div className="absolute -left-40 top-0 h-[600px] w-[600px] rounded-full bg-violet-600/[0.03] blur-[120px]" />
          <div className="absolute -right-40 bottom-0 h-[500px] w-[500px] rounded-full bg-fuchsia-500/[0.02] blur-[100px]" />
        </div>
        <Navbar />
        <main className="relative mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
