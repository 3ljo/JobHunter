'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CVUpload from '@/components/cv/CVUpload';
import CVPreview from '@/components/cv/CVPreview';
import QuickEditBox from '@/components/cv/QuickEditBox';
import ScoreRing from '@/components/cv/ScoreRing';
import AnalysisSidebar from '@/components/cv/AnalysisSidebar';
import TemplatePicker from '@/components/cv/TemplatePicker';
import PhotoUpload from '@/components/cv/PhotoUpload';
import { TEMPLATES } from '@/components/cv/templates';
import { downloadCVPdf } from '@/lib/api';
import { useCVAnalysisStore } from '@/store/cvAnalysisStore';
import { useCoverLetterStore } from '@/store/coverLetterStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import toast from 'react-hot-toast';
import {
  Download, RotateCcw, ArrowRight, TrendingUp, FileSignature,
  Sparkles, Copy, Check, X, Send, Palette,
} from 'lucide-react';

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

export default function CVPage() {
  const router = useRouter();
  const {
    result, setResult, reset: resetAnalysis,
    loading: analysisLoading, step: analysisStep, steps: analysisSteps,
    template, photo, setTemplate, setPhoto,
  } = useCVAnalysisStore();

  const { subscription } = useSubscriptionStore();
  const isPro = subscription?.plan === 'pro' || subscription?.plan === 'pro_plus';

  const [downloading, setDownloading] = useState(false);

  const activeTemplateMeta = TEMPLATES[template];
  const showPhotoSlot = activeTemplateMeta?.supportsPhoto;

  const {
    inlineResult: clResult,
    inlineLoading: clLoading,
    inlineTone: clTone,
    inlineRefining: clRefining,
    setInlineTone: setCLTone,
    generateInline,
    refineInline,
    setInlineResult: setCLResult,
    resetInline,
  } = useCoverLetterStore();

  const [showCL,        setShowCL]        = useState(() => !!clResult);
  const [clCopied,      setClCopied]      = useState(false);
  const [clRefineInput, setClRefineInput] = useState('');

  const handleRefine = (updatedFinalCV: any) => {
    if (!result) return;
    setResult({ ...result, final: { ...result.final, final_cv: updatedFinalCV } });
  };

  const handleDownload = async () => {
    if (!result?.cv_record_id) return;
    setDownloading(true);
    try {
      const photoForExport = showPhotoSlot ? photo : null;
      await downloadCVPdf(result.cv_record_id, { template, photo: photoForExport });
      toast.success('PDF downloaded');
    } catch {
      toast.error('Failed to download PDF');
    } finally {
      setDownloading(false);
    }
  };

  const handleReset       = () => { resetAnalysis(); setShowCL(false); resetInline(); };
  const handleGenerateCL  = async () => {
    const cvText = sessionStorage.getItem('cl_cv_text') || '';
    const jd     = sessionStorage.getItem('cl_job_description') || '';
    if (!cvText || !jd) { toast.error('Missing CV or job description data'); return; }
    await generateInline(cvText, jd, clTone);
  };
  const handleRefineCL = async () => {
    if (!clRefineInput.trim() || !clResult) return;
    await refineInline(clResult, clRefineInput);
    setClRefineInput('');
  };
  const handleCopyCL = async () => {
    await navigator.clipboard.writeText(clResult);
    setClCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setClCopied(false), 2000);
  };

  const finalCV = result?.final?.final_cv;

  /* ══ UPLOAD / LOADING PHASE ══════════════════════════════════════ */
  if (!result) {
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
        {/* ── HERO SECTION ──────── */}
        <section
          className="relative overflow-hidden pt-12 sm:pt-[72px] pb-8 sm:pb-10"
          style={{
            backgroundImage: analysisLoading ? 'none' : 'url(/aivent/background/6.webp)',
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
            minHeight: 'calc(100vh - 56px)',
            display: 'flex',
            flexDirection: 'column' as const,
            justifyContent: 'center',
          }}
        >
          {/* Video background — only during analysis */}
          {analysisLoading && (
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
          {/* dark overlay */}
          <div className="absolute inset-0" style={{ background: analysisLoading ? 'rgba(8,11,32,0.70)' : 'rgba(8,11,32,0.65)', zIndex: 1 }} />
          {/* bottom fade */}
          <div className="absolute bottom-0 left-0 right-0"
            style={{ height: '40%', background: 'linear-gradient(0deg,#0d1130 0%,transparent 100%)', zIndex: 1 }} />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6" style={{ zIndex: 2 }}>

            {/* ── LOADING STATE: centered with video bg ── */}
            {analysisLoading ? (
              <div className="flex flex-col items-center justify-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
                <span className="aivent-subtitle s2">AI-Powered</span>
                <h1
                  className="text-white leading-[1.1] mb-4 text-center"
                  style={{ fontSize: 'clamp(28px,6vw,52px)', fontWeight: 800, letterSpacing: '-0.02em' }}
                >
                  Analyzing Your CV...
                </h1>
                <p className="text-center mb-10 px-2" style={{ color: 'rgba(255,255,255,0.50)', fontSize: '15px', lineHeight: 1.7, maxWidth: '480px' }}>
                  Your analysis is running. You can switch tabs — it won't be interrupted.
                </p>

                <div className="rounded-2xl overflow-hidden w-full" style={{ ...glass, maxWidth: '480px' }}>
                  <div style={{ height: '2px', background: 'linear-gradient(90deg,transparent,rgba(118,77,240,0.9),transparent)' }} />
                  <div className="p-5 sm:p-7 space-y-4">
                    <p className="text-xs font-bold uppercase tracking-widest mb-6" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      Analysis Progress
                    </p>
                    {analysisSteps.map((s, i) => (
                      <div
                        key={s}
                        className="flex items-center gap-3 text-sm transition-all duration-300"
                        style={{ color: i <= analysisStep ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.2)' }}
                      >
                        <div
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                          style={{
                            background: i < analysisStep ? 'rgba(118,77,240,0.25)'
                              : i === analysisStep ? 'rgba(118,77,240,0.15)'
                              : 'rgba(255,255,255,0.04)',
                            border: i === analysisStep ? '2px solid rgba(118,77,240,0.5)' : '1px solid transparent',
                            color: i <= analysisStep ? '#a78bfa' : 'rgba(255,255,255,0.2)',
                          }}
                        >
                          {i < analysisStep ? <Check className="h-3.5 w-3.5" />
                            : i === analysisStep ? <div className="h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
                            : <div className="h-1.5 w-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
                          }
                        </div>
                        <span className="font-semibold">{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* ── UPLOAD STATE: left-aligned with image bg ── */
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
                <div>
                  <span className="aivent-subtitle">AI-Powered</span>
                  <h1
                    className="text-white leading-[1.1] mb-3"
                    style={{ fontSize: 'clamp(28px,6vw,52px)', fontWeight: 800, letterSpacing: '-0.02em' }}
                  >
                    ATS CV Analyzer
                  </h1>
                  <p className="mb-8" style={{ color: 'rgba(255,255,255,0.45)', fontSize: '15px', lineHeight: 1.7 }}>
                    Upload your CV + paste a job description. Get ATS score, keyword gaps, and a fully rewritten CV in seconds.
                  </p>

                  <div className="rounded-2xl overflow-hidden" style={glass}>
                    <div style={{ height: '2px', background: 'linear-gradient(90deg,transparent,rgba(118,77,240,0.9),transparent)' }} />
                    <div className="p-4 sm:p-7">
                      <CVUpload />
                    </div>
                  </div>

                  <ul className="ul-check mt-6 space-y-2">
                    <li style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>ATS keyword gap analysis</li>
                    <li style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>AI-rewritten CV optimized for the role</li>
                    <li style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>Cover letter generated from the same analysis</li>
                  </ul>
                </div>
              </div>
            )}

          </div>
        </section>

      </div>
    );
  }

  /* ══ RESULTS PHASE ════════════════════════════════════════════════ */
  const scoreDelta = result.scores.projected_ats - result.scores.current_ats;

  return (
    <div
      style={{
        width: '100vw',
        maxWidth: '100vw',
        marginLeft: 'calc(-50vw + 50%)',
        marginTop: '-32px',
        background: '#0d1130',
        position: 'relative',
        zIndex: 2,
        paddingBottom: '60px',
        overflowX: 'hidden',
      }}
    >
      {/* ── RESULTS HEADER — background/2.webp (different!) ────────── */}
      <section
        className="relative overflow-hidden pt-8 pb-10 sm:pt-14 sm:pb-20"
        style={{
          backgroundImage: 'url(/aivent/background/2.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0" style={{ background: 'rgba(8,11,35,0.85)' }} />
        <div className="absolute bottom-0 left-0 right-0"
          style={{ height: '50%', background: 'linear-gradient(0deg,#0d1130 0%,transparent 100%)' }} />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6" style={{ zIndex: 2 }}>
          <div className="text-center mb-6 sm:mb-8">
            <span className="aivent-subtitle s2">Analysis Complete</span>
            <h1
              className="text-white leading-[1.1]"
              style={{ fontSize: 'clamp(22px,5.5vw,42px)', fontWeight: 800, letterSpacing: '-0.02em' }}
            >
              Your ATS Score Report
            </h1>
          </div>

          {/* score card */}
          <div className="mx-auto max-w-3xl rounded-2xl overflow-hidden" style={glass}>
            <div style={{ height: '2px', background: 'linear-gradient(90deg,transparent,rgba(118,77,240,0.9),transparent)' }} />
            <div className="flex flex-col sm:flex-row items-center justify-between gap-5 sm:gap-6 px-4 sm:px-8 py-5 sm:py-6">

              {/* scores */}
              <div className="flex items-center justify-center gap-4 sm:gap-6 flex-wrap">
                <div className="text-center">
                  <span
                    className="font-black tabular-nums block"
                    style={{
                      fontSize: 'clamp(32px,8vw,42px)',
                      lineHeight: 1,
                      background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {result.scores.current_ats}%
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 mt-1 block">Current</span>
                </div>

                {scoreDelta > 0 && (
                  <span className="flex items-center gap-1 text-sm font-black" style={{ color: '#34d399' }}>
                    <TrendingUp className="h-4 w-4" />+{scoreDelta}
                  </span>
                )}

                <div className="text-center">
                  <span
                    className="font-black tabular-nums block"
                    style={{
                      fontSize: 'clamp(32px,8vw,42px)',
                      lineHeight: 1,
                      background: 'linear-gradient(135deg, #764DF0, #5b21b6)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {result.scores.projected_ats}%
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 mt-1 block">Projected</span>
                </div>
              </div>

              {/* actions */}
              <div className="flex flex-wrap items-center justify-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200"
                  style={{ background: 'rgba(118,77,240,0.18)', border: '1px solid rgba(118,77,240,0.32)', color: '#c4b5fd' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(118,77,240,0.28)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(118,77,240,0.18)'; }}
                >
                  <Download className="h-4 w-4" />
                  {downloading ? 'Downloading…' : 'PDF'}
                </button>
                <button
                  onClick={() => setShowCL(true)}
                  className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.6)'; }}
                >
                  <FileSignature className="h-4 w-4" />
                  Cover Letter
                </button>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-200"
                  style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.3)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.7)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.3)'; }}
                >
                  <RotateCcw className="h-4 w-4" />
                  New
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTENT ───────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-6" style={{ position: 'relative', zIndex: 1 }}>

        {/* cover letter panel */}
        {(showCL || clLoading) && (
          <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(118,77,240,0.04)', border: '1px solid rgba(118,77,240,0.2)' }}>
            <div style={{ height: '1px', background: 'linear-gradient(90deg,transparent,rgba(118,77,240,0.7),transparent)' }} />
            <div className="flex items-center justify-between px-4 sm:px-6 py-4" style={{ borderBottom: '1px solid rgba(118,77,240,0.1)' }}>
              <div className="flex items-center gap-2.5 min-w-0">
                <FileSignature className="h-4 w-4 shrink-0" style={{ color: '#a78bfa' }} />
                <h3 className="text-sm font-bold truncate" style={{ color: 'rgba(255,255,255,0.8)' }}>Cover Letter Generator</h3>
              </div>
              <button
                onClick={() => setShowCL(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                style={{ color: 'rgba(255,255,255,0.25)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.7)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.25)'; }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 sm:p-6">
              {!clResult ? (
                <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>Tone</span>
                    {tones.map((t) => (
                      <button
                        key={t.key}
                        onClick={() => setCLTone(t.key)}
                        disabled={clLoading}
                        className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
                        style={clTone === t.key
                          ? { background: 'rgba(118,77,240,0.2)', color: '#c4b5fd', border: '1px solid rgba(118,77,240,0.4)' }
                          : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.07)' }
                        }
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleGenerateCL}
                    disabled={clLoading}
                    className="flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold sm:ml-auto transition-all duration-200"
                    style={{
                      background: clLoading ? 'rgba(118,77,240,0.12)' : 'rgba(118,77,240,0.2)',
                      border: '1px solid rgba(118,77,240,0.35)',
                      color: '#c4b5fd',
                    }}
                    onMouseEnter={e => { if (!clLoading) (e.currentTarget as HTMLElement).style.background = 'rgba(118,77,240,0.3)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(118,77,240,0.2)'; }}
                  >
                    {clLoading
                      ? <><span className="lds-roller-sm" style={{ color: '#c4b5fd' }}><span /><span /><span /><span /><span /><span /><span /><span /></span>Generating...</>
                      : <><Sparkles className="h-3.5 w-3.5" />Generate</>
                    }
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={handleCopyCL}
                      className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
                      style={{ background: 'rgba(118,77,240,0.2)', border: '1px solid rgba(118,77,240,0.35)', color: '#c4b5fd' }}
                    >
                      {clCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {clCopied ? 'Copied!' : 'Copy'}
                    </button>
                    <button
                      onClick={() => setCLResult('')}
                      className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Regenerate
                    </button>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'rgba(255,255,255,0.8)' }}>
                    {clResult}
                  </p>
                  <div className="flex gap-2 mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <input
                      type="text"
                      value={clRefineInput}
                      onChange={(e) => setClRefineInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !clRefining) handleRefineCL(); }}
                      placeholder="e.g. Make it shorter, more confident…"
                      disabled={clRefining}
                      className="flex-1 h-9 rounded-lg px-3 text-sm outline-none"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.8)' }}
                    />
                    <button
                      onClick={handleRefineCL}
                      disabled={clRefining || !clRefineInput.trim()}
                      className="flex h-9 w-9 items-center justify-center rounded-lg disabled:opacity-40"
                      style={{ background: 'rgba(118,77,240,0.25)', border: '1px solid rgba(118,77,240,0.4)', color: '#c4b5fd' }}
                    >
                      {clRefining
                        ? <span className="lds-roller-sm" style={{ color: '#c4b5fd' }}><span /><span /><span /><span /><span /><span /><span /><span /></span>
                        : <Send className="h-3.5 w-3.5" />
                      }
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* two-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-4 sm:gap-5 lg:gap-6">
          {/* CV column */}
          <div className="min-w-0 space-y-3 sm:space-y-4">

            {/* Template strip — always visible, compact */}
            <div className="rounded-2xl overflow-hidden p-3 sm:p-4" style={glass}>
              <div className="flex items-center gap-2 mb-2.5 sm:mb-3">
                <Palette className="h-3.5 w-3.5 shrink-0" style={{ color: '#a78bfa' }} />
                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-white/55">
                  Choose Template
                </p>
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                  style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.22)' }}
                >
                  ATS-OPTIMIZED
                </span>
              </div>

              <TemplatePicker
                value={template}
                onChange={(id) => {
                  setTemplate(id);
                  toast.success(`${TEMPLATES[id].name} applied`);
                }}
                isPro={isPro}
                onUpgrade={() => {
                  toast('Upgrade to Pro to unlock this template', { icon: '👑' });
                  router.push('/pricing');
                }}
              />

              {showPhotoSlot && (
                <div className="mt-3 pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <PhotoUpload value={photo} onChange={setPhoto} />
                </div>
              )}
            </div>

            {/* CV Preview — horizontal pages, sticky on large screens */}
            <div
              className="rounded-2xl overflow-hidden lg:sticky lg:top-20"
              style={glass}
            >
              <div style={{ height: '1px', background: 'linear-gradient(90deg,transparent,rgba(118,77,240,0.5),transparent)' }} />
              <div className="flex items-center justify-between px-3 sm:px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white/35">
                <span>Preview</span>
                <span className="hidden sm:inline">Swipe pages →</span>
                <span className="sm:hidden">← Swipe →</span>
              </div>
              <CVPreview cv={finalCV} template={template} photo={showPhotoSlot ? photo : null} />
            </div>
          </div>

          {/* Analysis + Quick Edit */}
          <div className="space-y-4 sm:space-y-5 min-w-0">
            <div className="rounded-2xl p-4 sm:p-5 overflow-hidden" style={glass}>
              <div className="-mx-4 sm:-mx-5 mb-4" style={{ height: '1px', background: 'linear-gradient(90deg,transparent,rgba(118,77,240,0.5),transparent)' }} />
              <AnalysisSidebar audit={result.audit} rewrite={result.rewrite} />
            </div>
            {isPro ? (
              <QuickEditBox cvRecordId={result.cv_record_id} onRefine={handleRefine} />
            ) : (
              <div
                className="rounded-2xl p-4 sm:p-5 overflow-hidden"
                style={{
                  background: 'linear-gradient(180deg,rgba(118,77,240,0.10),rgba(118,77,240,0.03))',
                  border: '1px solid rgba(118,77,240,0.28)',
                }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Sparkles className="h-4 w-4" style={{ color: '#c4b5fd' }} />
                  <p className="text-[11px] font-black uppercase tracking-widest text-white/55">
                    Quick Edit
                  </p>
                  <span
                    className="text-[9px] font-black px-1.5 py-0.5 rounded"
                    style={{ background: 'rgba(192,132,252,0.18)', color: '#e9d5ff', border: '1px solid rgba(192,132,252,0.35)' }}
                  >
                    PRO
                  </span>
                </div>
                <p className="text-[13px] text-white/70 leading-relaxed mb-3">
                  Tell the AI to tweak your CV in natural language — add certifications, adjust
                  dates, rewrite a bullet, change tone.
                </p>
                <button
                  type="button"
                  onClick={() => router.push('/pricing')}
                  className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold"
                  style={{
                    background: 'linear-gradient(135deg,#764DF0,#5b21b6)',
                    color: 'white',
                    boxShadow: '0 6px 18px rgba(118,77,240,0.35)',
                  }}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Upgrade to Pro to unlock
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
