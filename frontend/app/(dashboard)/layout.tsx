'use client';

import AuthGuard from '@/components/auth/AuthGuard';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="ml-60 flex flex-1 flex-col">
          <TopBar />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
