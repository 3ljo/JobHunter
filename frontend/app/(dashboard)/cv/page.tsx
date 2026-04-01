'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import CVUploader from '@/components/cv/CVUploader';
import CVPreview from '@/components/cv/CVPreview';
import QuickEditBox from '@/components/cv/QuickEditBox';
import ATSScoreCompact from '@/components/cv/ATSScoreCompact';
import AnalysisSidebar from '@/components/cv/AnalysisSidebar';
import { downloadCVPdf } from '@/lib/api';
import { CVAnalysisResult } from '@/types';
import toast from 'react-hot-toast';
import { Download, RotateCcw } from 'lucide-react';

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

  // Persist result to sessionStorage
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

  // Upload phase
  if (!result) {
    return (
      <div className="max-w-xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">CV Analyzer</CardTitle>
          </CardHeader>
          <CardContent>
            <CVUploader onResult={setResult} />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Results phase
  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Top bar — title + action icons */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Results</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={handleDownload}
            disabled={downloading}
            title="Download PDF"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleReset}
            title="Analyze another CV"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        {/* Left — CV document */}
        <div className="min-w-0">
          <CVPreview cv={finalCV} />
        </div>

        {/* Right — sidebar */}
        <div className="space-y-3">
          {/* Scores */}
          <ATSScoreCompact scores={result.scores} />

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* Analysis */}
          <AnalysisSidebar audit={result.audit} rewrite={result.rewrite} />

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* Quick Edit */}
          <QuickEditBox cvRecordId={result.cv_record_id} onRefine={handleRefine} />
        </div>
      </div>
    </div>
  );
}
