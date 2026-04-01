'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { CVAnalysisResult } from '@/types';

export default function AuditReport({ result }: { result: CVAnalysisResult }) {
  const { audit, rewrite, final, download_url } = result;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Analysis Report</h3>
        {download_url && (
          <Button
            variant="outline"
            onClick={() => {
              const url = download_url.startsWith('http')
                ? download_url
                : `${process.env.NEXT_PUBLIC_API_URL}${download_url}`;
              window.open(url, '_blank');
            }}
          >
            Download DOCX
          </Button>
        )}
      </div>

      <Tabs defaultValue="issues">
        <TabsList>
          <TabsTrigger value="issues">Issues</TabsTrigger>
          <TabsTrigger value="rewrite">Rewritten CV</TabsTrigger>
          <TabsTrigger value="changes">Changes Made</TabsTrigger>
        </TabsList>

        <TabsContent value="issues" className="space-y-4 pt-2">
          {audit?.formatting_issues && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Formatting Issues</h4>
              <div className="space-y-1">
                {(Array.isArray(audit.formatting_issues) ? audit.formatting_issues : [audit.formatting_issues]).map(
                  (issue: string, i: number) => (
                    <p key={i} className="text-sm text-gray-600 flex gap-2">
                      <span className="text-red-500">&#x2022;</span> {issue}
                    </p>
                  )
                )}
              </div>
            </div>
          )}
          {audit?.keyword_gaps && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Keyword Gaps</h4>
              <div className="flex flex-wrap gap-2">
                {(Array.isArray(audit.keyword_gaps) ? audit.keyword_gaps : [audit.keyword_gaps]).map(
                  (kw: string, i: number) => (
                    <span key={i} className="rounded-full bg-red-50 px-3 py-1 text-xs text-red-700">
                      {kw}
                    </span>
                  )
                )}
              </div>
            </div>
          )}
          {audit?.quick_wins && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Quick Wins</h4>
              <ol className="list-decimal list-inside space-y-1">
                {(Array.isArray(audit.quick_wins) ? audit.quick_wins : [audit.quick_wins]).map(
                  (win: string, i: number) => (
                    <li key={i} className="text-sm text-gray-600">{win}</li>
                  )
                )}
              </ol>
            </div>
          )}
          {!audit?.formatting_issues && !audit?.keyword_gaps && !audit?.quick_wins && (
            <pre className="whitespace-pre-wrap text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
              {typeof audit === 'string' ? audit : JSON.stringify(audit, null, 2)}
            </pre>
          )}
        </TabsContent>

        <TabsContent value="rewrite" className="pt-2">
          <div className="rounded-lg bg-gray-50 p-4">
            <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono leading-relaxed">
              {typeof final === 'string'
                ? final
                : typeof rewrite === 'string'
                ? rewrite
                : JSON.stringify(rewrite || final, null, 2)}
            </pre>
          </div>
        </TabsContent>

        <TabsContent value="changes" className="pt-2">
          <div className="rounded-lg bg-gray-50 p-4">
            <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono leading-relaxed">
              {typeof rewrite === 'string'
                ? rewrite
                : JSON.stringify(rewrite, null, 2)}
            </pre>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
