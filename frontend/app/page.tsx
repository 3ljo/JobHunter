'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Check } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState(0);
  const navScrolled = useNavbarScroll();
  useScrollReveal();

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('auth_token'));
  }, []);

  /* ── Data ── */
  const features = [
    {
      img: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=700&h=450&fit=crop&q=80',
      title: 'AI CV Analysis',
      desc: 'ATS scoring, keyword gap analysis, and instant optimization suggestions for any job.',
    },
    {
      img: 'https://images.unsplash.com/photo-1565688534245-05d6b5be184a?w=700&h=450&fit=crop&q=80',
      title: 'Smart Job Matching',
      desc: 'Our AI scores your profile against any job description and highlights exactly what is missing.',
    },
    {
      img: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=700&h=450&fit=crop&q=80',
      title: 'Cover Letter AI',
      desc: 'Tailored, professional cover letters in seconds — formal, balanced, or friendly tone.',
    },
    {
      img: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=700&h=450&fit=crop&q=80',
      title: 'Job Application Tracker',
      desc: 'Visual kanban board to manage every application from saved to offer in one place.',
    },
    {
      img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=700&h=450&fit=crop&q=80',
      title: 'CV History & Analytics',
      desc: 'Full history of every analysis with score progression charts over time.',
    },
    {
      img: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=700&h=450&fit=crop&q=80',
      title: 'ATS Optimization',
      desc: 'Beat automated resume filters with keyword-tuned CVs crafted for each specific role.',
    },
  ];

  const testimonials = [
    {
      img: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&h=700&fit=crop&q=80',
      name: 'James Mitchell',
      title: 'Software Engineer · Landed at Google',
    },
    {
      img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&h=700&fit=crop&q=80',
      name: 'Sarah Okonkwo',
      title: 'Product Manager · Hired at Meta',
    },
    {
      img: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&h=700&fit=crop&q=80',
      name: 'Carlos Vasquez',
      title: 'Data Scientist · Joined Stripe',
    },
  ];

  const logos = Array.from({ length: 10 }, (_, i) => `/aivent/logo-light/${i + 1}.webp`);

  const journeySteps = [
    {
      label: 'Step 1', date: 'Day 1',
      items: [
        { title: 'Create Your Free Account', desc: 'Sign up in 30 seconds. No credit card required. Your AI-powered career tools are instantly available.' },
        { title: 'Upload Your Current CV', desc: 'Paste your CV text or upload a file. JobHunter accepts any format and parses your content automatically.' },
      ],
    },
    {
      label: 'Step 2', date: 'Day 1',
      items: [
        { title: 'Paste the Job Description', desc: 'Copy any job description from LinkedIn, Indeed, or any job board and paste it directly into JobHunter.' },
        { title: 'Run AI Analysis', desc: 'Our AI scores your CV for ATS compatibility, identifies keyword gaps, and highlights missing skills.' },
      ],
    },
    {
      label: 'Step 3', date: 'Day 2',
      items: [
        { title: 'Review Your Optimization Report', desc: 'Get a detailed report with your ATS score, missing keywords, suggested rewrites, and formatting tips.' },
        { title: 'Generate Your Cover Letter', desc: 'Pick your tone — balanced, formal, or friendly — and our AI writes a perfectly tailored cover letter.' },
      ],
    },
    {
      label: 'Step 4', date: 'Day 2+',
      items: [
        { title: 'Apply with Confidence', desc: 'Submit your optimized CV and AI cover letter. Track your application status directly in the dashboard.' },
        { title: 'Monitor & Improve', desc: 'Use the tracker to follow up, the history to measure progress, and keep optimizing as you apply for more roles.' },
      ],
    },
  ];

  const pricing = [
    {
      bg: '/aivent/misc/l3.webp',
      plan: 'Free',
      price: '$0',
      period: 'Forever',
      features: ['3 CV analyses per month', 'ATS score & keyword report', 'Basic cover letter', 'Job application tracker', 'Email support'],
      cta: 'Get Started Free',
      href: '/register',
      highlight: false,
    },
    {
      bg: '/aivent/misc/l4.webp',
      plan: 'Pro',
      price: '$19',
      period: '/month',
      features: ['Unlimited CV analyses', 'Advanced ATS optimization', 'Unlimited cover letters', 'All tone options (3)', 'Priority AI processing', 'Full CV history & analytics'],
      cta: 'Start Pro',
      href: '/register',
      highlight: true,
    },
    {
      bg: '/aivent/misc/l5.webp',
      plan: 'Teams',
      price: '$49',
      period: '/month',
      features: ['Everything in Pro', 'Up to 10 team members', 'Team dashboard & insights', 'Bulk CV analysis', 'API access', 'Dedicated account manager'],
      cta: 'Contact Sales',
      href: '/register',
      highlight: false,
    },
  ];

  const faqItems = [
    { q: 'What is JobHunter?', a: 'JobHunter is an AI-powered job search platform that analyzes your CV against any job description, generates tailored cover letters, and helps you track all your applications in one place.' },
    { q: 'How does the CV analysis work?', a: 'Upload your CV and paste a job description. Our AI scores your CV for ATS compatibility, identifies missing keywords, and gives you actionable suggestions to improve your score instantly.' },
    { q: 'Is JobHunter free to use?', a: 'Yes — create a free account and start analyzing your CV right away. No credit card required. Pro and Teams plans unlock unlimited usage.' },
    { q: 'What file formats does it support?', a: 'You can paste your CV text directly or upload a document. The AI processes the content and matches it against your target job description.' },
    { q: 'How does the cover letter generator work?', a: 'After your CV is analyzed, click "Generate Cover Letter". Choose your tone — balanced, formal, or friendly — and our AI crafts a personalized letter in seconds.' },
    { q: 'Is my data secure?', a: 'Yes. Your CV data is stored securely with Supabase and is only used to power your analysis. We never share your data with third parties.' },
  ];

  /* ── Render ── */
  return (
    <div className="min-h-screen text-white overflow-x-hidden" style={{ background: '#101435' }}>

      {/* ══ NAVBAR ══ */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navScrolled ? 'navbar-solid' : 'navbar-transparent'}`}>
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <Link href="/">
            <img src="/aivent/logo.webp" alt="JobHunter" style={{ height: '34px', width: 'auto' }} />
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            {[['Home','#hero'],['Features','#features'],['How It Works','#journey'],['Pricing','#pricing'],['FAQ','#faq']].map(([l, h]) => (
              <a key={l} href={h} className="text-sm font-700 text-white/75 hover:text-white transition-colors tracking-wide">{l}</a>
            ))}
          </nav>
          {isLoggedIn
            ? <Link href="/cv" className="btn-aivent fx-slide" data-hover="OPEN APP"><span>Open App</span></Link>
            : <Link href="/register" className="btn-aivent fx-slide" data-hover="GET STARTED"><span>Get Started</span></Link>}
        </div>
      </header>

      {/* ══ HERO ══ */}
      <section id="hero" className="relative flex items-center justify-center text-white overflow-hidden" style={{ minHeight: '100vh' }}>
        {/* ── Video background (same as AIvent) ── */}
        <video
          autoPlay
          muted
          loop
          playsInline
          poster="/aivent/background/2.webp"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ zIndex: 0 }}
        >
          <source src="/aivent/video/2.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.78)', zIndex: 1 }} />
        <div className="absolute top-0 left-0 right-0 h-[30%]" style={{ background: 'linear-gradient(180deg,#101435 0%,rgba(16,20,53,0) 100%)', zIndex: 2 }} />
        <div className="absolute bottom-0 left-0 right-0 h-[45%]" style={{ background: 'linear-gradient(0deg,#101435 0%,rgba(16,20,53,0) 100%)', zIndex: 2 }} />

        <div className="relative text-center px-6 max-w-5xl mx-auto" style={{ zIndex: 3 }}>
          <span className="aivent-subtitle" data-reveal>The Future of Job Search</span>
          <h1 className="font-800 text-white mb-8 leading-[1.0]" style={{ fontSize: 'clamp(56px,10vw,120px)', letterSpacing:'-0.02em', textTransform:'uppercase' }} data-reveal data-delay="100">
            AI JOB HUNTER<br />
          </h1>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8 text-xl" data-reveal data-delay="200">
            <div className="flex items-center gap-3 text-white/80">
              <span className="text-2xl" style={{ color:'oklch(0.59 0.245 291)' }}></span>
              <h4 className="font-600 text-lg m-0">Land Your Dream Job — Powered by AI</h4>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4" data-reveal data-delay="300">
            {isLoggedIn
              ? <Link href="/cv" className="btn-aivent fx-slide" data-hover="OPEN DASHBOARD"><span>Open Dashboard</span></Link>
              : <>
                  <Link href="/register" className="btn-aivent fx-slide" data-hover="START FREE"><span>Get Started Free</span></Link>
                  <Link href="/login" className="btn-aivent btn-line fx-slide" data-hover="SIGN IN"><span>Sign In</span></Link>
                </>
            }
          </div>
        </div>

        {/* Glassmorphism bottom bar */}
        <div className="absolute bottom-8 left-0 right-0 px-6" style={{ zIndex: 4 }}>
          <div className="mx-auto max-w-5xl">
            <div className="hidden md:grid grid-cols-3 divide-x divide-white/10 rounded-xl px-8 py-5" style={{ background:'rgba(0,0,0,0.18)', backdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,0.08)' }}>
              {[{v:'10,000+',l:'CVs Analyzed'},{v:'85%',l:'Average Score Improvement'},{v:'3×',l:'More Interview Callbacks'}].map((s)=>(
                <div key={s.l} className="text-center px-6">
                  <h3 className="text-2xl font-800 text-white mb-0.5">{s.v}</h3>
                  <p className="text-sm text-white/55 font-500">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ ABOUT ══ */}
      <section className="py-28 px-6" style={{ background:'#101435' }}>
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="aivent-subtitle" data-reveal>About JobHunter</span>
              <h2 className="text-4xl md:text-5xl font-800 text-white tracking-tight mb-6" data-reveal data-delay="100">A Global AI Platform for Job Seekers</h2>
              <p className="text-white/55 text-base leading-relaxed mb-8 font-400" data-reveal data-delay="200">
                Join thousands of job seekers using cutting-edge AI to perfect their CVs, craft winning cover letters, and land interviews faster. JobHunter gives you the AI-powered edge in every application.
              </p>
              <ul className="ul-check" data-reveal data-delay="300">
                <li>Instant ATS scoring against any job description</li>
                <li>AI cover letters in seconds</li>
                <li>Smart job application tracker</li>
                <li>Full CV history and progress analytics</li>
              </ul>
            </div>
            <div className="flex justify-center" data-reveal="scale">
              <img src="/aivent/misc/c1.webp" alt="JobHunter AI" className="rotate-slow" style={{ width:'80%', maxWidth:'420px' }} />
            </div>
          </div>
        </div>
      </section>

      {/* ══ MARQUEE ══ */}
      <div className="relative overflow-hidden" style={{ lineHeight:1 }}>
        <div className="py-5 overflow-hidden" style={{ background:'oklch(0.59 0.245 291)', transform:'rotateZ(2deg)', margin:'0 -60px' }}>
          <div className="animate-marquee">
            {[...Array(2)].map((_,i)=>(
              <div key={i} className="flex items-center">
                {['CV Analysis','ATS Optimization','Smart Matching','Cover Letters','Job Tracking','AI Insights','Interview Prep','Score Boost'].map(t=>(
                  <span key={t} className="flex items-center">
                    <span className="text-white font-800 uppercase tracking-wider px-8 whitespace-nowrap" style={{ fontSize:'52px' }}>{t}</span>
                    <span className="text-white/30 font-300" style={{ fontSize:'52px' }}>/</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="py-5 overflow-hidden" style={{ background:'oklch(0.42 0.18 285)', transform:'rotateZ(-1deg)', margin:'-20px -60px 0' }}>
          <div className="animate-marquee-reverse">
            {[...Array(2)].map((_,i)=>(
              <div key={i} className="flex items-center">
                {['Land Faster','Get Hired','Beat ATS','Stand Out','AI Resume','Top Results','More Offers','Career AI'].map(t=>(
                  <span key={t} className="flex items-center">
                    <span className="text-white/80 font-800 uppercase tracking-wider px-8 whitespace-nowrap" style={{ fontSize:'52px' }}>{t}</span>
                    <span className="text-white/20 font-300" style={{ fontSize:'52px' }}>/</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ FEATURES (image cards) ══ */}
      <section id="features" className="py-32 px-6" style={{ background:'#101435' }}>
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <span className="aivent-subtitle" data-reveal>Why JobHunter</span>
            <h2 className="text-4xl md:text-5xl font-800 text-white tracking-tight" data-reveal data-delay="100">What You Will Gain</h2>
            <p className="text-white/55 text-lg mt-4 max-w-2xl mx-auto font-400" data-reveal data-delay="200">
              From ATS-beating CVs to automated cover letters — every tool you need to land your next role faster.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f,i)=>(
              <div key={f.title} className="feature-card relative rounded-xl overflow-hidden cursor-pointer" style={{ minHeight:'300px' }} data-reveal data-delay={String(i*80)}>
                <div className="card-bg absolute inset-0 transition-colors duration-500" style={{ background:'#1A1E42' }}>
                  <img src={f.img} alt={f.title} className="w-full h-full object-cover opacity-75" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-3/4" style={{ background:'linear-gradient(0deg,#101435 0%,rgba(16,20,53,0) 100%)', zIndex:1 }} />
                <div className="radial-overlay absolute inset-0" style={{ zIndex:2 }} />
                <div className="absolute bottom-0 left-0 right-0 p-6" style={{ zIndex:3 }}>
                  <h4 className="text-white font-700 text-xl mb-2 tracking-tight">{f.title}</h4>
                  <p className="text-white/60 text-sm leading-relaxed font-400">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PARALLAX QUOTE ══ */}
      <section className="relative py-32 px-6 text-white" style={{ backgroundImage:'url(/aivent/background/1.webp)', backgroundSize:'cover', backgroundPosition:'center', backgroundAttachment:'fixed' }}>
        <div className="absolute inset-0" style={{ background:'rgba(0,0,0,0.82)' }} />
        <div className="absolute top-0 left-0 right-0 h-1/4" style={{ background:'linear-gradient(180deg,#101435 0%,transparent 100%)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-1/4" style={{ background:'linear-gradient(0deg,#101435 0%,transparent 100%)' }} />
        <div className="relative mx-auto max-w-5xl" style={{ zIndex:2 }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-center">
            <div className="relative" data-reveal="scale">
              <div className="absolute top-0 right-0 w-16 h-16 flex items-center justify-center rounded-lg z-10 text-white text-4xl font-800" style={{ background:'oklch(0.59 0.245 291)', lineHeight:1 }}>"</div>
              <img src="https://images.unsplash.com/photo-1573497019236-17f8177b81e8?w=500&h=600&fit=crop&q=80" alt="HR professional" className="w-full rounded-xl" />
            </div>
            <div className="md:col-span-2" data-reveal data-delay="150">
              <h3 className="text-2xl md:text-3xl font-600 text-white leading-relaxed mb-6">
                "AI is fundamentally reshaping how people find work. Those who embrace AI-powered tools in their job search will have an insurmountable advantage over those who don't."
              </h3>
              <span className="text-white/45 font-500 text-sm tracking-widest uppercase">— The Future of Work Report, 2026</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══ SUCCESS STORIES (Speakers equivalent) ══ */}
      <section className="py-32 px-6" style={{ background:'#101435' }}>
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <span className="aivent-subtitle" data-reveal>Success Stories</span>
            <h2 className="text-4xl md:text-5xl font-800 text-white tracking-tight" data-reveal data-delay="100">Meet Our Top Users</h2>
            <p className="text-white/55 text-lg mt-4 max-w-2xl mx-auto font-400" data-reveal data-delay="200">Real job seekers who used JobHunter to land roles at the world's top companies.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t,i)=>(
              <div key={t.name} className="speaker-card relative rounded-xl overflow-hidden" style={{ minHeight:'380px' }} data-reveal data-delay={String(i*100)}>
                <img src={t.img} alt={t.name} className="w-full h-full object-cover absolute inset-0" style={{ minHeight:'380px' }} />
                <div className="absolute inset-0" style={{ background:'linear-gradient(0deg,rgba(16,20,53,0.9) 0%,rgba(16,20,53,0) 60%)', zIndex:1 }} />
                <div className="speaker-overlay absolute inset-0" style={{ zIndex:2 }} />
                <div className="absolute bottom-0 left-0 right-0 z-10 p-4 m-4 rounded-xl text-center" style={{ background:'rgba(0,0,0,0.18)', backdropFilter:'blur(10px)', border:'1px solid rgba(255,255,255,0.08)' }}>
                  <h3 className="text-white font-700 text-lg mb-1">{t.name}</h3>
                  <span className="text-white/55 text-sm font-400">{t.title}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ COMPANY LOGOS ══ */}
      <section className="relative py-20 px-6 overflow-hidden" style={{ backgroundImage:'url(/aivent/background/1.webp)', backgroundSize:'cover', backgroundPosition:'center', backgroundAttachment:'fixed' }}>
        <div className="absolute inset-0" style={{ background:'rgba(0,0,0,0.85)' }} />
        <div className="absolute top-0 left-0 right-0 h-1/3" style={{ background:'linear-gradient(180deg,#101435 0%,transparent 100%)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-1/3" style={{ background:'linear-gradient(0deg,#101435 0%,transparent 100%)' }} />
        <div className="relative" style={{ zIndex:2 }}>
          <div className="animate-logo-scroll">
            {[...logos, ...logos].map((src, i) => (
              <div key={i} className="px-8 flex items-center justify-center" style={{ minWidth:'140px' }}>
                <img src={src} alt="" className="w-full object-contain opacity-60 hover:opacity-100 transition-opacity" style={{ maxWidth:'120px', maxHeight:'50px' }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ JOURNEY (Schedule equivalent) ══ */}
      <section id="journey" className="py-32 px-6" style={{ background:'#1A1E42' }}>
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <span className="aivent-subtitle s2" data-reveal>Your Journey</span>
            <h2 className="text-4xl md:text-5xl font-800 text-white tracking-tight" data-reveal data-delay="100">Your Path to Employment</h2>
          </div>

          {/* Tab headers */}
          <div className="grid grid-cols-4 gap-4 mb-8 border-b border-white/10" data-reveal>
            {journeySteps.map((s, i) => (
              <div key={i} className={`sched-tab text-center pb-4 ${activeTab === i ? 'active' : ''}`} onClick={() => setActiveTab(i)}>
                <h3 className="text-xl font-800 m-0">{s.label}</h3>
                <span className="text-sm opacity-60 font-400">{s.date}</span>
              </div>
            ))}
          </div>

          {/* Tab content */}
          <div className="space-y-6">
            {journeySteps[activeTab].items.map((item, i) => (
              <div key={i} className="rounded-2xl p-8" style={{ background:'rgba(16,20,53,0.6)', border:'1px solid rgba(255,255,255,0.07)' }}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  <div className="text-white/40 font-700 text-sm uppercase tracking-widest">{`0${i + 1}`}</div>
                  <div className="md:col-span-2">
                    <h3 className="text-xl font-700 text-white mb-2 tracking-tight">{item.title}</h3>
                    <p className="text-white/55 text-sm leading-relaxed font-400">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PRICING (Tickets equivalent) ══ */}
      <section id="pricing" className="relative py-32 px-6" style={{ backgroundImage:'url(/aivent/background/7.webp)', backgroundSize:'cover', backgroundPosition:'center', backgroundAttachment:'fixed' }}>
        <div className="absolute inset-0" style={{ background:'rgba(0,0,0,0.80)' }} />
        <div className="absolute top-0 left-0 right-0 h-1/4" style={{ background:'linear-gradient(180deg,#1A1E42 0%,transparent 100%)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-1/4" style={{ background:'linear-gradient(0deg,#101435 0%,transparent 100%)' }} />

        <div className="relative mx-auto max-w-6xl" style={{ zIndex:2 }}>
          <div className="text-center mb-16">
            <span className="aivent-subtitle s2" data-reveal>Pricing Plans</span>
            <h2 className="text-4xl md:text-5xl font-800 text-white tracking-tight" data-reveal data-delay="100">Choose Your Plan</h2>
            <p className="text-white/55 text-lg mt-4 max-w-2xl mx-auto font-400" data-reveal data-delay="200">Start free. Upgrade when you need more power.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricing.map((p, i) => (
              <div key={p.plan} data-reveal data-delay={String(i * 100)}>
                {/* Ticket header */}
                <div className="d-ticket-card mb-0 rounded-b-none" style={{ backgroundImage:`url(${p.bg})`, border: p.highlight ? '2px solid oklch(0.59 0.245 291)' : '2px solid rgba(255,255,255,0.08)', borderBottom:'none' }}>
                  <div className="absolute inset-0" style={{ background:'rgba(16,20,53,0.82)', borderRadius:'10px 10px 0 0' }} />
                  <div className="relative" style={{ zIndex:1 }}>
                    <img src="/aivent/logo.webp" alt="" style={{ height:'28px', marginBottom:'20px', opacity:0.8 }} />
                    <h2 className="text-3xl font-800 text-white mb-1">{p.plan}</h2>
                    <h4 className="text-white/80 font-600 mb-4">
                      <span className="text-4xl font-800 text-white">{p.price}</span>
                      <span className="text-base font-400 text-white/50 ml-1">{p.period}</span>
                    </h4>
                    {p.highlight && (
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-700 uppercase tracking-widest" style={{ background:'oklch(0.59 0.245 291)' }}>Most Popular</span>
                    )}
                  </div>
                </div>
                {/* Feature list */}
                <div className="rounded-t-none rounded-b-xl px-6 py-6" style={{ background:'#1A1E42', border: p.highlight ? '2px solid oklch(0.59 0.245 291)' : '2px solid rgba(255,255,255,0.08)', borderTop:'none' }}>
                  <ul className="ul-check mb-6 space-y-2">
                    {p.features.map(f => <li key={f}>{f}</li>)}
                  </ul>
                  <Link href={p.href} className="btn-aivent fx-slide w-full text-center block" data-hover={p.cta.toUpperCase()}>
                    <span>{p.cta}</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FAQ ══ */}
      <section id="faq" className="py-32 px-6" style={{ background:'#101435' }}>
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-16">
            <div className="lg:col-span-2">
              <span className="aivent-subtitle" data-reveal>Everything You Need to Know</span>
              <h2 className="text-4xl font-800 text-white tracking-tight" data-reveal data-delay="100">Frequently Asked Questions</h2>
            </div>
            <div className="lg:col-span-3" data-reveal data-delay="200">
              <Accordion items={faqItems} />
            </div>
          </div>
        </div>
      </section>

      {/* ══ NEWSLETTER / CTA ══ */}
      <section className="relative py-32 px-6 text-white" style={{ backgroundImage:'url(/aivent/background/3.webp)', backgroundSize:'cover', backgroundPosition:'center', backgroundAttachment:'fixed' }}>
        <div className="absolute inset-0" style={{ background:'rgba(0,0,0,0.82)' }} />
        <div className="absolute top-0 left-0 right-0 h-1/4" style={{ background:'linear-gradient(180deg,#101435 0%,transparent 100%)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-1/4" style={{ background:'linear-gradient(0deg,#101435 0%,transparent 100%)' }} />
        <div className="relative mx-auto max-w-3xl text-center" style={{ zIndex:2 }}>
          <span className="aivent-subtitle" data-reveal>Start Today — It's Free</span>
          <h2 className="text-4xl md:text-6xl font-800 text-white tracking-tight mb-6" data-reveal data-delay="100">Join the Future of Job Search</h2>
          <p className="text-white/55 text-lg mb-10 leading-relaxed font-400" data-reveal data-delay="200">
            Thousands of job seekers are already using AI to get more interviews. Create your free account and start today.
          </p>
          <div data-reveal data-delay="300">
            {isLoggedIn
              ? <Link href="/cv" className="btn-aivent fx-slide" style={{ fontSize:'14px', padding:'16px 40px' }} data-hover="OPEN DASHBOARD"><span>Open Dashboard</span></Link>
              : <Link href="/register" className="btn-aivent fx-slide" style={{ fontSize:'14px', padding:'16px 40px' }} data-hover="CREATE ACCOUNT"><span>Get Started Free</span></Link>
            }
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="text-white py-16 px-6" style={{ background:'#0d1130', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
            <div>
              <h3 className="font-700 text-white/50 text-sm uppercase tracking-widest mb-2">Address</h3>
              <p className="text-white/50 text-sm font-400">121 AI Blvd, San Francisco<br />BCA 94107</p>
            </div>
            <div className="flex flex-col items-center gap-4">
              <img src="/aivent/logo.webp" alt="JobHunter" style={{ height:'42px', width:'auto' }} />
              <div className="flex items-center gap-6 mt-1">
                {['Sign In', 'Register', 'Features', 'Pricing'].map((l, i) => (
                  <a key={l} href={['#login','#register','#features','#pricing'][i]} className="text-xs text-white/35 hover:text-white/80 transition-colors font-600 uppercase tracking-widest">{l}</a>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-700 text-white/50 text-sm uppercase tracking-widest mb-2">Contact Us</h3>
              <p className="text-white/50 text-sm font-400">M. support@jobhunter.app</p>
            </div>
          </div>
          <div className="mt-10 pt-6 text-center" style={{ borderTop:'1px solid rgba(255,255,255,0.05)' }}>
            <p className="text-white/25 text-xs font-400 tracking-wide">Copyright {new Date().getFullYear()} — JobHunter · AI-Powered Job Search</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
