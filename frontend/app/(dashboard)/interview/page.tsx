'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import {
  Crown, Mic2, Sparkles, BarChart3, FileText, Target, MessageSquare, Headphones,
} from 'lucide-react';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useInterviewStore } from '@/store/interviewStore';
import InterviewSetup from '@/components/interview/InterviewSetup';
import InterviewSession from '@/components/interview/InterviewSession';
import InterviewReport from '@/components/interview/InterviewReport';
import UsageMeter from '@/components/usage/UsageMeter';
import LimitReachedCard from '@/components/usage/LimitReachedCard';

export default function InterviewPage() {
  const { subscription, usage, fetchSubscription } = useSubscriptionStore();
  const { phase } = useInterviewStore();

  useEffect(() => {
    if (!subscription) fetchSubscription();
  }, [subscription, fetchSubscription]);

  const isProPlus = subscription?.plan === 'pro_plus';
  const miUsed  = usage?.mock_interview.used  ?? 0;
  const miLimit = usage?.mock_interview.limit ?? 5;
  const miOverLimit = isProPlus && miLimit < 999999 && miUsed >= miLimit;

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
                {phase === 'setup' && (miOverLimit ? (
                  <LimitReachedCard feature="mock_interview" />
                ) : (
                  <>
                    <UsageMeter feature="mock_interview" />
                    <InterviewSetup />
                  </>
                ))}
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

const GATE_FEATURES = [
  {
    icon: Target,
    title: 'Tailored to your CV + JD',
    desc: 'Questions generated from your exact experience and the role you are interviewing for.',
    color: '#a78bfa',
  },
  {
    icon: Mic2,
    title: 'Answer with your voice',
    desc: 'Speak naturally — we transcribe and grade you like a real interviewer would.',
    color: '#34d399',
  },
  {
    icon: BarChart3,
    title: 'Honest AI scoring',
    desc: 'Per-answer feedback plus a final coach report: strengths, gaps, and what to practice.',
    color: '#fbbf24',
  },
  {
    icon: Sparkles,
    title: '3 difficulty modes',
    desc: 'Standard, Challenging, or Stress — dial in the pressure.',
    color: '#60a5fa',
  },
] as const;

const PLAN_BENEFITS = [
  { icon: Mic2,         text: '5 voice interviews per day' },
  { icon: FileText,     text: 'Unlimited CV analyses' },
  { icon: MessageSquare, text: 'Unlimited cover letters' },
  { icon: Headphones,   text: 'Priority AI processing' },
];

function ProPlusGate() {
  return (
    <div className="mx-auto max-w-3xl">
      {/* Hero card */}
      <div
        className="relative overflow-hidden rounded-3xl p-6 sm:p-10"
        style={{
          background: 'rgba(0,0,0,0.34)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          border: '1px solid rgba(118,77,240,0.30)',
          boxShadow: '0 20px 60px rgba(118,77,240,0.15)',
        }}
      >
        {/* Glow accents */}
        <div
          className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.30), transparent 70%)' }}
        />
        <div
          className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.18), transparent 70%)' }}
        />

        {/* Headline */}
        <div className="relative text-center mb-6 sm:mb-8">
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl mb-4"
            style={{
              background: 'linear-gradient(135deg,rgba(118,77,240,0.25),rgba(167,139,250,0.15))',
              border: '1px solid rgba(118,77,240,0.45)',
              boxShadow: '0 10px 30px rgba(118,77,240,0.25)',
            }}
          >
            <Mic2 className="h-6 w-6" style={{ color: '#c4b5fd' }} />
          </div>
          <h2
            className="text-white font-black leading-[1.1]"
            style={{ fontSize: 'clamp(22px,4.5vw,32px)', letterSpacing: '-0.02em' }}
          >
            Train for the real interview
          </h2>
          <p className="text-sm sm:text-base text-white/55 mt-2 max-w-lg mx-auto">
            Upgrade to Pro+ to unlock voice mock interviews — scored, debriefed, and tailored to
            every role you apply for.
          </p>
        </div>

        {/* Feature grid */}
        <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {GATE_FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl p-4 flex items-start gap-3"
              style={{
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0"
                style={{ background: `${f.color}22`, border: `1px solid ${f.color}55` }}
              >
                <f.icon className="h-4 w-4" style={{ color: f.color }} />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] sm:text-sm font-bold text-white mb-0.5">{f.title}</p>
                <p className="text-[11px] sm:text-[12px] text-white/55 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Plan benefits */}
        <div
          className="relative rounded-2xl p-4 sm:p-5 mb-6"
          style={{
            background: 'rgba(118,77,240,0.06)',
            border: '1px solid rgba(118,77,240,0.18)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Crown className="h-4 w-4" style={{ color: '#fbbf24' }} />
            <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: '#fbbf24' }}>
              Everything in Pro+
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PLAN_BENEFITS.map((b) => (
              <div key={b.text} className="flex items-center gap-2">
                <b.icon className="h-3.5 w-3.5 shrink-0" style={{ color: '#c4b5fd' }} />
                <span className="text-[13px] text-white/80">{b.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="relative flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/pricing"
            className="group inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-black transition-all w-full sm:w-auto"
            style={{
              background: 'linear-gradient(135deg,#764DF0,#5b21b6)',
              color: 'white',
              boxShadow: '0 10px 30px rgba(118,77,240,0.45)',
              letterSpacing: '0.02em',
            }}
          >
            <Crown className="h-4 w-4" />
            Upgrade to Pro+
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded ml-1"
              style={{ background: 'rgba(255,255,255,0.18)' }}
            >
              $14.99/mo
            </span>
          </Link>

          <Link
            href="/pricing"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-3 text-[12px] font-bold w-full sm:w-auto"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.7)',
            }}
          >
            See all plans
          </Link>
        </div>

        <p className="relative text-center text-[11px] text-white/35 mt-4">
          Cancel anytime · Keep all your CV history · 7-day money back
        </p>
      </div>
    </div>
  );
}
