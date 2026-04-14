'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, FileSearch, FileSignature, Kanban, Sparkles, CheckCircle, BarChart3, Zap, Shield } from 'lucide-react';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    setIsLoggedIn(!!token);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* ── NAVBAR ── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg shadow-violet-500/30">
              <span className="text-sm font-black text-white leading-none">JH</span>
            </div>
            <span className="text-base font-bold text-foreground tracking-tight">JobHunter</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-600 text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm font-600 text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
            <a href="#stats" className="text-sm font-600 text-muted-foreground hover:text-foreground transition-colors">Results</a>
          </nav>

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link
                href="/cv"
                className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-700 text-white hover:bg-violet-500 transition-all hover:shadow-lg hover:shadow-violet-500/25"
              >
                Go to App <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm font-600 text-muted-foreground hover:text-foreground transition-colors">
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-700 text-white hover:bg-violet-500 transition-all hover:shadow-lg hover:shadow-violet-500/25"
                >
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
        {/* Background glows */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-[600px] w-[600px] rounded-full bg-violet-600/20 blur-[140px]" />
          <div className="absolute top-1/3 left-1/4 h-[400px] w-[400px] rounded-full bg-fuchsia-600/10 blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 h-[300px] w-[300px] rounded-full bg-violet-500/10 blur-[100px]" />
        </div>

        {/* Dot grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative z-10 mx-auto max-w-6xl px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 mb-8">
            <Sparkles className="h-3.5 w-3.5 text-violet-400" />
            <span className="text-xs font-700 uppercase tracking-widest text-violet-300">AI-Powered Job Search</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-800 tracking-tight leading-[1.1] mb-6">
            Land Your{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, #a78bfa 0%, #764df0 50%, #ec4899 100%)' }}
            >
              Dream Job
            </span>
            <br />with AI Precision
          </h1>

          <p className="mx-auto max-w-2xl text-lg md:text-xl text-muted-foreground leading-relaxed mb-10 font-400">
            Analyze your CV against any job description, generate tailored cover letters,
            and track every application — all powered by cutting-edge AI.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            {isLoggedIn ? (
              <Link
                href="/cv"
                className="group flex items-center gap-2 rounded-xl bg-violet-600 px-8 py-4 text-base font-700 text-white hover:bg-violet-500 transition-all hover:shadow-2xl hover:shadow-violet-500/30 hover:-translate-y-0.5"
              >
                Open Dashboard
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="group flex items-center gap-2 rounded-xl bg-violet-600 px-8 py-4 text-base font-700 text-white hover:bg-violet-500 transition-all hover:shadow-2xl hover:shadow-violet-500/30 hover:-translate-y-0.5"
                >
                  Get Started Free
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/login"
                  className="rounded-xl border border-border bg-card/60 px-8 py-4 text-base font-600 text-foreground hover:bg-card hover:border-violet-500/30 transition-all hover:-translate-y-0.5"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>

          {/* Mini stats */}
          <div className="flex flex-wrap justify-center gap-8">
            {[
              { value: '10K+', label: 'CVs Analyzed' },
              { value: '85%', label: 'Score Improvement' },
              { value: '3×', label: 'More Interviews' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-800 text-foreground tracking-tight">{s.value}</p>
                <p className="text-xs font-600 uppercase tracking-widest text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MARQUEE STRIP ── */}
      <div className="relative overflow-hidden border-y border-border/50 py-5" style={{ background: 'linear-gradient(90deg, oklch(0.59 0.245 291) 0%, oklch(0.50 0.22 285) 100%)' }}>
        <div className="animate-marquee">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center">
              {['CV Analysis', 'ATS Optimization', 'Smart Matching', 'Cover Letters', 'Job Tracking', 'AI Insights', 'Interview Prep', 'Score Boost'].map((item) => (
                <span key={item} className="flex items-center">
                  <span className="text-2xl font-800 text-white/90 px-8 whitespace-nowrap tracking-wide uppercase">{item}</span>
                  <span className="text-white/30 text-3xl font-300">/</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section id="features" className="py-32 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 mb-6">
              <span className="text-xs font-700 uppercase tracking-widest text-violet-300">Features</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-800 tracking-tight mb-4">
              Everything You Need to{' '}
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #a78bfa 0%, #764df0 100%)' }}>
                Get Hired
              </span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-400">
              Four powerful AI tools working together to maximize your chances of landing your next role.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: FileSearch,
                title: 'CV Analyzer',
                desc: 'Upload your CV and paste any job description. Get an ATS score, keyword gap analysis, and actionable improvement suggestions in seconds.',
                href: '/cv',
                color: 'from-violet-500/20 to-violet-600/5',
                iconColor: 'text-violet-400',
                iconBg: 'bg-violet-500/15',
                borderHover: 'hover:border-violet-500/30',
              },
              {
                icon: FileSignature,
                title: 'Cover Letter Generator',
                desc: 'Generate compelling, personalized cover letters tailored to each job. Choose your tone — formal, balanced, or friendly.',
                href: '/cover-letter',
                color: 'from-fuchsia-500/20 to-fuchsia-600/5',
                iconColor: 'text-fuchsia-400',
                iconBg: 'bg-fuchsia-500/15',
                borderHover: 'hover:border-fuchsia-500/30',
              },
              {
                icon: Kanban,
                title: 'Job Tracker',
                desc: 'Track every application from saved to offer. Visual kanban board keeps you organized across your entire job search.',
                href: '/tracker',
                color: 'from-blue-500/20 to-blue-600/5',
                iconColor: 'text-blue-400',
                iconBg: 'bg-blue-500/15',
                borderHover: 'hover:border-blue-500/30',
              },
              {
                icon: BarChart3,
                title: 'CV History & Analytics',
                desc: 'Review every CV analysis you\'ve done. Track your score progress over time and see which optimizations worked best.',
                href: '/cv-history',
                color: 'from-emerald-500/20 to-emerald-600/5',
                iconColor: 'text-emerald-400',
                iconBg: 'bg-emerald-500/15',
                borderHover: 'hover:border-emerald-500/30',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className={`group relative rounded-2xl border border-border bg-card/60 p-8 overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl ${feature.borderHover}`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                <div className="relative z-10">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${feature.iconBg} mb-5`}>
                    <feature.icon className={`h-6 w-6 ${feature.iconColor}`} />
                  </div>
                  <h3 className="text-xl font-700 text-foreground mb-3 tracking-tight">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed font-400">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-32 px-6" style={{ background: 'var(--card)' }}>
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 mb-6">
              <span className="text-xs font-700 uppercase tracking-widest text-violet-300">How It Works</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-800 tracking-tight">
              Three Steps to Your{' '}
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #a78bfa 0%, #764df0 100%)' }}>
                Next Interview
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                icon: FileSearch,
                title: 'Upload Your CV',
                desc: 'Drop your CV and paste the job description you want to apply for.',
              },
              {
                step: '02',
                icon: Sparkles,
                title: 'Get AI Analysis',
                desc: 'Our AI scores your CV, identifies gaps, and generates optimized suggestions instantly.',
              },
              {
                step: '03',
                icon: Zap,
                title: 'Apply with Confidence',
                desc: 'Use your optimized CV and AI cover letter to stand out from the competition.',
              },
            ].map((step, i) => (
              <div key={step.step} className="relative">
                {i < 2 && (
                  <div className="hidden md:block absolute top-8 left-[calc(100%-1rem)] w-8 h-px bg-gradient-to-r from-violet-500/50 to-transparent z-10" />
                )}
                <div className="rounded-2xl border border-border bg-background/60 p-8 h-full">
                  <div className="text-5xl font-800 tracking-tighter mb-4" style={{ color: 'oklch(0.59 0.245 291 / 0.2)' }}>{step.step}</div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/15 mb-5">
                    <step.icon className="h-5 w-5 text-violet-400" />
                  </div>
                  <h3 className="text-lg font-700 text-foreground mb-3 tracking-tight">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed font-400">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section id="stats" className="py-32 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-3xl border border-violet-500/20 overflow-hidden relative" style={{ background: 'linear-gradient(135deg, oklch(0.17 0.068 263) 0%, oklch(0.15 0.065 262) 100%)' }}>
            {/* Glow */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 h-64 w-96 rounded-full bg-violet-600/15 blur-[80px]" />
            </div>

            <div className="relative z-10 p-12 md:p-16">
              <div className="text-center mb-12">
                <h2 className="text-4xl md:text-5xl font-800 tracking-tight mb-4">
                  Real Results for{' '}
                  <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #a78bfa 0%, #764df0 100%)' }}>
                    Real People
                  </span>
                </h2>
                <p className="text-muted-foreground text-lg font-400">Numbers from job seekers who used JobHunter to land their roles.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                {[
                  { value: '10,000+', label: 'CVs Analyzed', icon: FileSearch },
                  { value: '85%', label: 'Average Score Improvement', icon: BarChart3 },
                  { value: '3×', label: 'More Interview Callbacks', icon: Zap },
                ].map((stat) => (
                  <div key={stat.label} className="text-center p-6 rounded-2xl border border-border/50 bg-background/30">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/15 mx-auto mb-4">
                      <stat.icon className="h-6 w-6 text-violet-400" />
                    </div>
                    <p className="text-4xl font-800 tracking-tight text-foreground mb-2">{stat.value}</p>
                    <p className="text-sm font-600 text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-32 px-6 text-center relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-violet-600/15 blur-[120px]" />
        </div>
        <div className="relative z-10 mx-auto max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 mb-8">
            <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-xs font-700 uppercase tracking-widest text-emerald-300">Free to Start</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-800 tracking-tight mb-6">
            Ready to Land Your{' '}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #a78bfa 0%, #764df0 50%, #ec4899 100%)' }}>
              Dream Job?
            </span>
          </h2>
          <p className="text-xl text-muted-foreground mb-10 font-400">
            Join thousands of job seekers using AI to get more interviews. No credit card required.
          </p>
          {isLoggedIn ? (
            <Link
              href="/cv"
              className="group inline-flex items-center gap-2 rounded-xl bg-violet-600 px-10 py-4 text-base font-700 text-white hover:bg-violet-500 transition-all hover:shadow-2xl hover:shadow-violet-500/30 hover:-translate-y-0.5"
            >
              Open Dashboard <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          ) : (
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 rounded-xl bg-violet-600 px-10 py-4 text-base font-700 text-white hover:bg-violet-500 transition-all hover:shadow-2xl hover:shadow-violet-500/30 hover:-translate-y-0.5"
            >
              Get Started Free <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          )}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-border/50 py-10 px-6">
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600">
              <span className="text-xs font-black text-white">JH</span>
            </div>
            <span className="text-sm font-700 text-foreground">JobHunter</span>
          </div>
          <p className="text-sm text-muted-foreground font-400">
            © {new Date().getFullYear()} JobHunter. AI-powered job search tools.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-500">Sign In</Link>
            <Link href="/register" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-500">Register</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
