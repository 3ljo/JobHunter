'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import CVUpload from '@/components/cv/CVUpload';
import CVPreview from '@/components/cv/CVPreview';
import QuickEditBox from '@/components/cv/QuickEditBox';
import ScoreRing from '@/components/cv/ScoreRing';
import AnalysisSidebar from '@/components/cv/AnalysisSidebar';
import { downloadCVPdf } from '@/lib/api';
import { useCVAnalysisStore } from '@/store/cvAnalysisStore';
import { useCoverLetterStore } from '@/store/coverLetterStore';
import toast from 'react-hot-toast';
import { Download, RotateCcw, ArrowRight, FileSearch, TrendingUp, FileSignature, Sparkles, Copy, Check, X, Wand2, Send } from 'lucide-react';

const tones = [
  { key: 'balanced', label: 'Balanced' },
  { key: 'formal', label: 'Formal' },
  { key: 'friendly', label: 'Friendly' },
];

export default function CVPage() {
  const { result, setResult, reset: resetAnalysis, loading: analysisLoading, step: analysisStep, steps: analysisSteps } = useCVAnalysisStore();
  const [downloading, setDownloading] = useState(false);

  // Cover letter state from store (persists across tab switches)
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

  const [showCL, setShowCL] = useState(() => !!clResult);
  const [clCopied, setCLCopied] = useState(false);
  const [clRefineInput, setCLRefineInput] = useState('');

  const handleRefine = (updatedFinalCV: any) => {
    if (!result) return;
    setResult({
      ...result,
      final: { ...result.final, final_cv: updatedFinalCV },
    });
  };

  const handleDownload = async () => {
    if (!result?.cv_record_id) return;
    setDownloading(true);
    try {
      await downloadCVPdf(result.cv_record_id);
      toast.success('PDF downloaded');
    } catch {
      toast.error('Failed to download PDF');
    } finally {
      setDownloading(false);
    }
  };

  const handleReset = () => {
    resetAnalysis();
    setShowCL(false);
    resetInline();
  };

  const handleGenerateCL = async () => {
    const cvText = sessionStorage.getItem('cl_cv_text') || '';
    const jd = sessionStorage.getItem('cl_job_description') || '';
    if (!cvText || !jd) {
      toast.error('Missing CV or job description data');
      return;
    }
    await generateInline(cvText, jd, clTone);
  };

  const handleRefineCL = async () => {
    if (!clRefineInput.trim() || !clResult) return;
    await refineInline(clResult, clRefineInput);
    setCLRefineInput('');
  };

  const handleCopyCL = async () => {
    await navigator.clipboard.writeText(clResult);
    setCLCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCLCopied(false), 2000);
  };

  const finalCV = result?.final?.final_cv;

  // Upload phase (or analysis in progress)
  if (!result) {
    return (
      <div className="flex flex-col items-center pt-8 md:pt-20">
        <div className="text-center mb-12">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 ring-1 ring-violet-500/20">
            <FileSearch className="h-6 w-6 text-violet-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            {analysisLoading ? 'Analyzing Your CV' : 'Analyze Your CV'}
          </h1>
          <p className="text-muted-foreground mt-3 text-base max-w-md mx-auto leading-relaxed">
            {analysisLoading
              ? 'Your analysis is in progress. Feel free to browse other tabs — it won\'t be interrupted.'
              : 'Upload your CV and paste a job description to get an AI-powered ATS analysis.'}
          </p>
        </div>
        {analysisLoading ? (
          <div className="w-full max-w-2xl mx-auto">
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-card p-5">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
              <div className="space-y-3">
                {analysisSteps.map((s, i) => (
                  <div
                    key={s}
                    className={`flex items-center gap-3 text-sm transition-all duration-300 ${
                      i <= analysisStep ? 'text-foreground/90' : 'text-muted-foreground/40'
                    }`}
                  >
                    <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                      i < analysisStep
                        ? 'bg-violet-500/20 text-violet-400'
                        : i === analysisStep
                        ? 'bg-violet-500/15 ring-2 ring-violet-500/30'
                        : 'bg-muted/50'
                    }`}>
                      {i < analysisStep ? (
                        <Check className="h-3 w-3" />
                      ) : i === analysisStep ? (
                        <div className="h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
                      ) : (
                        <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                      )}
                    </div>
                    <span className="font-medium">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <CVUpload />
        )}
      </div>
    );
  }

  const scoreDelta = result.scores.projected_ats - result.scores.current_ats;

  // Results phase
  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-card">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6">
          <div className="flex items-center gap-8">
            <ScoreRing score={result.scores.current_ats} label="Current" size={100} />
            <div className="flex flex-col items-center gap-1">
              <ArrowRight className="h-5 w-5 text-muted-foreground/40" />
              {scoreDelta > 0 && (
                <span className="flex items-center gap-0.5 text-xs font-medium text-emerald-400">
                  <TrendingUp className="h-3 w-3" />
                  +{scoreDelta}
                </span>
              )}
            </div>
            <ScoreRing score={result.scores.projected_ats} label="Projected" size={100} />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={downloading}
              className="gap-2 rounded-xl border-white/[0.1] text-muted-foreground hover:bg-accent hover:text-foreground hover:border-violet-500/30 transition-all"
            >
              <Download className="h-4 w-4" />
              {downloading ? 'Downloading...' : 'Download PDF'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCL(true)}
              className="gap-2 rounded-xl border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
            >
              <FileSignature className="h-4 w-4" />
              Cover Letter
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="gap-2 rounded-xl text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-4 w-4" />
              New Analysis
            </Button>
          </div>
        </div>
      </div>

      {/* Cover Letter Panel */}
      {(showCL || clLoading) && (
        <div className="rounded-2xl border border-violet-500/20 bg-violet-50 dark:bg-violet-500/[0.03] overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-violet-500/15 dark:border-violet-500/10">
            <div className="flex items-center gap-2.5">
              <FileSignature className="h-4 w-4 text-violet-500 dark:text-violet-400" />
              <h3 className="text-sm font-semibold text-foreground">Cover Letter Generator</h3>
            </div>
            <button
              onClick={() => setShowCL(false)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-6">
            {!clResult ? (
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Tone</span>
                  {tones.map((t) => (
                    <button
                      key={t.key}
                      onClick={() => setCLTone(t.key)}
                      disabled={clLoading}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                        clTone === t.key
                          ? 'bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/30'
                          : 'text-muted-foreground hover:text-foreground/80 hover:bg-muted/50'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <Button
                  onClick={handleGenerateCL}
                  disabled={clLoading}
                  className="gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-violet-500/20 transition-all active:scale-[0.98] ml-auto"
                >
                  {clLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Generating...
                    </span>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generate
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleCopyCL}
                    size="sm"
                    className="gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-all"
                  >
                    {clCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {clCopied ? 'Copied!' : 'Copy'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCLResult('')}
                    className="gap-2 rounded-xl border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Regenerate
                  </Button>
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{clResult}</p>
                {/* Refine */}
                <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                  <input
                    type="text"
                    value={clRefineInput}
                    onChange={(e) => setCLRefineInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !clRefining) handleRefineCL(); }}
                    placeholder="e.g. Make it shorter, more confident..."
                    className="flex-1 h-9 rounded-lg border border-border bg-background/50 px-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-violet-500/40 focus:outline-none focus:ring-1 focus:ring-violet-500/20 transition-all"
                    disabled={clRefining}
                  />
                  <Button
                    onClick={handleRefineCL}
                    disabled={clRefining || !clRefineInput.trim()}
                    size="sm"
                    className="h-9 rounded-lg bg-violet-600 hover:bg-violet-500 text-white px-3"
                  >
                    {clRefining ? (
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">
        <div className="space-y-4">
          <div className="sticky top-20">
            <div className="relative max-h-[calc(100vh-220px)] overflow-y-auto rounded-2xl border border-white/[0.07] bg-card [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />
              <CVPreview cv={finalCV} />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-card p-6">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />
            <AnalysisSidebar audit={result.audit} rewrite={result.rewrite} />
          </div>
          <QuickEditBox cvRecordId={result.cv_record_id} onRefine={handleRefine} />
        </div>
      </div>
    </div>
  );
}
