'use client';

import { useEffect, useState } from 'react';
import { FilePlus } from 'lucide-react';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import LimitReachedCard from '@/components/usage/LimitReachedCard';
import CreateCVForm from '@/components/cv/CreateCVForm';

export default function CreateCVPage() {
  const { subscription, usage, fetchSubscription } = useSubscriptionStore();
  const [submitting, setSubmitting] = useState(false);

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
          backgroundImage: submitting ? 'none' : 'url(/aivent/background/1.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          minHeight: submitting ? 'calc(100vh - 56px)' : undefined,
        }}
      >
        {/* Video background — plays while the backend is building the CV */}
        {submitting && (
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            style={{ zIndex: 0 }}
          >
            <source src="/aivent/video/2.mp4" type="video/mp4" />
          </video>
        )}

        <div
          className="absolute inset-0"
          style={{ background: submitting ? 'rgba(8,11,32,0.70)' : 'rgba(8,11,35,0.82)', zIndex: 1 }}
        />
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{ height: '50%', background: 'linear-gradient(0deg,#0d1130 0%,transparent 100%)', zIndex: 1 }}
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6" style={{ zIndex: 2 }}>
          {submitting ? (
            <div className="flex flex-col items-center justify-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
              <span className="aivent-subtitle s2">AI-Powered</span>
              <h1
                className="text-white leading-[1.1] mb-4 text-center mt-2"
                style={{ fontSize: 'clamp(28px,6vw,52px)', fontWeight: 800, letterSpacing: '-0.02em' }}
              >
                Building your CV…
              </h1>
              <p
                className="text-center mb-10 px-2"
                style={{ color: 'rgba(255,255,255,0.50)', fontSize: '15px', lineHeight: 1.7, maxWidth: '480px' }}
              >
                We&apos;re assembling your CV from the info you entered. This only takes a moment —
                you&apos;ll pick the template and download on the next screen.
              </p>
            </div>
          ) : (
            <>
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
                {cvOverLimit
                  ? <LimitReachedCard feature="cv" />
                  : <CreateCVForm onSubmittingChange={setSubmitting} />}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
