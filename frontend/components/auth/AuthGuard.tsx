'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { getMe } from '@/lib/api';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  // AUTH DISABLED FOR LOCAL PREVIEW — inject fake user so UI renders fully
  const { setUser } = useAuthStore();
  useEffect(() => {
    setUser({ id: 'preview', email: 'preview@localhost.com' } as any);
  }, [setUser]);
  return <>{children}</>;
}
