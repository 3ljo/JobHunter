'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Interview feature is temporarily disabled — any direct hit redirects to the dashboard.
export default function InterviewPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);
  return null;
}
