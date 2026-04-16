'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { getMe } from '@/lib/api';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, token, isAuthenticated } = useAuthStore();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const { user: currentUser, initializeAuth, setUser, logout } = useAuthStore.getState();

    // Already authenticated (e.g. just logged in and navigated here)
    if (currentUser) return;

    // Load token from localStorage
    initializeAuth();

    const storedToken = useAuthStore.getState().token;
    if (!storedToken) {
      router.replace('/login');
      return;
    }

    // Validate token with backend
    getMe()
      .then((res) => setUser(res.data.user))
      .catch(() => {
        logout();
        router.replace('/login');
      });
  }, [router]);

  // Already authenticated from login flow — render immediately
  if (isAuthenticated && user) {
    return <>{children}</>;
  }

  // No token at all — will redirect
  if (!token && initialized.current) {
    return null;
  }

  // Loading state — show AIvent preloader
  return (
    <div
      style={{
        position: 'fixed',
        zIndex: 20000,
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: '#07091a',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div className="lds-roller">
        <div /><div /><div /><div /><div /><div /><div /><div />
      </div>
    </div>
  );
}
