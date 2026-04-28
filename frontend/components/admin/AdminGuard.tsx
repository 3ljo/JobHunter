'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { checkAdmin } from '@/lib/api';

// Cookie-based auth: AdminGuard just asks the backend whether the
// current session is an admin. There's no token to inspect on the
// client side anymore.
export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    checkAdmin()
      .then((res) => {
        if (res.data?.isAdmin) setAuthorized(true);
        else router.replace('/dashboard');
      })
      .catch(() => router.replace('/dashboard'));
  }, [router]);

  if (!authorized) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#07091a', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="lds-roller"><div /><div /><div /><div /><div /><div /><div /><div /></div>
      </div>
    );
  }

  return <>{children}</>;
}
