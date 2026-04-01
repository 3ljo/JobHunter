'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { getMe } from '@/lib/api';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { token, isAuthenticated, setUser, logout, initializeAuth } = useAuthStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    const verify = async () => {
      const currentToken = useAuthStore.getState().token;
      if (!currentToken) {
        setChecking(false);
        router.replace('/login');
        return;
      }

      try {
        const res = await getMe();
        setUser(res.data.user);
        setChecking(false);
      } catch {
        logout();
        router.replace('/login');
      }
    };

    verify();
  }, [token, router, setUser, logout]);

  if (checking || (!isAuthenticated && token)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
