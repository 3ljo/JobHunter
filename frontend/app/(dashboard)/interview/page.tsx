'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Crown, Lock, Mic2 } from 'lucide-react';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useInterviewStore } from '@/store/interviewStore';
import InterviewSetup from '@/components/interview/InterviewSetup';
import InterviewSession from '@/components/interview/InterviewSession';
import InterviewReport from '@/components/interview/InterviewReport';

export default function InterviewPage() {
  const { subscription, fetchSubscription } = useSubscriptionStore();
  const { phase } = useInterviewStore();

  useEffect(() => {
    if (!subscription) fetchSubscription();
  }, [subscription, fetchSubscription]);

  const isProPlus = subscription?.plan === 'pro_plus';

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
          backgroundImage: 'url(/aivent/background/5.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        <div className="absolute inset-0" style={{ background: 'rgba(8,11,35,0.82)' }} />
        <div className="absolute bottom-0 left-0 right-0"
          style={{ height: '50%', background: 'linear-gradient(0deg,#0d1130 0%,transparent 100%)' }} />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6" style={{ zIndex: 2 }}>
          <div className="text-center mb-6 sm:mb-8">
            <span className="aivent-subtitle s2">
              <Crown className="inline h-3.5 w-3.5 mr-1" style={{ color: '#fbbf24' }} />
              Pro+ feature
            </span>
            <h1
              className="text-white leading-[1.1] mt-2"
              style={{ fontSize: 'clamp(26px,6vw,46px)', fontWeight: 800, letterSpacing: '-0.02em' }}
            >
              AI Mock Interview
            </h1>
            <p className="mt-2 text-sm sm:text-base text-white/50 max-w-xl mx-auto">
              Practice the real interview with a virtual HR. Tailored questions from your CV + job
              description. Scored by AI, with a final coach&apos;s report.
            </p>
          </div>

          <div className="relative mx-auto max-w-4xl px-0 sm:px-0">
            {!isProPlus ? <ProPlusGate /> : (
              <>
                {phase === 'setup'   && <InterviewSetup />}
                {phase === 'session' && <InterviewSession />}
                {phase === 'report'  && <InterviewReport />}
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function ProPlusGate() {
  return (
    <div
      className="mx-auto max-w-xl rounded-2xl p-6 sm:p-8 text-center"
      style={{
        background: 'rgba(0,0,0,0.30)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        border: '1px solid rgba(118,77,240,0.25)',
      }}
    >
      <div
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl mb-4"
        style={{ background: 'rgba(118,77,240,0.15)', border: '1px solid rgba(118,77,240,0.3)' }}
      >
        <Mic2 className="h-6 w-6" style={{ color: '#a78bfa' }} />
      </div>
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Voice Mock Interview is a Pro+ feature</h2>
      <p className="text-sm text-white/60 mb-5">
        Practice your interview with an AI interviewer that asks tailored questions based on your CV
        and the job description. Pro+ includes 3 full interviews per day, plus unlimited CV
        analyses and cover letters.
      </p>
      <Link
        href="/pricing"
        className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-all"
        style={{
          background: 'linear-gradient(135deg,#764DF0,#5b21b6)',
          color: 'white',
          boxShadow: '0 8px 24px rgba(118,77,240,0.35)',
        }}
      >
        <Crown className="h-4 w-4" />
        Upgrade to Pro+
      </Link>
      <p className="text-[11px] text-white/35 mt-4 inline-flex items-center gap-1">
        <Lock className="h-3 w-3" /> Free and Pro tiers do not include voice interview
      </p>
    </div>
  );
}
