'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CVUpload from '@/components/cv/CVUpload';
import CVPreview from '@/components/cv/CVPreview';
import QuickEditBox from '@/components/cv/QuickEditBox';
import ScoreRing from '@/components/cv/ScoreRing';
import AnalysisSidebar from '@/components/cv/AnalysisSidebar';
import TemplatePicker, { TemplateThumbnail } from '@/components/cv/TemplatePicker';
import PhotoUpload from '@/components/cv/PhotoUpload';
import { TEMPLATES, type TemplateId } from '@/components/cv/templates';
import UsageMeter from '@/components/usage/UsageMeter';
import LimitReachedCard from '@/components/usage/LimitReachedCard';
import { downloadCVPdf } from '@/lib/api';
import { useCVAnalysisStore } from '@/store/cvAnalysisStore';
import { useCoverLetterStore } from '@/store/coverLetterStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useAccountStore } from '@/store/accountStore';
import { getMyReferralInfo } from '@/lib/api';
import ShareCardModal from '@/components/share/ShareCardModal';
import toast from 'react-hot-toast';
import {
  Download, RotateCcw, ArrowRight, TrendingUp, FileSignature,
  Sparkles, Copy, Check, X, Send, Palette, ChevronDown, ChevronUp,
  Share2,
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
    originalPdfDataUrl,
    editsApplied, bumpEdits,
  } = useCVAnalysisStore();

  const isOriginal = template === 'original';
  const FALLBACK_TEMPLATE: TemplateId = 'harvard';

  const { subscription, usage, fetchSubscription } = useSubscriptionStore();
  // Any paid plan (starter pass, Pro, Pro Voice, or legacy Pro+) unlocks paid features.
  const isPro = subscription?.plan === 'pro'
    || subscription?.plan === 'pro_voice'
    || subscription?.plan === 'pro_plus'
    || subscription?.plan === 'starter';
  // Fallback: Pro / Pro Voice / Starter all grant unlimited CV analyses; Free gets 1.
  const cvLimit = usage?.cv.limit ?? (isPro ? 999999 : 1);
  const cvOverLimit = cvLimit < 999999 && (usage?.cv.used ?? 0) >= cvLimit;

  // Fetch usage on mount if not already loaded
  useEffect(() => { if (!subscription) fetchSubscription(); }, [subscription, fetchSubscription]);

  const [downloading, setDownloading] = useState(false);
  const [templatesExpanded, setTemplatesExpanded] = useState(false);
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);

  // Share-card state — visible when ATS score ≥ 90.
  const { profile } = useAccountStore();
  const [shareOpen, setShareOpen] = useState(false);
  const [shareImgUrl, setShareImgUrl] = useState('');
  const [shareRefUrl, setShareRefUrl] = useState('');
  const [shareScore, setShareScore] = useState(0);

  const activeTemplateMeta = TEMPLATES[template];
  const showPhotoSlot = activeTemplateMeta?.supportsPhoto;

  const openShareCard = async (score: number) => {
    const firstName = (profile?.full_name || '').split(' ')[0] || '';
    try {
      const refRes = await getMyReferralInfo();
      const code = refRes.data.code;
      const params = new URLSearchParams();
      if (firstName) params.set('name', firstName);
      params.set('score', String(score));
      if (code) params.set('ref', code);
      setShareImgUrl(`/api/og/score?${params.toString()}`);
      setShareRefUrl(refRes.data.share_url);
      setShareScore(score);
      setShareOpen(true);
    } catch {
      toast.error('Could not load your referral code — try again in a moment.');
    }
  };

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
    bumpEdits();
    // On "Original PDF" the preview is a static file and can't show the edits,
    // so nudge the user to a template view where the changes are visible.
    if (template === 'original') {
      toast(
        'Edit applied. Switch to an ATS template to see it rendered.',
        { icon: '💡', duration: 5500 },
      );
    }
  };

  const runDownload = async (templateId: TemplateId) => {
    if (!result?.cv_record_id) return;
    setDownloading(true);
    try {
      const meta = TEMPLATES[templateId];
      const photoForExport = meta?.supportsPhoto ? photo : null;
      await downloadCVPdf(result.cv_record_id, { template: templateId, photo: photoForExport });
      toast.success('PDF downloaded');
    } catch {
      toast.error('Failed to download PDF');
    } finally {
      setDownloading(false);
    }
  };

  const handleDownload = async () => {
    if (!result?.cv_record_id) return;
    // When the user is viewing the original PDF, make the choice explicit:
    // do they want the untouched file or the AI-edited version?
    if (isOriginal) {
      setDownloadDialogOpen(true);
      return;
    }
    await runDownload(template);
  };

  const handleDownloadOriginal = () => {
    if (!originalPdfDataUrl) {
      toast.error('Original file is not cached in this session');
      return;
    }
    const a = document.createElement('a');
    a.href = originalPdfDataUrl;
    a.download = 'original_cv.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setDownloadDialogOpen(false);
    toast.success('Original file downloaded');
  };

  const handleSwitchAndDownload = async () => {
    setTemplate(FALLBACK_TEMPLATE);
    setDownloadDialogOpen(false);
    await runDownload(FALLBACK_TEMPLATE);
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

                  {cvOverLimit ? (
                    <LimitReachedCard feature="cv" />
                  ) : (
                    <>
                      <UsageMeter feature="cv" />
                      <div className="rounded-2xl overflow-hidden" style={glass}>
                        <div style={{ height: '2px', background: 'linear-gradient(90deg,transparent,rgba(118,77,240,0.9),transparent)' }} />
                        <div className="p-4 sm:p-7">
                          <CVUpload />
                        </div>
                      </div>
                    </>
                  )}

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
    <>
    <ShareCardModal
      open={shareOpen}
      onClose={() => setShareOpen(false)}
      title={`${shareScore}% ATS — share your win`}
      description="Download the card or post it to LinkedIn/X. Every click on your referral link in the post earns you $10+ if it converts."
      imageUrl={shareImgUrl}
      downloadFilename={`cvclimber-ats-${shareScore}.png`}
      shareText={`Just hit ${shareScore}% ATS compatibility on my CV 🎯\n\nCvClimber's AI does the keyword match, formatting check, and bullet-quality audit for me. Try it free:`}
      referralUrl={shareRefUrl}
      eventName="ats_share"
      eventMeta={{ score: shareScore }}
    />
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
      {/* ── RESULTS HEADER — starfield bg, lighter overlay, decorative glow ── */}
      <section
        className="relative overflow-hidden pt-8 pb-10 sm:pt-14 sm:pb-20"
        style={{
          backgroundImage: 'url(/aivent/background/3.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* tinted overlay — kept lighter so the background image is actually visible */}
        <div className="absolute inset-0" style={{ background: 'rgba(8,11,35,0.55)' }} />
        {/* soft violet spotlight in the top-right so the robot area reads as a focal point */}
        <div
          className="absolute pointer-events-none hidden sm:block"
          style={{
            right: '-10%',
            top: '-20%',
            width: '55%',
            height: '140%',
            background:
              'radial-gradient(circle at 60% 40%, rgba(118,77,240,0.38) 0%, rgba(118,77,240,0.12) 35%, transparent 65%)',
            filter: 'blur(6px)',
          }}
        />
        {/* bottom fade into page background */}
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

          {/* score card + robot mascot on the right (desktop only) */}
          <div className="relative mx-auto max-w-3xl">
            <div
              aria-hidden
              className="hidden lg:block pointer-events-none select-none"
              style={{
                position: 'absolute',
                right: -230,
                bottom: -40,
                width: 280,
                height: 340,
                zIndex: 3,
              }}
            >
              {/* soft glow disk behind the robot */}
              <div
                className="absolute"
                style={{
                  left: '10%',
                  bottom: '10%',
                  width: '80%',
                  height: '70%',
                  borderRadius: '50%',
                  background:
                    'radial-gradient(circle, rgba(167,139,250,0.38) 0%, rgba(118,77,240,0.22) 40%, transparent 70%)',
                  filter: 'blur(8px)',
                }}
              />
              <div
                className="relative w-full h-full"
                style={{ filter: 'drop-shadow(0 18px 32px rgba(118,77,240,0.55))' }}
              >
                <Image
                  src="/aivent/misc/robot-idle.png"
                  alt=""
                  fill
                  sizes="280px"
                  priority={false}
                  style={{ objectFit: 'contain', objectPosition: 'bottom right' }}
                />
              </div>
            </div>

          <div className="rounded-2xl overflow-hidden" style={glass}>
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
                {result.scores.current_ats >= 90 && (
                  <button
                    onClick={() => openShareCard(result.scores.current_ats)}
                    className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200"
                    style={{ background: 'rgba(52,211,153,0.18)', border: '1px solid rgba(52,211,153,0.35)', color: '#34d399' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(52,211,153,0.28)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(52,211,153,0.18)'; }}
                  >
                    <Share2 className="h-4 w-4" />
                    Share your win
                  </button>
                )}
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

            {/* Template strip — collapsible to save vertical room */}
            <div className="rounded-2xl overflow-hidden p-3 sm:p-4" style={glass}>
              <button
                type="button"
                onClick={() => setTemplatesExpanded((v) => !v)}
                className="w-full flex items-center justify-between gap-2 text-left"
                aria-expanded={templatesExpanded}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Palette className="h-3.5 w-3.5 shrink-0" style={{ color: '#a78bfa' }} />
                  <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-white/55 truncate">
                    Template — {TEMPLATES[template].name}
                  </p>
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0"
                    style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.22)' }}
                  >
                    ATS-OPTIMIZED
                  </span>
                </div>
                {templatesExpanded
                  ? <ChevronUp className="h-4 w-4 shrink-0 text-white/55" />
                  : <ChevronDown className="h-4 w-4 shrink-0 text-white/55" />}
              </button>

              {templatesExpanded ? (
                <div className="mt-3">
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
                </div>
              ) : (
                /* Collapsed — only the selected template card + a "show all" CTA */
                <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-2.5">
                  <div
                    className="relative rounded-lg p-2 sm:p-2.5 max-w-[220px] md:max-w-none"
                    style={{
                      background: 'rgba(118,77,240,0.14)',
                      border: '1px solid rgba(118,77,240,0.55)',
                      boxShadow: '0 0 0 3px rgba(118,77,240,0.10)',
                    }}
                  >
                    <div className="relative">
                      <TemplateThumbnail id={template} />
                      <span
                        className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full"
                        style={{ background: '#764df0' }}
                      >
                        <Check className="h-2.5 w-2.5 text-white" />
                      </span>
                    </div>
                    <div className="mt-2 min-w-0">
                      <p className="text-[11px] sm:text-[12px] font-semibold text-white truncate">
                        {TEMPLATES[template].name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] font-bold" style={{ color: '#34d399' }}>
                          ATS {TEMPLATES[template].atsScore}%
                        </span>
                        <span className="text-[9px] text-white/35 truncate">· {TEMPLATES[template].region}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTemplatesExpanded(true)}
                    className="md:col-span-3 rounded-lg flex items-center justify-center gap-2 text-xs font-bold text-white/70 hover:text-white"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px dashed rgba(255,255,255,0.12)',
                      minHeight: 56,
                    }}
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                    Show all 10 templates
                  </button>
                </div>
              )}

              {showPhotoSlot && (
                <div className="mt-3 pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <PhotoUpload value={photo} onChange={setPhoto} />
                </div>
              )}
            </div>

            {/* Edits pill — only meaningful while viewing Original PDF (edits
                aren't reflected in the preview). Shows a nudge to switch. */}
            {isOriginal && editsApplied > 0 && (
              <div
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl px-3 sm:px-4 py-2.5"
                style={{
                  background:
                    'linear-gradient(90deg, rgba(118,77,240,0.18), rgba(118,77,240,0.06))',
                  border: '1px solid rgba(118,77,240,0.35)',
                }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="inline-flex items-center justify-center rounded-full text-[10px] font-black"
                    style={{
                      width: 22,
                      height: 22,
                      background: '#764df0',
                      color: '#fff',
                      boxShadow: '0 0 0 3px rgba(118,77,240,0.25)',
                    }}
                  >
                    {editsApplied}
                  </span>
                  <p className="text-[12px] sm:text-[13px] font-semibold" style={{ color: '#ddd6fe' }}>
                    {editsApplied === 1 ? 'edit applied' : 'edits applied'} — not visible on the original PDF
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTemplate(FALLBACK_TEMPLATE);
                    toast.success(`Viewing in ${TEMPLATES[FALLBACK_TEMPLATE].name}`);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold whitespace-nowrap"
                  style={{
                    background: 'rgba(118,77,240,0.32)',
                    border: '1px solid rgba(167,139,250,0.5)',
                    color: '#f5f3ff',
                  }}
                >
                  View in {TEMPLATES[FALLBACK_TEMPLATE].name}
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            )}

            {/* CV Preview — horizontal pages, sticky on large screens.
                For template === 'original', CVPreview renders the uploaded PDF. */}
            <div
              className="rounded-2xl overflow-hidden lg:sticky lg:top-20"
              style={glass}
            >
              <div style={{ height: '1px', background: 'linear-gradient(90deg,transparent,rgba(118,77,240,0.5),transparent)' }} />
              <div className="flex items-center justify-between px-3 sm:px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white/35">
                <span>{isOriginal ? 'Your Original CV' : 'Preview'}</span>
                <span className="hidden sm:inline">
                  {isOriginal ? 'Your uploaded file' : `${TEMPLATES[template].name}`}
                </span>
              </div>
              <CVPreview
                cv={finalCV}
                template={template}
                photo={showPhotoSlot ? photo : null}
                originalPdfDataUrl={originalPdfDataUrl}
              />
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

      {/* Download choice modal — only used when the user is on the Original PDF
          template. Makes the trade-off explicit instead of silently exporting
          one version or the other. */}
      {downloadDialogOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="download-choice-title"
        >
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(4,6,20,0.72)', backdropFilter: 'blur(6px)' }}
            onClick={() => setDownloadDialogOpen(false)}
          />
          <div
            className="relative w-full max-w-md rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(15,10,40,0.95)',
              border: '1px solid rgba(118,77,240,0.35)',
              boxShadow: '0 24px 60px rgba(0,0,0,0.55)',
            }}
          >
            <div style={{ height: '2px', background: 'linear-gradient(90deg,transparent,rgba(118,77,240,0.9),transparent)' }} />
            <div className="px-6 pt-6 pb-5">
              <div className="flex items-start gap-3">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: 'rgba(118,77,240,0.18)', border: '1px solid rgba(118,77,240,0.35)' }}
                >
                  <Download className="h-5 w-5" style={{ color: '#c4b5fd' }} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3
                    id="download-choice-title"
                    className="text-base font-bold tracking-tight"
                    style={{ color: '#f5f3ff' }}
                  >
                    Which version do you want?
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    You&apos;re viewing your original PDF, which can&apos;t be re-rendered with
                    AI edits{editsApplied > 0 ? ` (${editsApplied} pending)` : ''}. Pick what to download.
                  </p>
                </div>
              </div>
            </div>
            <div className="px-6 pb-6 space-y-2">
              <button
                type="button"
                onClick={handleDownloadOriginal}
                disabled={!originalPdfDataUrl}
                className="w-full flex items-start gap-3 rounded-xl px-4 py-3 text-left transition-colors disabled:opacity-50"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.85)',
                }}
                onMouseEnter={e => { if (originalPdfDataUrl) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold" style={{ color: '#f5f3ff' }}>Download original file</p>
                  <p className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    Exactly what you uploaded. No AI edits applied.
                  </p>
                </div>
              </button>
              <button
                type="button"
                onClick={handleSwitchAndDownload}
                disabled={downloading}
                className="w-full flex items-start gap-3 rounded-xl px-4 py-3 text-left transition-all disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, rgba(118,77,240,0.28), rgba(91,33,182,0.28))',
                  border: '1px solid rgba(167,139,250,0.5)',
                  color: '#f5f3ff',
                  boxShadow: '0 6px 16px rgba(118,77,240,0.25)',
                }}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">
                    {downloading
                      ? `Rendering ${TEMPLATES[FALLBACK_TEMPLATE].name}…`
                      : `Switch to ${TEMPLATES[FALLBACK_TEMPLATE].name} and download`}
                  </p>
                  <p className="text-[12px] mt-0.5" style={{ color: 'rgba(221,214,254,0.8)' }}>
                    AI-rewritten CV{editsApplied > 0 ? ` with your ${editsApplied} ${editsApplied === 1 ? 'edit' : 'edits'}` : ''} — ATS-optimized.
                  </p>
                </div>
              </button>
            </div>
            <div
              className="flex items-center justify-end px-6 py-3"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
            >
              <button
                type="button"
                onClick={() => setDownloadDialogOpen(false)}
                className="text-[12px] font-semibold"
                style={{ color: 'rgba(255,255,255,0.5)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
