'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import CVUpload from '@/components/cv/CVUpload';
import CVPreview from '@/components/cv/CVPreview';
import QuickEditBox from '@/components/cv/QuickEditBox';
import ScoreRing from '@/components/cv/ScoreRing';
import SkillBars from '@/components/cv/SkillBars';
import KeywordChips from '@/components/cv/KeywordChips';
import SuggestionCards from '@/components/cv/SuggestionCards';
import AnalysisSidebar from '@/components/cv/AnalysisSidebar';
import { downloadCVPdf } from '@/lib/api';
import { CVAnalysisResult } from '@/types';
import toast from 'react-hot-toast';
import { Download, RotateCcw, ArrowRight, FileSearch } from 'lucide-react';

const STORAGE_KEY = 'cv_analysis_result';

export default function CVPage() {
  const [result, setResult] = useState<CVAnalysisResult | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (result) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(result));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, [result]);

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
    setResult(null);
  };

  const finalCV = result?.final?.final_cv;

  // Upload phase — hero layout
  if (!result) {
    return (
      <div className="flex flex-col items-center pt-8 md:pt-16">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600/15">
              <FileSearch className="h-6 w-6 text-violet-400" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            Analyze Your CV
          </h1>
          <p className="text-zinc-400 mt-3 text-lg max-w-md mx-auto">
            Upload your CV and paste a job description to get an AI-powered ATS analysis.
          </p>
        </div>
        <CVUpload onResult={setResult} />
      </div>
    );
  }

  // Results phase — two-column layout
  return (
    <div className="space-y-6">
      {/* Top bar — scores + actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 rounded-2xl bg-zinc-900/50 border border-white/[0.06] p-6">
        <div className="flex items-center gap-6">
          <ScoreRing score={result.scores.current_ats} label="Current" size={100} />
          <ArrowRight className="h-5 w-5 text-zinc-600" />
          <ScoreRing score={result.scores.projected_ats} label="Projected" size={100} />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={downloading}
            className="gap-2 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="gap-2 text-zinc-400 hover:text-white"
          >
            <RotateCcw className="h-4 w-4" />
            New Analysis
          </Button>
        </div>
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
        {/* Left — analysis breakdown */}
        <div className="space-y-6">
          {/* Skill bars */}
          <div className="rounded-2xl bg-zinc-900/50 border border-white/[0.06] p-6">
            <h3 className="text-sm font-medium text-zinc-300 mb-4">Score Breakdown</h3>
            <SkillBars scores={result.scores} />
          </div>

          {/* Keywords */}
          <div className="rounded-2xl bg-zinc-900/50 border border-white/[0.06] p-6">
            <KeywordChips keywordAnalysis={result.audit?.keyword_analysis} />
          </div>

          {/* Suggestions */}
          {result.audit?.top_5_quick_wins && (
            <div className="rounded-2xl bg-zinc-900/50 border border-white/[0.06] p-6">
              <SuggestionCards suggestions={result.audit.top_5_quick_wins} />
            </div>
          )}

          {/* Detailed Issues & Changes */}
          <div className="rounded-2xl bg-zinc-900/50 border border-white/[0.06] p-6">
            <AnalysisSidebar audit={result.audit} rewrite={result.rewrite} />
          </div>
        </div>

        {/* Right — CV preview + Quick Edit */}
        <div className="space-y-4">
          <div className="sticky top-24">
            <div className="max-h-[calc(100vh-220px)] overflow-y-auto rounded-2xl border border-white/[0.06]">
              <CVPreview cv={finalCV} />
            </div>
            <div className="mt-4">
              <QuickEditBox cvRecordId={result.cv_record_id} onRefine={handleRefine} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
