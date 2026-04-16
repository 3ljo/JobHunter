'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { checkAdmin } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { token } = useAuthStore();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!token) {
      const stored = localStorage.getItem('auth_token');
      if (!stored) { router.replace('/dashboard'); return; }
      useAuthStore.getState().setToken(stored);
    }

    checkAdmin()
      .then(() => setAuthorized(true))
      .catch(() => router.replace('/dashboard'));
  }, [router, token]);

  if (!authorized) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#07091a', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="lds-roller"><div /><div /><div /><div /><div /><div /><div /><div /></div>
      </div>
    );
  }

  return <>{children}</>;
}
