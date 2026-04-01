'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import CVUploader from '@/components/cv/CVUploader';
import CVPreview from '@/components/cv/CVPreview';
import QuickEditBox from '@/components/cv/QuickEditBox';
import ATSScoreCompact from '@/components/cv/ATSScoreCompact';
import AnalysisSidebar from '@/components/cv/AnalysisSidebar';
import CVHistory from '@/components/cv/CVHistory';
import { downloadCVPdf } from '@/lib/api';
import { CVAnalysisResult } from '@/types';
import toast from 'react-hot-toast';

export default function CVPage() {
  const [result, setResult] = useState<CVAnalysisResult | null>(null);
  const [downloading, setDownloading] = useState(false);

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

  const finalCV = result?.final?.final_cv;

  // Upload phase
  if (!result) {
    return (
      <div className="space-y-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">CV Analyzer</CardTitle>
            </CardHeader>
            <CardContent>
              <CVUploader onResult={setResult} />
            </CardContent>
          </Card>
        </div>

        <Separator />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">CV History</CardTitle>
          </CardHeader>
          <CardContent>
            <CVHistory />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Results phase
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        {/* Left column — CV preview + quick edit */}
        <div className="space-y-4 min-w-0">
          <CVPreview cv={finalCV} />
          {result.cv_record_id && (
            <QuickEditBox cvRecordId={result.cv_record_id} onRefine={handleRefine} />
          )}
        </div>

        {/* Right column — scores, analysis, actions */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">ATS Score</CardTitle>
            </CardHeader>
            <CardContent>
              <ATSScoreCompact scores={result.scores} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <AnalysisSidebar audit={result.audit} rewrite={result.rewrite} />
            </CardContent>
          </Card>

          <div className="flex flex-col gap-2">
            <Button onClick={handleDownload} disabled={downloading} className="w-full">
              {downloading ? 'Generating PDF...' : 'Download PDF'}
            </Button>
            <Button variant="outline" onClick={() => setResult(null)} className="w-full">
              Analyze Another CV
            </Button>
          </div>
        </div>
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">CV History</CardTitle>
        </CardHeader>
        <CardContent>
          <CVHistory />
        </CardContent>
      </Card>
    </div>
  );
}
