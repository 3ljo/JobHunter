'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

import { ChevronDown, Menu, X, Tag, Sparkles } from 'lucide-react';
import axios from 'axios';

const PROMO_BANNER_DISMISSED_KEY = 'cvc_promo_banner_dismissed_at';

/* ── Scroll reveal ── */
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('[data-reveal]');
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const delay = Number(e.target.getAttribute('data-delay') || 0);
            setTimeout(() => e.target.classList.add('revealed'), delay);
          }
        });
      },
      { threshold: 0.1 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/* ── Navbar scroll ── */
function useNavbarScroll() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);
  return scrolled;
}

/* ── FAQ Accordion ── */
function Accordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div>
      {items.map((item, i) => (
        <div key={i} className="aivent-accordion-item">
          <div className="aivent-accordion-title" onClick={() => setOpen(open === i ? null : i)}>
            <span>{item.q}</span>
            <ChevronDown
              className="h-5 w-5 shrink-0 transition-transform duration-300"
              style={{ transform: open === i ? 'rotate(180deg)' : 'rotate(0)', color: 'oklch(0.59 0.245 291)' }}
            />
          </div>
          <div className={`aivent-accordion-content ${open === i ? 'open' : ''}`}>{item.a}</div>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────── */
export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [promoBanner, setPromoBanner] = useState<{ code: string; discount_type: string; discount_amount: number; expires_at: string | null } | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [billingInterval, setBillingInterval] = useState<'month' | 'quarter' | 'year'>('month');
  const navScrolled = useNavbarScroll();
  useScrollReveal();

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('auth_token'));
    // Restore prior banner dismissal so we don't nag returning visitors.
    if (localStorage.getItem(PROMO_BANNER_DISMISSED_KEY)) {
      setBannerDismissed(true);
    }
    // Fetch active promo banner
    axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/promo/banner`)
      .then((res) => { if (res.data.banner) setPromoBanner(res.data.banner); })
      .catch(() => {});
  }, []);

  const dismissPromoBanner = () => {
    setBannerDismissed(true);
    try { localStorage.setItem(PROMO_BANNER_DISMISSED_KEY, String(Date.now())); } catch {}
  };

  /* ── Active section tracking ── */
  useEffect(() => {
    const sections = ['hero', 'features', 'journey', 'pricing', 'faq'];
    const observers = sections.map((id) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const io = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(id); },
        { rootMargin: '-40% 0px -55% 0px' }
      );
      io.observe(el);
      return io;
    });
    return () => observers.forEach((io) => io?.disconnect());
  }, []);

  const navLinks = [
    { href: '#hero', label: 'Home', id: 'hero' },
    { href: '#features', label: 'Features', id: 'features' },
    { href: '#journey', label: 'How It Works', id: 'journey' },
    { href: '#pricing', label: 'Pricing', id: 'pricing' },
    { href: '#faq', label: 'FAQ', id: 'faq' },
  ];

  /* ── Data ── */
  // Mirrors the dashboard's TOOLS list so the landing page advertises
  // exactly what users get inside. Update both lists together.
  const features = [
    {
      img: '/aivent/misc/s3.webp',
      title: 'CV Analyzer',
      desc: 'ATS scoring and keyword gap analysis for any job description.',
    },
    {
      img: '/aivent/misc/s2.webp',
      title: 'Create CV',
      desc: 'Build a CV from scratch — fill the form, preview live, tune with AI, export PDF/DOCX.',
    },
    {
      img: '/aivent/misc/s4.webp',
      title: 'Cover Letter',
      desc: 'AI-tailored cover letters in seconds — formal, balanced, or friendly tone.',
    },
    {
      img: '/aivent/misc/mock-interview.png',
      title: 'Mock Interview',
      desc: 'Voice-based AI interview practice with scored, per-question feedback.',
    },
    {
      img: '/aivent/misc/job-hunter.png',
      title: 'Job Hunter',
      desc: 'Live jobs across Remotive, Adzuna, and Jooble — searchable by role and country.',
    },
    {
      img: '/aivent/misc/job-tracker.png',
      title: 'Job Tracker',
      desc: 'Kanban and table views to manage every application from saved to offer.',
    },
    {
      img: '/aivent/misc/s6.webp',
      title: 'CV History',
      desc: 'Full history of every analysis with score progression over time.',
    },
  ];

  const logos = [
    '/logos/indeed.svg', '/logos/glassdoor.svg', '/logos/linkedin-jobs.svg', '/logos/monster.svg', '/logos/ziprecruiter.svg',
    '/logos/reed.svg', '/logos/totaljobs.svg', '/logos/careerbuilder.svg', '/logos/stepstone.svg', '/logos/simplyhired.svg',
  ];

  // Build the deep-link a logged-in visitor should hit when they click a
  // pricing tier on the landing page. Free goes back to the dashboard,
  // paid plans land directly in their checkout flow. Logged-out visitors
  // always start at /register first.
  const planHref = (key: 'free' | 'starter' | 'pro' | 'pro_voice', cadence: 'month' | 'quarter' | 'year' = 'month') => {
    if (!isLoggedIn) return '/register';
    if (key === 'free') return '/cv';
    if (key === 'starter') return '/checkout?plan=starter&interval=once';
    return `/checkout?plan=${key}&interval=${cadence}`;
  };

  // Subscription cards mirror the same prices as the in-app pricing page.
  // Free + 7-Day Pass ignore the toggle (one-time / always free).
  type PricingCard = {
    key: 'free' | 'starter' | 'pro' | 'pro_voice';
    bg: string;
    plan: string;
    monthly: number;
    quarterly?: number;
    yearly?: number;
    tagline: string;
    features: string[];
    cta: string;
    highlight: boolean;
    premium: boolean;
    badge: string;
    oneTime: boolean;
  };
  const pricing: PricingCard[] = [
    {
      key: 'free' as const,
      bg: '/aivent/misc/l3.webp',
      plan: 'Free',
      monthly: 0,
      tagline: 'Try the core tools',
      features: ['1 CV analysis', '2 cover letters', 'ATS score & keyword report', 'PDF downloads', 'Tracker — up to 15 jobs'],
      cta: 'Get Started Free',
      highlight: false,
      premium: false,
      badge: '',
      oneTime: true,
    },
    {
      key: 'starter' as const,
      bg: '/aivent/misc/l3.webp',
      plan: '7-Day Pass',
      monthly: 9,
      tagline: 'No auto-renew',
      features: ['Unlimited CV analyses (7 days)', 'Unlimited cover letters (7 days)', 'Full ATS audit & optimization', 'AI quick edits', 'Unlimited job tracker', 'Pay once — no subscription'],
      cta: 'Get Pass',
      highlight: false,
      premium: false,
      badge: 'Pay once',
      oneTime: true,
    },
    {
      key: 'pro' as const,
      bg: '/aivent/misc/l4.webp',
      plan: 'Pro',
      monthly: 19,
      quarterly: 45,
      yearly: 149,
      tagline: 'For active job seekers',
      features: ['Unlimited CV analyses', 'Unlimited cover letters', 'Full ATS audit & optimization', 'AI quick edits', 'Priority AI processing', 'Full CV history & analytics', 'Unlimited job tracker'],
      cta: isLoggedIn ? 'Upgrade to Pro' : 'Start Pro',
      highlight: true,
      premium: false,
      badge: 'Most Popular',
      oneTime: false,
    },
    {
      key: 'pro_voice' as const,
      bg: '/aivent/misc/l5.webp',
      plan: 'Pro+',
      monthly: 39,
      quarterly: 99,
      yearly: 299,
      tagline: 'AI voice coach + full job hunter',
      features: ['Everything in Pro', 'Job Hunter — AI matching across 12+ boards', 'Voice Mock Interview — 8 sessions / month', 'Voice feedback report', 'Interview prep library', 'LinkedIn-ready CV export', 'Priority AI processing'],
      cta: isLoggedIn ? 'Upgrade to Pro+' : 'Start Pro+',
      highlight: false,
      premium: true,
      badge: 'Premium',
      oneTime: false,
    },
  ];

  const faqItems = [
    { q: 'What is CvClimber?', a: 'CvClimber is an AI-powered job search platform that analyzes your CV against any job description, generates tailored cover letters, and helps you track all your applications in one place.' },
    { q: 'How does the CV analysis work?', a: 'Upload your CV and paste a job description. Our AI scores your CV for ATS compatibility, identifies missing keywords, and gives you actionable suggestions to improve your score instantly.' },
    { q: 'Is CvClimber free to use?', a: 'Yes — create a free account and start analyzing your CV right away. No credit card required. A $9 one-time 7-day pass or the Pro subscription unlocks unlimited usage.' },
    { q: 'What file formats does it support?', a: 'You can paste your CV text directly or upload a document. The AI processes the content and matches it against your target job description.' },
    { q: 'How does the cover letter generator work?', a: 'After your CV is analyzed, click "Generate Cover Letter". Choose your tone — balanced, formal, or friendly — and our AI crafts a personalized letter in seconds.' },
    { q: 'Is my data secure?', a: 'Yes. Your CV data is encrypted in transit and at rest, used only to power your own analysis, and never shared or sold to third parties.' },
  ];

  /* ── Render ── */
  return (
    <div className="min-h-screen text-white overflow-x-hidden" style={{ background: '#0a0d24' }}>

      {/* ══ PROMO BANNER ══ */}
      {promoBanner && !bannerDismissed && (
        <div
          className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-center px-4 py-2.5"
          style={{
            background: 'linear-gradient(90deg, oklch(0.48 0.22 291), oklch(0.59 0.245 291), oklch(0.48 0.22 291))',
            boxShadow: '0 2px 20px rgba(118,77,240,0.4)',
          }}
        >
          <div className="flex items-center gap-3 text-sm font-semibold text-white">
            <Tag className="h-4 w-4 shrink-0" />
            <span>
              {promoBanner.discount_type === 'percent'
                ? `${promoBanner.discount_amount}% OFF`
                : `$${promoBanner.discount_amount} OFF`}
              {' '} — Use code{' '}
              <span
                className="font-black tracking-wider px-2 py-0.5 rounded mx-1"
                style={{ background: 'rgba(255,255,255,0.2)' }}
              >
                {promoBanner.code}
              </span>
              {' '}at checkout
              {promoBanner.expires_at && (
                <span className="opacity-70 ml-1">
                  &middot; Ends {new Date(promoBanner.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}
            </span>
            <Link
              href={isLoggedIn ? '/pricing' : '/register'}
              className="ml-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shrink-0 transition-all hover:scale-105"
              style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}
            >
              {isLoggedIn ? 'Upgrade Now' : 'Get Started'}
            </Link>
          </div>
          <button
            onClick={dismissPromoBanner}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ══ NAVBAR ══ */}
      <header
        className="fixed left-0 right-0 z-50 transition-all duration-300"
        style={{
          top: promoBanner && !bannerDismissed ? '40px' : '0',
          ...(navScrolled
            ? { background: 'rgba(16,20,53,0.93)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.08)' }
            : { background: 'transparent', borderBottom: '1px solid transparent' }
          ),
        }}
      >
        <div className="mx-auto max-w-7xl px-6 flex items-center justify-between h-[96px]">

          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <img src="/aivent/logo.png" alt="CvClimber" style={{ height: '96px', width: 'auto' }} />
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={link.href}
                onClick={() => setActiveSection(link.id)}
                className="relative px-4 py-2 text-sm font-semibold transition-colors duration-200"
                style={{
                  color: activeSection === link.id ? '#fff' : 'rgba(255,255,255,0.55)',
                  letterSpacing: '0.01em',
                }}
              >
                {link.label}
                {/* Active underline */}
                <span
                  className="absolute left-4 right-4 transition-all duration-300"
                  style={{
                    bottom: '0px',
                    height: '2px',
                    background: 'oklch(0.59 0.245 291)',
                    opacity: activeSection === link.id ? 1 : 0,
                    transform: activeSection === link.id ? 'scaleX(1)' : 'scaleX(0)',
                    transformOrigin: 'center',
                  }}
                />
              </a>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link
                href="/cv"
                className="hidden lg:inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold text-white transition-all duration-200"
                style={{ background: 'oklch(0.59 0.245 291)', boxShadow: '0 2px 12px rgba(118,77,240,0.3)' }}
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                className="hidden lg:inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold text-white transition-all duration-200"
                style={{ background: 'oklch(0.59 0.245 291)', boxShadow: '0 2px 12px rgba(118,77,240,0.3)' }}
              >
                Sign In
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg text-white/70 hover:text-white transition-colors"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div
            className="lg:hidden px-6 pb-6 pt-2"
            style={{ background: 'rgba(16,20,53,0.97)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
          >
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={link.href}
                onClick={() => { setActiveSection(link.id); setMobileOpen(false); }}
                className="block py-3 text-sm font-semibold border-b"
                style={{
                  color: activeSection === link.id ? 'oklch(0.59 0.245 291)' : 'rgba(255,255,255,0.7)',
                  borderColor: 'rgba(255,255,255,0.06)',
                }}
              >
                {link.label}
              </a>
            ))}
            <div className="pt-4 mt-1">
              {isLoggedIn ? (
                <Link
                  href="/cv"
                  onClick={() => setMobileOpen(false)}
                  className="block w-full text-center py-3 rounded-lg text-sm font-bold text-white transition-all"
                  style={{ background: 'oklch(0.59 0.245 291)' }}
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block w-full text-center py-3 rounded-lg text-sm font-bold text-white transition-all"
                  style={{ background: 'oklch(0.59 0.245 291)' }}
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ══ HERO — Demo 6 split layout ══ */}
      <section id="hero" className="relative overflow-hidden pt-20 sm:pt-[110px]" style={{ paddingBottom: 0 }}>
        <div className="absolute inset-0" style={{ backgroundImage: 'url(/aivent/background/8.webp)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="absolute inset-0" style={{ background: 'rgba(16,20,53,0.60)' }} />
        <div className="absolute bottom-0 left-0 right-0" style={{ height: '35%', background: 'linear-gradient(0deg,#101435 0%,transparent 100%)' }} />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pb-16 sm:pb-24" style={{ zIndex: 2 }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">

            {/* Left — landingrobot.png hero robot image */}
            <div className="wow fadeInUp order-first lg:order-none text-center lg:text-left" data-wow-delay=".3s">
              <Image
                src="/aivent/misc/landingrobot.png"
                alt="CvClimber AI assistant illustration"
                width={720}
                height={720}
                priority
                sizes="(max-width: 1024px) 90vw, 45vw"
                className="w-full mx-auto max-h-[280px] sm:max-h-[400px] lg:max-h-[560px] h-auto"
                style={{ objectFit: 'contain' }}
              />
            </div>

            {/* Right — headline + CTA */}
            <div>
              <span className="aivent-subtitle s2 wow fadeInUp" data-wow-delay=".0s">AI-powered CV review</span>
              <h1
                className="wow fadeInUp text-white leading-[1.1] mb-6"
                style={{ fontSize: 'clamp(30px,7vw,62px)', letterSpacing: '-0.02em', fontWeight: 800 }}
                data-wow-delay=".2s"
              >
                Score your CV against any job in 30 seconds. Beat the ATS.
              </h1>
              <p className="wow fadeInUp text-white/60 text-base leading-relaxed mb-8" style={{ fontWeight: 400, maxWidth: '32rem' }} data-wow-delay=".4s">
                Upload your CV, paste any job description, and get an instant ATS score, the exact keywords you're missing, and a rewritten CV plus cover letter ready to send.
              </p>
              <div className="flex flex-wrap items-center gap-4 wow fadeInUp" data-wow-delay=".6s">
                {isLoggedIn
                  ? <Link href="/cv" className="btn-aivent btn-lg fx-slide" data-hover="GO TO DASHBOARD"><span>Go to Dashboard</span></Link>
                  : <>
                      <Link href="/register" className="btn-aivent btn-lg fx-slide" data-hover="START FREE"><span>Get Started Free</span></Link>
                      <Link href="/login" className="btn-aivent btn-line btn-lg fx-slide" data-hover="SIGN IN"><span>Sign In</span></Link>
                    </>
                }
              </div>
            </div>
          </div>
        </div>

        {/* Trust signals bar — honest, no fake metrics */}
        <div className="relative px-6" style={{ zIndex: 3 }}>
          <div className="mx-auto max-w-5xl">
            <div
              className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10 rounded-t-xl px-8 py-5"
              style={{ background: 'rgba(0,0,0,0.22)', backdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.08)', borderBottom: 'none' }}
            >
              {[
                { v: 'Free forever plan', l: 'Try it before you pay' },
                { v: 'No credit card', l: 'Sign up in 30 seconds' },
                { v: 'Cancel anytime', l: 'No lock-in, no contract' },
              ].map((s) => (
                <div key={s.l} className="text-center px-6 py-3 md:py-0">
                  <h3 className="text-base text-white mb-0.5" style={{ fontWeight: 700 }}>{s.v}</h3>
                  <p className="text-sm text-white/55" style={{ fontWeight: 400 }}>{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ ABOUT ══ */}
      <section id="about" className="py-14 sm:py-28 px-4 sm:px-6" style={{ background: '#101435', position: 'relative', zIndex: 1 }}>
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="aivent-subtitle wow fadeInUp" data-wow-delay=".2s">About CvClimber</span>
              <h2 className="wow fadeInUp text-white tracking-tight mb-6" style={{ fontSize: 'clamp(32px,4vw,48px)', fontWeight: 800 }} data-wow-delay=".4s">A Global AI Platform for Job Seekers</h2>
              <p className="wow fadeInUp text-white/55 text-base leading-relaxed mb-8" style={{ fontWeight: 400 }} data-wow-delay=".6s">
                CvClimber uses AI to score your CV against any job description, fix the gaps the ATS would flag, and write a cover letter that matches. The same edge recruiters look for — applied automatically.
              </p>
              <ul className="ul-check">
                <li className="wow fadeInUp" data-wow-delay=".7s">Instant ATS scoring against any job description</li>
                <li className="wow fadeInUp" data-wow-delay=".8s">AI cover letters in seconds</li>
                <li className="wow fadeInUp" data-wow-delay=".9s">Smart job application tracker</li>
                <li className="wow fadeInUp" data-wow-delay="1s">Full CV history and progress analytics</li>
              </ul>
            </div>
            <div className="flex justify-center wow scaleIn">
              <Image
                src="/aivent/misc/c1.webp"
                alt="CvClimber AI"
                width={420}
                height={420}
                sizes="(max-width: 768px) 80vw, 420px"
                className="rotate-slow"
                style={{ width: '80%', maxWidth: '420px', height: 'auto' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ══ MARQUEE ══ */}
      {/*
        clipPath:"inset(0)" is the only reliable way to clip rotated children
        in Chromium — overflow:hidden alone doesn't clip CSS-transformed elements.
        paddingTop/Bottom gives room so the tilt doesn't eat into band text.
      */}
      <div
        className="relative"
        style={{
          lineHeight: 1,
          clipPath: 'inset(0)',
          paddingTop: '8px',
          paddingBottom: '8px',
          background: '#101435', /* fills gap caused by padding */
        }}
      >
        <div
          className="py-6 overflow-hidden"
          style={{
            background: 'oklch(0.59 0.245 291)',
            transform: 'rotateZ(1.5deg)',
            margin: '0 -80px',
          }}
        >
          <div className="animate-marquee">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center">
                {['CV Analysis', 'ATS Optimization', 'Smart Matching', 'Cover Letters', 'Job Tracking', 'AI Insights', 'Interview Prep', 'Score Boost'].map(t => (
                  <span key={t} className="flex items-center">
                    <span className="text-white uppercase px-8 whitespace-nowrap" style={{ fontSize: '44px', fontWeight: 800, letterSpacing: '0.05em' }}>{t}</span>
                    <span className="text-white/30" style={{ fontSize: '44px', fontWeight: 300 }}>/</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div
          className="py-6 overflow-hidden"
          style={{
            background: 'oklch(0.42 0.18 285)',
            transform: 'rotateZ(-0.8deg)',
            margin: '-16px -80px 0',
          }}
        >
          <div className="animate-marquee-reverse">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center">
                {['Land Faster', 'Get Hired', 'Beat ATS', 'Stand Out', 'AI Resume', 'Top Results', 'More Offers', 'Career AI'].map(t => (
                  <span key={t} className="flex items-center">
                    <span className="text-white/80 uppercase px-8 whitespace-nowrap" style={{ fontSize: '44px', fontWeight: 800, letterSpacing: '0.05em' }}>{t}</span>
                    <span className="text-white/20" style={{ fontSize: '44px', fontWeight: 300 }}>/</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ FEATURES (image cards) ══ */}
      <section id="features" className="py-16 sm:py-32 px-4 sm:px-6" style={{ background: '#101435', position: 'relative', zIndex: 1 }}>
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <span className="aivent-subtitle" data-reveal>Why CvClimber</span>
            <h2 className="text-white tracking-tight wow fadeInUp" data-wow-delay=".1s" style={{ fontSize: 'clamp(32px,4vw,48px)', fontWeight: 800 }}>What You Will Gain</h2>
            <p className="text-white/55 text-lg mt-4 max-w-2xl mx-auto wow fadeInUp" style={{ fontWeight: 400 }} data-wow-delay=".2s">
              From ATS-beating CVs to automated cover letters — every tool you need to land your next role faster.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={f.title} className="feature-card relative rounded-xl overflow-hidden cursor-pointer wow scale-in-mask" style={{ minHeight: '300px' }}>
                <div className="card-bg absolute inset-0 transition-colors duration-500" style={{ background: '#1A1E42' }}>
                  <Image
                    src={f.img}
                    alt={f.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover opacity-75"
                  />
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-3/4" style={{ background: 'linear-gradient(0deg,#101435 0%,rgba(16,20,53,0) 100%)', zIndex: 1 }} />
                <div className="radial-overlay absolute inset-0" style={{ zIndex: 2 }} />
                <div className="absolute bottom-0 left-0 right-0 p-6" style={{ zIndex: 3 }}>
                  <h4 className="text-white text-xl mb-2 tracking-tight" style={{ fontWeight: 700 }}>{f.title}</h4>
                  <p className="text-white/60 text-sm leading-relaxed" style={{ fontWeight: 400 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PARALLAX QUOTE ══ */}
      <section
        className="relative overflow-hidden"
        aria-label="quote"
        style={{ paddingTop: '140px', paddingBottom: '140px' }}
      >
        <div className="absolute inset-0" style={{ backgroundImage: 'url(/aivent/background/1.webp)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
        {/* Overlays */}
        <div className="absolute inset-0" style={{ background: 'rgba(10,13,40,0.82)' }} />
        <div className="absolute top-0 left-0 right-0" style={{ height: '120px', background: 'linear-gradient(180deg,#101435 0%,transparent 100%)' }} />
        <div className="absolute bottom-0 left-0 right-0" style={{ height: '120px', background: 'linear-gradient(0deg,#101435 0%,transparent 100%)' }} />

        <div className="relative mx-auto max-w-3xl px-6 text-center" style={{ zIndex: 4 }}>
          <div className="wow fadeInUp">
            <div className="text-6xl font-black mb-6" style={{ color: 'oklch(0.59 0.245 291)', lineHeight: 1 }}>"</div>
            <h3 className="text-white leading-relaxed mb-6" style={{ fontSize: 'clamp(20px,2.5vw,30px)', fontWeight: 600 }}>
              Most CVs never reach a human — they get filtered out by an ATS before anyone reads them. CvClimber rewrites yours so it makes it through.
            </h3>
          </div>
        </div>
      </section>

      {/* ══ JOB SOURCES ══ */}
      <section
        className="relative overflow-hidden py-16 sm:py-20"
        aria-label="job-sources"
        style={{ background: '#101435' }}
      >
        <div className="px-6 mb-10 text-center">
          <span className="aivent-subtitle s2">Job Sources</span>
          <h3 className="text-white/85 mt-2" style={{ fontSize: 'clamp(20px,2.5vw,28px)', fontWeight: 700 }}>
            Live jobs pulled from the boards you already know
          </h3>
        </div>

        <div className="relative overflow-hidden">
          <div className="animate-logo-scroll wow fadeInUp">
            {[...logos, ...logos].map((src, i) => (
              <div key={i} className="px-8 flex items-center justify-center" style={{ minWidth: '140px' }}>
                <img src={src} alt="" className="object-contain opacity-60 hover:opacity-100 transition-opacity" style={{ maxWidth: '120px', maxHeight: '50px' }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section id="journey" className="py-16 sm:py-32 px-4 sm:px-6" style={{ background: '#101435', position: 'relative', zIndex: 1 }}>
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left — text + checklist */}
            <div className="lg:pr-8">
              <span className="aivent-subtitle wow fadeInUp" data-wow-delay=".2s">How It Works</span>
              <h2 className="wow fadeInUp text-white tracking-tight mb-6" style={{ fontSize: 'clamp(32px,4vw,48px)', fontWeight: 800 }} data-wow-delay=".4s">Your Path to Getting Hired</h2>
              <p className="wow fadeInUp text-white/55 text-base leading-relaxed mb-8" style={{ fontWeight: 400 }} data-wow-delay=".6s">
                From uploading your CV to landing interviews — CvClimber's AI handles every step.
                Get your ATS score, optimize your profile, generate cover letters, and track every application in one place.
              </p>
              <ul className="ul-check mb-8">
                <li className="wow fadeInUp" data-wow-delay=".7s">Upload your CV and paste any job description</li>
                <li className="wow fadeInUp" data-wow-delay=".8s">Get an instant ATS score and keyword gap report</li>
                <li className="wow fadeInUp" data-wow-delay=".9s">Generate a tailored cover letter in seconds</li>
                <li className="wow fadeInUp" data-wow-delay="1s">Track every application from saved to offer</li>
              </ul>
              <div className="wow fadeInUp" data-wow-delay="1.1s">
                {isLoggedIn
                  ? <Link href="/cv" className="btn-aivent fx-slide" data-hover="GO TO DASHBOARD"><span>Go to Dashboard</span></Link>
                  : <Link href="/register" className="btn-aivent fx-slide" data-hover="GET STARTED"><span>Get Started Free</span></Link>
                }
              </div>
            </div>

            {/* Right — staggered images + counter boxes */}
            <div className="grid grid-cols-2 gap-4">

              {/* Column 1 */}
              <div className="flex flex-col gap-4">
                <div className="relative overflow-hidden rounded-xl wow scale-in-mask">
                  <img src="/aivent/misc/s1.webp" alt="" className="w-full object-cover" style={{ borderRadius: '12px' }} />
                  <div className="absolute bottom-0 left-0 right-0" style={{ height: '50%', background: 'linear-gradient(0deg,rgba(16,20,53,0.8) 0%,transparent 100%)' }} />
                </div>
                <div className="rounded-xl text-center py-8 px-4 wow scale-in-mask" style={{ background: 'oklch(0.59 0.245 291)' }}>
                  <h2 className="text-white mb-1" style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1.1 }}>Free</h2>
                  <div className="text-white/80 text-sm" style={{ fontWeight: 600 }}>To get started</div>
                </div>
              </div>

              {/* Column 2 — offset down */}
              <div className="flex flex-col gap-4 mt-10">
                <div className="rounded-xl text-center py-8 px-4 wow scale-in-mask" style={{ background: 'oklch(0.42 0.18 285)' }}>
                  <h2 className="text-white mb-1" style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1.1 }}>Instant</h2>
                  <div className="text-white/80 text-sm" style={{ fontWeight: 600 }}>ATS results in seconds</div>
                </div>
                <div className="relative overflow-hidden rounded-xl wow scale-in-mask">
                  <img src="/aivent/misc/s2.webp" alt="" className="w-full object-cover" style={{ borderRadius: '12px' }} />
                  <div className="absolute bottom-0 left-0 right-0" style={{ height: '50%', background: 'linear-gradient(0deg,rgba(16,20,53,0.8) 0%,transparent 100%)' }} />
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ══ PRICING ══ */}
      <section
        id="pricing"
        className="relative py-16 sm:py-32 px-4 sm:px-6"
        style={{ backgroundImage: 'url(/aivent/background/7.webp)', backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.80)' }} />
        <div className="absolute top-0 left-0 right-0 h-1/4" style={{ background: 'linear-gradient(180deg,#1A1E42 0%,transparent 100%)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-1/4" style={{ background: 'linear-gradient(0deg,#101435 0%,transparent 100%)' }} />

        <div className="relative mx-auto max-w-7xl" style={{ zIndex: 2 }}>
          <div className="text-center mb-10">
            <span className="aivent-subtitle s2" data-reveal>Pricing Plans</span>
            <h2 className="text-white tracking-tight wow fadeInUp" data-wow-delay=".1s" style={{ fontSize: 'clamp(32px,4vw,48px)', fontWeight: 800 }}>Choose Your Plan</h2>
            <p className="text-white/55 text-lg mt-4 max-w-2xl mx-auto wow fadeInUp" style={{ fontWeight: 400 }} data-wow-delay=".2s">Start free. Grab a one-time 7-day pass. Or subscribe for the full search.</p>
          </div>

          {/* Monthly / 3-Months / Yearly toggle — drives the per-card price math below */}
          <div className="flex items-center justify-center gap-2 mb-12 flex-wrap">
            <button
              onClick={() => setBillingInterval('month')}
              className={`btn-aivent fx-slide ${billingInterval === 'month' ? '' : 'btn-line'}`}
              data-hover="MONTHLY"
              style={{ minWidth: '120px' }}
            >
              <span>Monthly</span>
            </button>
            <button
              onClick={() => setBillingInterval('quarter')}
              className={`btn-aivent fx-slide ${billingInterval === 'quarter' ? '' : 'btn-line'}`}
              data-hover="3 MONTHS"
              style={{ minWidth: '150px' }}
            >
              <span>3 Months</span>
            </button>
            <button
              onClick={() => setBillingInterval('year')}
              className={`btn-aivent fx-slide ${billingInterval === 'year' ? '' : 'btn-line'}`}
              data-hover="YEARLY — SAVE 35%"
              style={{ minWidth: '200px' }}
            >
              <span>Yearly — Save 35%</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {pricing.map((p, i) => {
              // Pro+ gets the gold treatment so it doesn't sit ignored
              // in the 4th slot — it's our highest-margin SKU.
              const accent = p.premium
                ? '#fbbf24'                      // amber-400
                : p.highlight
                  ? 'oklch(0.59 0.245 291)'      // brand violet for "Most Popular"
                  : 'rgba(255,255,255,0.08)';
              const borderStyle = (p.highlight || p.premium) ? `2px solid ${accent}` : `2px solid ${accent}`;
              const cardShadow = p.premium ? '0 12px 40px rgba(251,191,36,0.18)' : undefined;

              // Free + 7-Day Pass ignore the toggle. Free is always $0; the
              // pass is always $9 one-time. Subscriptions read off the
              // selected interval and fall back to 3× monthly if quarterly
              // isn't explicitly set (matches the in-app pricing page).
              let priceLabel: string;
              let periodLabel: string;
              let perMonthLabel: string | null = null;
              if (p.oneTime) {
                priceLabel = p.monthly === 0 ? '$0' : `$${p.monthly}`;
                periodLabel = p.monthly === 0 ? '' : 'one-time';
              } else {
                const quarterly = p.quarterly ?? p.monthly * 3;
                const yearly = p.yearly ?? p.monthly * 12;
                const amount =
                  billingInterval === 'month' ? p.monthly
                  : billingInterval === 'quarter' ? quarterly
                  : yearly;
                priceLabel = `$${amount}`;
                periodLabel = billingInterval === 'month' ? '/month' : billingInterval === 'quarter' ? '/3mo' : '/year';
                if (billingInterval === 'year') {
                  perMonthLabel = `$${(yearly / 12).toFixed(2)}/mo · Save ${Math.round(((p.monthly * 12 - yearly) / (p.monthly * 12)) * 100)}%`;
                } else if (billingInterval === 'quarter' && p.quarterly) {
                  perMonthLabel = `$${(p.quarterly / 3).toFixed(2)}/mo · Save ${Math.round(((p.monthly * 3 - p.quarterly) / (p.monthly * 3)) * 100)}%`;
                }
              }

              const href = planHref(p.key, p.oneTime ? 'month' : billingInterval);
              return (
                <div key={p.plan} data-reveal data-delay={String(i * 100)} style={{ boxShadow: cardShadow }}>
                  <div className="d-ticket-card mb-0 rounded-b-none" style={{ backgroundImage: `url(${p.bg})`, border: borderStyle, borderBottom: 'none' }}>
                    <div className="absolute inset-0" style={{ background: 'rgba(16,20,53,0.82)', borderRadius: '10px 10px 0 0' }} />
                    <div className="relative" style={{ zIndex: 1 }}>
                      <img src="/aivent/logo.png" alt="" style={{ height: '48px', marginBottom: '16px', opacity: 0.8 }} />
                      <h2 className="text-white mb-1" style={{ fontSize: '1.625rem', fontWeight: 800 }}>{p.plan}</h2>
                      {p.tagline && (
                        <p className="text-white/50 text-xs mb-3" style={{ fontWeight: 500 }}>{p.tagline}</p>
                      )}
                      <h4 className="text-white/80 mb-2" style={{ fontWeight: 600 }}>
                        <span className="text-white" style={{ fontSize: '2rem', fontWeight: 800 }}>{priceLabel}</span>
                        {periodLabel && (
                          <span className="text-white/50 ml-1" style={{ fontSize: '0.95rem', fontWeight: 400 }}>{periodLabel}</span>
                        )}
                      </h4>
                      {perMonthLabel && (
                        <p className="text-xs mb-2" style={{ color: '#34d399', fontWeight: 500 }}>{perMonthLabel}</p>
                      )}
                      {p.badge === 'Most Popular' && (
                        <span className="inline-block px-3 py-1 rounded-full text-xs uppercase tracking-widest text-white" style={{ fontWeight: 700, background: 'oklch(0.59 0.245 291)' }}>Most Popular</span>
                      )}
                      {p.badge === 'Pay once' && (
                        <span className="inline-block px-3 py-1 rounded-full text-xs uppercase tracking-widest" style={{ fontWeight: 700, background: 'rgba(52,211,153,0.18)', color: '#34d399' }}>Pay once</span>
                      )}
                      {p.badge === 'Premium' && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs uppercase tracking-widest" style={{ fontWeight: 800, background: 'rgba(251,191,36,0.18)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.45)' }}>
                          <Sparkles className="h-3 w-3" />
                          Premium
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="rounded-t-none rounded-b-xl px-5 py-5" style={{ background: '#1A1E42', border: borderStyle, borderTop: 'none' }}>
                    <ul className="ul-check mb-5 space-y-2 text-sm">
                      {p.features.map(f => <li key={f}>{f}</li>)}
                    </ul>
                    <Link href={href} className="btn-aivent fx-slide w-full text-center block" data-hover={p.cta.toUpperCase()}>
                      <span>{p.cta}</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ FAQ ══ */}
      <section id="faq" className="py-16 sm:py-32 px-4 sm:px-6" style={{ background: '#101435', position: 'relative', zIndex: 1 }}>
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-16">
            <div className="lg:col-span-2">
              <span className="aivent-subtitle" data-reveal>Everything You Need to Know</span>
              <h2 className="text-white tracking-tight wow fadeInUp" data-wow-delay=".1s" style={{ fontSize: 'clamp(28px,3.5vw,40px)', fontWeight: 800 }}>Frequently Asked Questions</h2>
            </div>
            <div className="lg:col-span-3 wow fadeInUp" data-wow-delay=".2s">
              <Accordion items={faqItems} />
            </div>
          </div>
        </div>
      </section>

      {/* ══ CTA / NEWSLETTER ══ */}
      <section
        className="relative overflow-hidden text-center"
        aria-label="cta"
        style={{ paddingTop: '140px', paddingBottom: '140px' }}
      >
        <div className="absolute inset-0" style={{ backgroundImage: 'url(/aivent/background/3.webp)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="absolute inset-0" style={{ background: 'rgba(10,13,40,0.82)' }} />
        <div className="absolute top-0 left-0 right-0" style={{ height: '120px', background: 'linear-gradient(180deg,#101435 0%,transparent 100%)' }} />
        <div className="absolute bottom-0 left-0 right-0" style={{ height: '120px', background: 'linear-gradient(0deg,#101435 0%,transparent 100%)' }} />

        <div className="relative mx-auto max-w-3xl px-6" style={{ zIndex: 4 }}>
          <span className="aivent-subtitle s2 wow fadeInUp" data-wow-delay=".0s">Start Today — It is Free</span>
          <h2 className="text-white tracking-tight mb-6 wow fadeInUp" style={{ fontSize: 'clamp(32px,4vw,52px)', fontWeight: 800 }} data-wow-delay=".2s">Join the Future of Job Search</h2>
          <p className="text-white/60 text-lg leading-relaxed mb-8 wow fadeInUp" style={{ fontWeight: 400 }} data-wow-delay=".4s">
            Stop guessing why your CV gets ignored. Get an ATS score, fix the gaps, and apply with confidence. Free to start — no card required.
          </p>
          <div className="wow fadeInUp" data-wow-delay=".6s">
            {isLoggedIn
              ? <Link href="/cv" className="btn-aivent fx-slide" data-hover="GO TO DASHBOARD"><span>Go to Dashboard</span></Link>
              : <Link href="/register" className="btn-aivent fx-slide" data-hover="CREATE ACCOUNT"><span>Get Started Free</span></Link>
            }
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer style={{ background: '#0a0d24', position: 'relative', zIndex: 1 }}>
        <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(118,77,240,0.4), transparent)' }} />

        <div className="mx-auto max-w-6xl px-6 pt-16 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-14">

            {/* Brand */}
            <div className="md:col-span-1">
              <img src="/aivent/logo.png" alt="CvClimber" style={{ height: '64px', width: 'auto', marginBottom: '16px' }} />
              <p className="text-white/40 text-sm leading-relaxed" style={{ fontWeight: 400 }}>
                AI-powered CV analysis, cover letter generation, and job tracking — all in one platform.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-white/80 text-xs font-bold uppercase tracking-widest mb-5">Product</h4>
              <ul className="space-y-3">
                {[
                  { label: 'CV Analyzer', href: '#features' },
                  { label: 'Cover Letters', href: '#features' },
                  { label: 'Job Tracker', href: '#features' },
                  { label: 'Pricing', href: '#pricing' },
                ].map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className="text-white/55 hover:text-white transition-colors text-sm" style={{ fontWeight: 400 }}>{l.label}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-white/80 text-xs font-bold uppercase tracking-widest mb-5">Company</h4>
              <ul className="space-y-3">
                {[
                  { label: 'About', href: '#about' },
                  { label: 'FAQ', href: '#faq' },
                  { label: 'Contact', href: '/contact' },
                  { label: 'Privacy Policy', href: '/privacy' },
                  { label: 'Terms of Service', href: '/terms' },
                  { label: 'Refund Policy', href: '/refund' },
                ].map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className="text-white/55 hover:text-white transition-colors text-sm" style={{ fontWeight: 400 }}>{l.label}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Get Started */}
            <div>
              <h4 className="text-white/80 text-xs font-bold uppercase tracking-widest mb-5">Get Started</h4>
              <ul className="space-y-3">
                <li><Link href="/login" className="text-white/55 hover:text-white transition-colors text-sm">Sign In</Link></li>
                <li><Link href="/register" className="text-white/55 hover:text-white transition-colors text-sm">Create Account</Link></li>
              </ul>
              <div className="mt-6">
                <Link href="/register" className="btn-aivent btn-line fx-slide text-xs !px-5 !py-2.5" data-hover="TRY FREE">
                  <span>Try Free</span>
                </Link>
              </div>
            </div>

          </div>

          {/* Bottom bar */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-white/45 text-xs" style={{ fontWeight: 400 }}>
              &copy; {new Date().getFullYear()} CvClimber. All rights reserved.
            </p>
            <div className="flex items-center gap-5">
              <Link href="/contact" className="text-white/45 hover:text-white/80 transition-colors text-xs">Contact</Link>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
