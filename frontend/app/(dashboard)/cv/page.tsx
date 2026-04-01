'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import CVUploader from '@/components/cv/CVUploader';
import ATSScoreCard from '@/components/cv/ATSScoreCard';
import AuditReport from '@/components/cv/AuditReport';
import CVHistory from '@/components/cv/CVHistory';
import { CVAnalysisResult } from '@/types';

export default function CVPage() {
  const [result, setResult] = useState<CVAnalysisResult | null>(null);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upload CV</CardTitle>
          </CardHeader>
          <CardContent>
            <CVUploader onResult={setResult} />
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">ATS Score</CardTitle>
            </CardHeader>
            <CardContent>
              <ATSScoreCard scores={result.scores} />
            </CardContent>
          </Card>
        )}
      </div>

      {result && (
        <Card>
          <CardContent className="pt-6">
            <AuditReport result={result} cvRecordId={result.cv_record_id} />
          </CardContent>
        </Card>
      )}

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
