'use client';

import { useEffect } from 'react';
import { FilePlus } from 'lucide-react';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import LimitReachedCard from '@/components/usage/LimitReachedCard';
import CreateCVForm from '@/components/cv/CreateCVForm';

export default function CreateCVPage() {
  const { subscription, usage, fetchSubscription } = useSubscriptionStore();

  useEffect(() => {
    if (!subscription) fetchSubscription();
  }, [subscription, fetchSubscription]);

  const cvUsed  = usage?.cv.used  ?? 0;
  const cvLimit = usage?.cv.limit ?? 3;
  const cvOverLimit = cvLimit < 999999 && cvUsed >= cvLimit;

  return (
    <div
      style={{
        width: '100vw',
        maxWidth: '100vw',
        marginLeft: 'calc(-50vw + 50%)',
        marginTop: '-32px',
        marginBottom: '-32px',
        background: '#0d1130',
        position: 'relative',
        zIndex: 2,
        minHeight: 'calc(100vh - 56px)',
        overflowX: 'hidden',
      }}
    >
      <section
        className="relative overflow-hidden pt-10 sm:pt-16 pb-10 sm:pb-14"
        style={{
          backgroundImage: 'url(/aivent/background/6.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        <div className="absolute inset-0" style={{ background: 'rgba(8,11,35,0.82)' }} />
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{ height: '50%', background: 'linear-gradient(0deg,#0d1130 0%,transparent 100%)' }}
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6" style={{ zIndex: 2 }}>
          <div className="text-center mb-6 sm:mb-8">
            <span className="aivent-subtitle s2">
              <FilePlus className="inline h-3.5 w-3.5 mr-1" style={{ color: '#a78bfa' }} />
              Create from scratch
            </span>
            <h1
              className="text-white leading-[1.1] mt-2"
              style={{ fontSize: 'clamp(26px,6vw,46px)', fontWeight: 800, letterSpacing: '-0.02em' }}
            >
              Create your CV
            </h1>
            <p className="mt-2 text-sm sm:text-base text-white/50 max-w-xl mx-auto">
              Fill in your info, pick a template, and we&apos;ll generate a polished, ATS-friendly
              PDF you can download in seconds.
            </p>
          </div>

          <div className="relative mx-auto max-w-4xl px-0 sm:px-0">
            {cvOverLimit ? <LimitReachedCard feature="cv" /> : <CreateCVForm />}
          </div>
        </div>
      </section>
    </div>
  );
}
