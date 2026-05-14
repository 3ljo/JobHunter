'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { getMe } from '@/lib/api';

// AuthGuard now relies entirely on the httpOnly session cookie. It
// can't see the token; it can only ask the backend who we are. If
// /api/auth/me succeeds, we're logged in. If it 401s, we're not —
// kick to /login.
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const { user: currentUser, setUser, logout } = useAuthStore.getState();

    if (currentUser) return;

    getMe()
      .then((res) => setUser(res.data.user))
      .catch(() => {
        logout();
        router.replace('/login');
      });
  }, [router]);

  if (isAuthenticated && user) {
    return <>{children}</>;
  }

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
