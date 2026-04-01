'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { CVAnalysisResult } from '@/types';
import { downloadCVPdf } from '@/lib/api';
import toast from 'react-hot-toast';

interface AuditReportProps {
  result: CVAnalysisResult;
  cvRecordId: string | null;
}

export default function AuditReport({ result, cvRecordId }: AuditReportProps) {
  const { audit, rewrite, final } = result;
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!cvRecordId) {
      toast.error('No CV record available for download');
      return;
    }
    setDownloading(true);
    try {
      await downloadCVPdf(cvRecordId);
      toast.success('PDF downloaded');
    } catch {
      toast.error('Failed to download PDF');
    } finally {
      setDownloading(false);
    }
  };

  const finalCV = final?.final_cv;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Analysis Report</h3>
        {cvRecordId && (
          <Button variant="outline" onClick={handleDownload} disabled={downloading}>
            {downloading ? 'Generating PDF...' : 'Download PDF'}
          </Button>
        )}
      </div>

      <Tabs defaultValue="issues">
        <TabsList>
          <TabsTrigger value="issues">Issues</TabsTrigger>
          <TabsTrigger value="rewrite">Rewritten CV</TabsTrigger>
          <TabsTrigger value="changes">Changes Made</TabsTrigger>
        </TabsList>

        <TabsContent value="issues" className="space-y-6 pt-2">
          {/* Formatting Audit */}
          {audit?.formatting_audit && Array.isArray(audit.formatting_audit) && (
            <div>
              <h4 className="font-medium text-foreground mb-3">Formatting Audit</h4>
              <div className="space-y-2">
                {audit.formatting_audit.map((item: any, i: number) => {
                  const status = (item.status || '').toUpperCase();
                  const statusStyle =
                    status === 'PASS'
                      ? 'bg-green-500/10 text-green-700 border-green-500/30 dark:text-green-400 dark:bg-green-500/20'
                      : status === 'FAIL'
                      ? 'bg-red-500/10 text-red-700 border-red-500/30 dark:text-red-400 dark:bg-red-500/20'
                      : 'bg-yellow-500/10 text-yellow-700 border-yellow-500/30 dark:text-yellow-400 dark:bg-yellow-500/20';
                  return (
                    <div key={i} className={`flex items-start gap-3 rounded-lg border p-3 ${statusStyle}`}>
                      <span className="mt-0.5 shrink-0 text-xs font-bold uppercase tracking-wide">
                        {status === 'PASS' ? '\u2713' : status === 'FAIL' ? '\u2717' : '\u26A0'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{item.item}</p>
                        {item.fix && (
                          <p className="text-xs mt-0.5 opacity-80">{item.fix}</p>
                        )}
                      </div>
                      <span className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium border" style={{ fontSize: '10px' }}>
                        {status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Keyword Analysis */}
          {audit?.keyword_analysis && (
            <div>
              <h4 className="font-medium text-foreground mb-3">Keyword Analysis</h4>
              <div className="space-y-3">
                {audit.keyword_analysis.critical_missing?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-red-500 dark:text-red-400 uppercase tracking-wide mb-2">Critical Missing Keywords</p>
                    <div className="flex flex-wrap gap-1.5">
                      {audit.keyword_analysis.critical_missing.map((kw: string, i: number) => (
                        <span key={i} className="rounded-full bg-red-500/10 border border-red-500/30 px-2.5 py-1 text-xs text-red-600 dark:text-red-400">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {audit.keyword_analysis.present_exact_match?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-green-500 dark:text-green-400 uppercase tracking-wide mb-2">Present (Exact Match)</p>
                    <div className="flex flex-wrap gap-1.5">
                      {audit.keyword_analysis.present_exact_match.map((kw: string, i: number) => (
                        <span key={i} className="rounded-full bg-green-500/10 border border-green-500/30 px-2.5 py-1 text-xs text-green-600 dark:text-green-400">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {audit.keyword_analysis.present_wrong_phrasing?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-yellow-500 dark:text-yellow-400 uppercase tracking-wide mb-2">Present (Wrong Phrasing)</p>
                    <div className="flex flex-wrap gap-1.5">
                      {audit.keyword_analysis.present_wrong_phrasing.map((kw: any, i: number) => (
                        <span key={i} className="rounded-full bg-yellow-500/10 border border-yellow-500/30 px-2.5 py-1 text-xs text-yellow-600 dark:text-yellow-400">
                          {typeof kw === 'string' ? kw : `${kw.cv_phrase} \u2192 ${kw.jd_phrase}`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {audit.keyword_analysis.keyword_match_percentage != null && (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-sm text-muted-foreground">Match rate:</span>
                    <span className="text-sm font-semibold text-foreground">
                      {audit.keyword_analysis.keyword_match_percentage}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Wins */}
          {audit?.top_5_quick_wins && Array.isArray(audit.top_5_quick_wins) && (
            <div>
              <h4 className="font-medium text-foreground mb-3">Top Quick Wins</h4>
              <div className="space-y-2">
                {audit.top_5_quick_wins.map((win: any, i: number) => {
                  const impactColor =
                    win.impact === 'high' ? 'text-red-500 bg-red-500/10 border-red-500/30 dark:text-red-400'
                    : win.impact === 'medium' ? 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30 dark:text-yellow-400'
                    : 'text-green-500 bg-green-500/10 border-green-500/30 dark:text-green-400';
                  return (
                    <div key={i} className="flex items-start gap-3 rounded-lg border border-border p-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        {win.priority || i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {typeof win === 'string' ? win : win.action}
                        </p>
                        {win.reason && (
                          <p className="text-xs text-muted-foreground mt-0.5">{win.reason}</p>
                        )}
                      </div>
                      {win.impact && (
                        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${impactColor}`}>
                          {win.impact}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bullet Analysis */}
          {audit?.bullet_analysis && Array.isArray(audit.bullet_analysis) && audit.bullet_analysis.length > 0 && (
            <div>
              <h4 className="font-medium text-foreground mb-3">Bullet Analysis</h4>
              <div className="space-y-2">
                {audit.bullet_analysis.map((bullet: any, i: number) => {
                  const hasIssues = bullet.weak_verb || bullet.missing_metric || bullet.buried_keyword ||
                    (bullet.issues && bullet.issues.length > 0);
                  return (
                    <div key={i} className={`rounded-lg border p-3 ${hasIssues ? 'border-yellow-500/30 bg-yellow-500/5 dark:bg-yellow-500/10' : 'border-border'}`}>
                      <p className="text-sm text-foreground">{bullet.original}</p>
                      {hasIssues && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {bullet.weak_verb && (
                            <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs text-red-600 dark:text-red-400">
                              Weak verb: {bullet.weak_verb}
                            </span>
                          )}
                          {bullet.missing_metric && (
                            <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-600 dark:text-yellow-400">
                              Missing metric
                            </span>
                          )}
                          {bullet.buried_keyword && (
                            <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-xs text-orange-600 dark:text-orange-400">
                              Buried keyword
                            </span>
                          )}
                          {bullet.issues?.map((issue: string, j: number) => (
                            <span key={j} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                              {issue}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="rewrite" className="pt-2">
          {finalCV ? (
            <CVPreview cv={finalCV} />
          ) : (
            <div className="rounded-lg bg-muted p-4">
              <pre className="whitespace-pre-wrap text-sm text-foreground font-mono leading-relaxed">
                {typeof final === 'string' ? final : JSON.stringify(final, null, 2)}
              </pre>
            </div>
          )}
        </TabsContent>

        <TabsContent value="changes" className="pt-2">
          {rewrite?.changes_made && Array.isArray(rewrite.changes_made) ? (
            <div className="space-y-3">
              {rewrite.changes_made.map((change: any, i: number) => (
                <div key={i} className="rounded-lg border border-border p-3 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase">{change.section}</p>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    <div className="rounded bg-red-500/10 dark:bg-red-500/15 p-2">
                      <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">Original</p>
                      <p className="text-sm text-foreground">{change.original}</p>
                    </div>
                    <div className="rounded bg-green-500/10 dark:bg-green-500/15 p-2">
                      <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">Rewritten</p>
                      <p className="text-sm text-foreground">{change.rewritten}</p>
                    </div>
                  </div>
                  {change.reason && (
                    <p className="text-xs text-muted-foreground italic">{change.reason}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg bg-muted p-4">
              <pre className="whitespace-pre-wrap text-sm text-foreground font-mono leading-relaxed">
                {typeof rewrite === 'string' ? rewrite : JSON.stringify(rewrite, null, 2)}
              </pre>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CVPreview({ cv }: { cv: any }) {
  const contactParts = [cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean);

  return (
    <div className="rounded-lg border bg-white p-6 md:p-8 shadow-sm max-w-3xl mx-auto" style={{ fontFamily: 'Calibri, sans-serif' }}>
      {/* Name */}
      <h1 className="text-center text-xl md:text-2xl font-bold text-gray-900">{cv.full_name}</h1>

      {/* Contact */}
      {contactParts.length > 0 && (
        <p className="text-center text-xs md:text-sm text-gray-500 mt-1">{contactParts.join(' | ')}</p>
      )}

      <hr className="my-4 border-gray-900" />

      {/* Summary */}
      {cv.summary && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-1 mb-2">
            Professional Summary
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed">{cv.summary}</p>
        </section>
      )}

      {/* Experience */}
      {cv.experience && cv.experience.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-1 mb-2">
            Work Experience
          </h2>
          {cv.experience.map((role: any, i: number) => (
            <div key={i} className="mb-3">
              <p className="font-semibold text-sm text-gray-900">{role.title}</p>
              <p className="text-sm italic text-gray-500">
                {role.company} | {role.duration}
              </p>
              {role.bullets && role.bullets.length > 0 && (
                <ul className="mt-1 ml-4 list-disc space-y-0.5">
                  {role.bullets.map((bullet: string, j: number) => (
                    <li key={j} className="text-sm text-gray-700">{bullet}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Skills */}
      {cv.skills && cv.skills.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-1 mb-2">
            Skills
          </h2>
          <p className="text-sm text-gray-700">{cv.skills.join(', ')}</p>
        </section>
      )}

      {/* Education */}
      {cv.education && cv.education.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-1 mb-2">
            Education
          </h2>
          {cv.education.map((edu: any, i: number) => (
            <p key={i} className="text-sm text-gray-700">
              {[edu.degree, edu.institution, edu.year].filter(Boolean).join(' \u2014 ')}
            </p>
          ))}
        </section>
      )}

      {/* Certifications */}
      {cv.certifications && cv.certifications.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-1 mb-2">
            Certifications
          </h2>
          {cv.certifications.map((cert: any, i: number) => (
            <p key={i} className="text-sm text-gray-700">
              {typeof cert === 'string' ? cert : cert.name || JSON.stringify(cert)}
            </p>
          ))}
        </section>
      )}
    </div>
  );
}
