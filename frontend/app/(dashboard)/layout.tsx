'use client';

import AuthGuard from '@/components/auth/AuthGuard';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import { useSidebarStore } from '@/store/sidebarStore';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const isCollapsed = useSidebarStore((s) => s.isCollapsed);

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div
          className="flex flex-1 flex-col transition-all duration-300"
          style={{ marginLeft: 0 }}
        >
          {/* Desktop margin handled via CSS media query + inline style */}
          <style>{`
            @media (min-width: 768px) {
              .main-content { margin-left: ${isCollapsed ? '4rem' : '15rem'} !important; }
            }
          `}</style>
          <div className="main-content flex flex-1 flex-col transition-all duration-300">
            <TopBar />
            <main className="flex-1 p-4 md:p-6">{children}</main>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
