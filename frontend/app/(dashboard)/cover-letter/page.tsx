'use client';

import { useEffect, useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useCoverLetterStore } from '@/store/coverLetterStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import UsageMeter from '@/components/usage/UsageMeter';
import LimitReachedCard from '@/components/usage/LimitReachedCard';
import toast from 'react-hot-toast';
import { Copy, Check, RotateCcw, Upload, FileText, X, Send, Sparkles } from 'lucide-react';

const tones = [
  { key: 'balanced', label: 'Balanced' },
  { key: 'formal',   label: 'Formal'   },
  { key: 'friendly', label: 'Friendly' },
];

const glass = {
  background: 'rgba(0,0,0,0.30)',
  backdropFilter: 'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)',
  border: '1px solid rgba(255,255,255,0.08)',
} as const;

export default function CoverLetterPage() {
  const {
    pageResult: result,
    pageLoading: loading,
    pageTone: tone,
    pageRefining: refining,
    pageJobDescription: jobDescription,
    setPageTone: setTone,
    setPageJobDescription: setJobDescription,
    generateFromPdf,
    refinePage,
    setPageResult: setResult,
  } = useCoverLetterStore();

  const { subscription, usage, fetchSubscription } = useSubscriptionStore();
  useEffect(() => { if (!subscription) fetchSubscription(); }, [subscription, fetchSubscription]);
  const clUsed  = usage?.cover_letter.used  ?? 0;
  const clLimit = usage?.cover_letter.limit ?? 5;
  const clOverLimit = clLimit < 999999 && clUsed >= clLimit;

  const [file,         setFile]         = useState<File | null>(null);
  const [copied,       setCopied]       = useState(false);
  const [refineInput,  setRefineInput]  = useState('');

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted.length > 0) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
  });

  const handleGenerate = async () => {
    if (!file) { toast.error('Please upload your CV'); return; }
    if (!jobDescription.trim()) { toast.error('Paste the job description'); return; }
    await generateFromPdf(file, jobDescription, tone);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefine = async () => {
    if (!refineInput.trim() || !result) return;
    await refinePage(result, refineInput);
    setRefineInput('');
  };

  const isFormPhase = !result && !loading;
  const isLoadingPhase = loading && !result;

  return (
    <div
      style={{
        width: '100vw',
        maxWidth: '100vw',
        marginLeft: 'calc(-50vw + 50%)',
        marginTop: '-32px',
        marginBottom: '-32px',
        background: '#0a0d28',
        position: 'relative',
        zIndex: 2,
        minHeight: 'calc(100vh - 56px)',
        overflowX: 'hidden',
      }}
    >

      {/* ══ HERO SECTION ═══════════════════════════════ */}
      <section
        className="relative overflow-hidden pt-12 sm:pt-[72px] pb-8 sm:pb-10"
        style={{
          backgroundImage: isLoadingPhase ? 'none' : 'url(/aivent/background/4.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          minHeight: 'calc(100vh - 56px)',
          display: 'flex',
          flexDirection: 'column' as const,
          justifyContent: 'center',
        }}
      >
        {/* Video background — only during loading */}
        {isLoadingPhase && (
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            style={{ zIndex: 0 }}
          >
            <source src="/aivent/video/1.mp4" type="video/mp4" />
          </video>
        )}
        <div className="absolute inset-0" style={{ background: isLoadingPhase ? 'rgba(6,9,28,0.70)' : 'rgba(6,9,28,0.70)', zIndex: 1 }} />
        <div className="absolute bottom-0 left-0 right-0"
          style={{ height: '45%', background: 'linear-gradient(0deg,#0a0d28 0%,transparent 100%)', zIndex: 1 }} />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6" style={{ zIndex: 2 }}>

          {/* ── LOADING STATE: centered with video bg ── */}
          {isLoadingPhase && (
            <div className="flex flex-col items-center justify-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
              <span className="aivent-subtitle s2">AI-Generated</span>
              <h1
                className="text-white leading-[1.1] mb-4 text-center"
                style={{ fontSize: 'clamp(28px,6vw,52px)', fontWeight: 800, letterSpacing: '-0.02em' }}
              >
                Generating...
              </h1>
              <p className="text-center mb-10" style={{ color: 'rgba(255,255,255,0.50)', fontSize: '16px', lineHeight: 1.7, maxWidth: '480px' }}>
                Your cover letter is being crafted. Feel free to switch tabs.
              </p>

              <div className="rounded-2xl overflow-hidden w-full" style={{ ...glass, maxWidth: '400px' }}>
                <div style={{ height: '2px', background: 'linear-gradient(90deg,transparent,rgba(118,77,240,0.9),transparent)' }} />
                <div className="flex flex-col items-center gap-4 p-10">
                  <div className="relative flex items-center justify-center h-14 w-14">
                    <div className="absolute inset-0 rounded-full animate-ping" style={{ background: 'rgba(118,77,240,0.2)' }} />
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-full"
                      style={{ background: 'rgba(118,77,240,0.15)', border: '2px solid rgba(118,77,240,0.4)' }}
                    >
                      <Sparkles className="h-6 w-6" style={{ color: '#a78bfa' }} />
                    </div>
                  </div>
                  <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    Writing your cover letter...
                  </p>
                  <div className="flex gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── FORM PHASE: left-aligned with image bg ── */}
          {isFormPhase && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">

              {/* LEFT — form */}
              <div>
                <span className="aivent-subtitle">AI-Generated</span>
                <h1
                  className="text-white leading-[1.1] mb-3"
                  style={{ fontSize: 'clamp(28px,6vw,52px)', fontWeight: 800, letterSpacing: '-0.02em' }}
                >
                  Cover Letter Generator
                </h1>
                <p className="mb-8" style={{ color: 'rgba(255,255,255,0.45)', fontSize: '15px', lineHeight: 1.7 }}>
                  Upload your CV, paste the job description, pick a tone — done in seconds.
                </p>

                {clOverLimit ? <LimitReachedCard feature="cover_letter" /> : (
                <>
                <UsageMeter feature="cover_letter" />
                <div className="rounded-2xl overflow-hidden" style={glass}>
                  <div style={{ height: '2px', background: 'linear-gradient(90deg,transparent,rgba(118,77,240,0.9),transparent)' }} />
                  <div className="p-4 sm:p-7 space-y-5">

                    {/* CV upload */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-widest mb-2"
                        style={{ color: 'rgba(255,255,255,0.3)' }}>
                        Your CV
                      </label>
                      {!file ? (
                        <div
                          {...getRootProps()}
                          className="cursor-pointer rounded-xl p-5 sm:p-8 text-center transition-all duration-200"
                          style={{
                            border: isDragActive ? '2px dashed rgba(118,77,240,0.8)' : '2px dashed rgba(255,255,255,0.1)',
                            background: isDragActive ? 'rgba(118,77,240,0.08)' : 'rgba(255,255,255,0.02)',
                            boxShadow: isDragActive ? '0 0 30px -8px rgba(118,77,240,0.3)' : 'none',
                          }}
                        >
                          <input {...getInputProps()} />
                          <div className="flex flex-col items-center gap-3">
                            <div
                              className="flex h-12 w-12 items-center justify-center rounded-xl transition-all"
                              style={{
                                background: isDragActive ? 'rgba(118,77,240,0.2)' : 'rgba(255,255,255,0.05)',
                                border: isDragActive ? '1px solid rgba(118,77,240,0.4)' : '1px solid rgba(255,255,255,0.08)',
                                transform: isDragActive ? 'scale(1.1)' : 'scale(1)',
                                color: isDragActive ? '#a78bfa' : 'rgba(255,255,255,0.35)',
                              }}
                            >
                              <Upload className="h-5 w-5" />
                            </div>
                            <p className="text-sm font-semibold"
                              style={{ color: isDragActive ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)' }}>
                              {isDragActive ? 'Drop your CV here' : 'Drop CV here or click to browse'}
                            </p>
                            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>PDF · max 5 MB</p>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="flex items-center gap-4 rounded-xl px-5 py-4"
                          style={{ background: 'rgba(118,77,240,0.08)', border: '1px solid rgba(118,77,240,0.22)' }}
                        >
                          <div
                            className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0"
                            style={{ background: 'rgba(118,77,240,0.18)', border: '1px solid rgba(118,77,240,0.3)' }}
                          >
                            <FileText className="h-5 w-5" style={{ color: '#a78bfa' }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate" style={{ color: 'rgba(255,255,255,0.85)' }}>{file.name}</p>
                            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{(file.size / 1024).toFixed(0)} KB</p>
                          </div>
                          <button
                            onClick={() => setFile(null)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                            style={{ color: 'rgba(255,255,255,0.3)' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.7)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.3)'; }}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Job description */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-widest mb-2"
                        style={{ color: 'rgba(255,255,255,0.3)' }}>
                        Job Description
                      </label>
                      <textarea
                        placeholder="Paste the job description here..."
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        rows={5}
                        className="w-full rounded-xl px-4 py-3 text-sm resize-none outline-none transition-all"
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          color: 'rgba(255,255,255,0.8)',
                          maxHeight: '180px',
                          overflowY: 'auto',
                        }}
                        onFocus={e => { e.currentTarget.style.borderColor = 'rgba(118,77,240,0.45)'; }}
                        onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                      />
                    </div>

                    {/* Tone + Generate */}
                    <div className="flex items-center gap-3 flex-wrap pt-1">
                      <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>
                        Tone
                      </span>
                      {tones.map((t) => (
                        <button
                          key={t.key}
                          onClick={() => setTone(t.key)}
                          className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
                          style={tone === t.key
                            ? { background: 'rgba(118,77,240,0.2)', color: '#c4b5fd', border: '1px solid rgba(118,77,240,0.4)' }
                            : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.07)' }
                          }
                        >
                          {t.label}
                        </button>
                      ))}
                      <button
                        onClick={handleGenerate}
                        disabled={!file || !jobDescription.trim()}
                        className="flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold ml-auto transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{
                          background: 'rgba(118,77,240,0.2)',
                          border: '1px solid rgba(118,77,240,0.35)',
                          color: '#c4b5fd',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(118,77,240,0.3)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(118,77,240,0.2)'; }}
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        Generate
                      </button>
                    </div>

                  </div>
                </div>
                </>
                )}
              </div>

              {/* RIGHT — news/s6.webp */}
              <div className="hidden lg:block">
                <div className="relative overflow-hidden rounded-2xl" style={{ aspectRatio: '3/4' }}>
                  <img
                    src="/aivent/news/s6.webp"
                    alt=""
                    className="w-full h-full object-cover"
                    style={{ transition: 'transform 0.7s ease' }}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                  />
                  <div className="absolute inset-0"
                    style={{ background: 'linear-gradient(135deg,rgba(118,77,240,0.15) 0%,transparent 55%)' }} />
                  <div className="absolute bottom-0 left-0 right-0"
                    style={{ height: '40%', background: 'linear-gradient(0deg,rgba(6,9,28,0.75) 0%,transparent 100%)' }} />
                  <div
                    className="absolute bottom-6 left-6 right-6 rounded-xl px-5 py-4"
                    style={{
                      background: 'rgba(0,0,0,0.45)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <p className="text-white font-bold text-sm mb-0.5">AI-tailored in seconds</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      Personalized to the role, optimized to get past recruiters.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ── RESULT PHASE ─────────────────────────────────────── */}
          {result && (
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-10">
                <span className="aivent-subtitle s2">Ready</span>
                <h1
                  className="text-white leading-[1.1]"
                  style={{ fontSize: 'clamp(28px,4vw,46px)', fontWeight: 800, letterSpacing: '-0.02em' }}
                >
                  Your Cover Letter
                </h1>
              </div>

              {/* action bar */}
              <div className="flex items-center gap-3 mb-5 flex-wrap">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all"
                  style={{ background: 'rgba(118,77,240,0.2)', border: '1px solid rgba(118,77,240,0.35)', color: '#c4b5fd' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(118,77,240,0.3)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(118,77,240,0.2)'; }}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied!' : 'Copy to Clipboard'}
                </button>
                <button
                  onClick={() => setResult('')}
                  className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.5)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.8)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)'; }}
                >
                  <RotateCcw className="h-4 w-4" />
                  Regenerate
                </button>
              </div>

              {/* letter body */}
              <div className="rounded-2xl overflow-hidden mb-5" style={glass}>
                <div style={{ height: '2px', background: 'linear-gradient(90deg,transparent,rgba(118,77,240,0.9),transparent)' }} />
                <div className="p-5 sm:p-8">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words" style={{ color: 'rgba(255,255,255,0.82)', overflowWrap: 'anywhere' }}>
                    {result}
                  </p>
                </div>
              </div>

              {/* refine bar */}
              <div className="rounded-2xl p-4 sm:p-5" style={{ background: 'rgba(118,77,240,0.05)', border: '1px solid rgba(118,77,240,0.15)' }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  Refine with AI
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={refineInput}
                    onChange={(e) => setRefineInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !refining) handleRefine(); }}
                    placeholder="e.g. Make it shorter, more confident, emphasize leadership..."
                    disabled={refining}
                    className="flex-1 h-10 rounded-xl px-4 text-sm outline-none transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.09)',
                      color: 'rgba(255,255,255,0.8)',
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = 'rgba(118,77,240,0.45)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'; }}
                  />
                  <button
                    onClick={handleRefine}
                    disabled={refining || !refineInput.trim()}
                    className="flex h-10 w-10 items-center justify-center rounded-xl transition-all disabled:opacity-35"
                    style={{ background: 'rgba(118,77,240,0.25)', border: '1px solid rgba(118,77,240,0.4)', color: '#c4b5fd' }}
                    onMouseEnter={e => { if (!refining) (e.currentTarget as HTMLElement).style.background = 'rgba(118,77,240,0.38)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(118,77,240,0.25)'; }}
                  >
                    {refining
                      ? <span className="lds-roller-sm" style={{ color: '#c4b5fd' }}><span /><span /><span /><span /><span /><span /><span /><span /></span>
                      : <Send className="h-3.5 w-3.5" />
                    }
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </section>

    </div>
  );
}
