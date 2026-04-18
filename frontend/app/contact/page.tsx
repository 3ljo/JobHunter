'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MapPin, Mail, Phone, Send, ArrowLeft, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSending(true);
    // Simulate send — replace with real endpoint later
    await new Promise((r) => setTimeout(r, 1500));
    setSent(true);
    setSending(false);
    toast.success('Message sent!');
  };

  const update = (key: string, val: string) => setForm({ ...form, [key]: val });

  return (
    <div className="min-h-screen text-white" style={{ background: '#0a0d24' }}>

      {/* ── HERO ── */}
      <section
        className="relative overflow-hidden"
        style={{
          backgroundImage: 'url(/aivent/background/3.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          paddingTop: '120px',
          paddingBottom: '80px',
        }}
      >
        <div className="absolute inset-0" style={{ background: 'rgba(8,11,32,0.82)' }} />
        <div className="absolute bottom-0 left-0 right-0" style={{ height: '50%', background: 'linear-gradient(0deg,#0a0d24 0%,transparent 100%)' }} />

        <div className="relative mx-auto max-w-7xl px-6" style={{ zIndex: 2 }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-end">
            <div>
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-white/30 hover:text-white/60 text-xs font-semibold uppercase tracking-widest mb-6 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
              </Link>
              <h1
                className="text-white leading-[1.05]"
                style={{ fontSize: 'clamp(42px,6vw,80px)', fontWeight: 800, letterSpacing: '-0.03em' }}
              >
                Contact
              </h1>
            </div>
            <div>
              <p className="text-white/50 text-base leading-relaxed" style={{ fontWeight: 400 }}>
                Have a question about JobHunter? Want to partner with us or need help with your account? We're here for you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTENT ── */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

            {/* LEFT — Contact Info */}
            <div>
              <span className="aivent-subtitle">Get In Touch</span>
              <h2
                className="text-white tracking-tight mb-6"
                style={{ fontSize: 'clamp(28px,3.5vw,42px)', fontWeight: 800 }}
              >
                We're here to answer your questions.
              </h2>
              <p className="text-white/45 text-base leading-relaxed mb-12" style={{ fontWeight: 400, maxWidth: '420px' }}>
                Have a question, suggestion, or just want to say hi? We're here and happy to hear from you!
              </p>

              <div className="space-y-6">
                {/* Location */}
                <div className="flex items-start gap-4">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: 'rgba(118,77,240,0.15)', border: '1px solid rgba(118,77,240,0.3)' }}
                  >
                    <MapPin className="h-5 w-5" style={{ color: '#a78bfa' }} />
                  </div>
                  <div>
                    <h4 className="text-white text-sm font-bold mb-1">Location</h4>
                    <p className="text-white/40 text-sm" style={{ fontWeight: 400 }}>Remote — Worldwide</p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-4">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: 'rgba(118,77,240,0.15)', border: '1px solid rgba(118,77,240,0.3)' }}
                  >
                    <Mail className="h-5 w-5" style={{ color: '#a78bfa' }} />
                  </div>
                  <div>
                    <h4 className="text-white text-sm font-bold mb-1">Send a Message</h4>
                    <p className="text-white/40 text-sm" style={{ fontWeight: 400 }}>support@jobhunter.ai</p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-4">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: 'rgba(118,77,240,0.15)', border: '1px solid rgba(118,77,240,0.3)' }}
                  >
                    <Phone className="h-5 w-5" style={{ color: '#a78bfa' }} />
                  </div>
                  <div>
                    <h4 className="text-white text-sm font-bold mb-1">Call Us</h4>
                    <p className="text-white/40 text-sm" style={{ fontWeight: 400 }}>+1 (555) 000-0000</p>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT — Form */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: '#131640', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div style={{ height: '2px', background: 'linear-gradient(90deg,transparent,rgba(118,77,240,0.8),transparent)' }} />

              {sent ? (
                <div className="flex flex-col items-center justify-center p-16 text-center gap-4">
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-2xl"
                    style={{ background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.3)' }}
                  >
                    <CheckCircle className="h-7 w-7" style={{ color: '#34d399' }} />
                  </div>
                  <h3 className="text-white text-xl font-bold">Message Sent!</h3>
                  <p className="text-white/45 text-sm" style={{ maxWidth: '320px' }}>
                    Thanks for reaching out. We'll get back to you as soon as possible.
                  </p>
                  <button
                    onClick={() => { setSent(false); setForm({ name: '', email: '', phone: '', message: '' }); }}
                    className="mt-2 text-xs font-bold uppercase tracking-widest transition-colors"
                    style={{ color: 'rgba(118,77,240,0.8)' }}
                  >
                    Send Another
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="p-8 space-y-5">
                  <div>
                    <h3 className="text-white text-lg font-bold mb-1">Get In Touch</h3>
                    <p className="text-white/40 text-sm mb-6" style={{ fontWeight: 400 }}>
                      Fill out the form below and we'll get back to you soon.
                    </p>
                  </div>

                  <input
                    type="text"
                    placeholder="Your Name *"
                    value={form.name}
                    onChange={(e) => update('name', e.target.value)}
                    required
                    className="w-full px-0 py-3 text-sm text-white bg-transparent outline-none placeholder-white/25"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderRadius: 0 }}
                    onFocus={(e) => { e.currentTarget.style.borderBottomColor = 'rgba(118,77,240,0.5)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderBottomColor = 'rgba(255,255,255,0.1)'; }}
                  />

                  <input
                    type="email"
                    placeholder="Your Email *"
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                    required
                    className="w-full px-0 py-3 text-sm text-white bg-transparent outline-none placeholder-white/25"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderRadius: 0 }}
                    onFocus={(e) => { e.currentTarget.style.borderBottomColor = 'rgba(118,77,240,0.5)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderBottomColor = 'rgba(255,255,255,0.1)'; }}
                  />

                  <input
                    type="tel"
                    placeholder="Your Phone"
                    value={form.phone}
                    onChange={(e) => update('phone', e.target.value)}
                    className="w-full px-0 py-3 text-sm text-white bg-transparent outline-none placeholder-white/25"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderRadius: 0 }}
                    onFocus={(e) => { e.currentTarget.style.borderBottomColor = 'rgba(118,77,240,0.5)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderBottomColor = 'rgba(255,255,255,0.1)'; }}
                  />

                  <textarea
                    placeholder="Your Message *"
                    value={form.message}
                    onChange={(e) => update('message', e.target.value)}
                    required
                    rows={4}
                    className="w-full px-0 py-3 text-sm text-white bg-transparent outline-none resize-none placeholder-white/25"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderRadius: 0 }}
                    onFocus={(e) => { e.currentTarget.style.borderBottomColor = 'rgba(118,77,240,0.5)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderBottomColor = 'rgba(255,255,255,0.1)'; }}
                  />

                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all duration-200"
                    style={{
                      background: sending ? 'rgba(118,77,240,0.3)' : '#764DF0',
                      color: '#fff',
                      boxShadow: '0 4px 24px rgba(118,77,240,0.35)',
                      opacity: sending ? 0.7 : 1,
                    }}
                    onMouseEnter={(e) => { if (!sending) (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 32px rgba(118,77,240,0.5)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 24px rgba(118,77,240,0.35)'; }}
                  >
                    {sending
                      ? <><span className="lds-roller-sm" style={{ color: '#fff' }}><span /><span /><span /><span /><span /><span /><span /><span /></span>Sending...</>
                      : <><Send className="h-4 w-4" />Send Message</>
                    }
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#0a0d24' }}>
        <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(118,77,240,0.4), transparent)' }} />
        <div className="mx-auto max-w-6xl px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/">
            <img src="/aivent/logo.png" alt="JobHunter" style={{ height: '56px', width: 'auto', opacity: 0.5 }} />
          </Link>
          <p className="text-white/20 text-xs">&copy; {new Date().getFullYear()} JobHunter. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
