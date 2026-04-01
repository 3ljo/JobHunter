'use client';

import { Collapsible } from '@base-ui/react/collapsible';
import { ChevronDown } from 'lucide-react';

interface AnalysisSidebarProps {
  audit: any;
  rewrite: any;
}

function SectionHeader({ children, badge }: { children: React.ReactNode; badge?: React.ReactNode }) {
  return (
    <Collapsible.Trigger className="flex w-full items-center justify-between py-2 text-sm font-medium text-foreground cursor-pointer hover:text-foreground/80 transition-colors">
      <div className="flex items-center gap-2">
        <span>{children}</span>
        {badge}
      </div>
      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 [[data-open]_&]:rotate-180" />
    </Collapsible.Trigger>
  );
}

function Badge({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'red' | 'green' | 'yellow' }) {
  const colors = {
    default: 'bg-muted text-muted-foreground',
    red: 'bg-red-500/10 text-red-600 dark:text-red-400',
    green: 'bg-green-500/10 text-green-600 dark:text-green-400',
    yellow: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  };
  return (
    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${colors[variant]}`}>
      {children}
    </span>
  );
}

export default function AnalysisSidebar({ audit, rewrite }: AnalysisSidebarProps) {
  const failCount = audit?.formatting_audit?.filter((i: any) => (i.status || '').toUpperCase() === 'FAIL').length || 0;
  const warnCount = audit?.formatting_audit?.filter((i: any) => (i.status || '').toUpperCase() === 'WARNING').length || 0;
  const issueCount = failCount + warnCount;

  return (
    <div className="divide-y divide-border">
      {/* Issues */}
      {audit?.formatting_audit && (
        <Collapsible.Root defaultOpen={false}>
          <SectionHeader badge={issueCount > 0 ? <Badge variant="red">{issueCount}</Badge> : undefined}>
            Issues
          </SectionHeader>
          <Collapsible.Panel className="overflow-hidden pb-3">
            <div className="space-y-1.5">
              {audit.formatting_audit.map((item: any, i: number) => {
                const status = (item.status || '').toUpperCase();
                if (status === 'PASS') return null;
                const icon = status === 'FAIL' ? '\u2717' : '\u26A0';
                const color = status === 'FAIL'
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-yellow-600 dark:text-yellow-400';
                return (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span className={`mt-0.5 shrink-0 ${color}`}>{icon}</span>
                    <div>
                      <p className="text-foreground">{item.item}</p>
                      {item.fix && <p className="text-muted-foreground">{item.fix}</p>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bullet issues */}
            {audit.bullet_analysis && Array.isArray(audit.bullet_analysis) && audit.bullet_analysis.some((b: any) => b.weak_verb || b.missing_metric || b.buried_keyword) && (
              <div className="mt-3 space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Bullet Issues</p>
                {audit.bullet_analysis.filter((b: any) => b.weak_verb || b.missing_metric || b.buried_keyword).map((bullet: any, i: number) => (
                  <div key={i} className="text-xs space-y-0.5">
                    <p className="text-foreground truncate">{bullet.original}</p>
                    <div className="flex flex-wrap gap-1">
                      {bullet.weak_verb && <Badge variant="red">weak verb</Badge>}
                      {bullet.missing_metric && <Badge variant="yellow">no metric</Badge>}
                      {bullet.buried_keyword && <Badge variant="yellow">buried keyword</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Collapsible.Panel>
        </Collapsible.Root>
      )}

      {/* Keywords */}
      {audit?.keyword_analysis && (
        <Collapsible.Root defaultOpen={false}>
          <SectionHeader badge={
            audit.keyword_analysis.keyword_match_percentage != null
              ? <Badge variant={audit.keyword_analysis.keyword_match_percentage >= 65 ? 'green' : 'yellow'}>
                  {audit.keyword_analysis.keyword_match_percentage}%
                </Badge>
              : undefined
          }>
            Keywords
          </SectionHeader>
          <Collapsible.Panel className="overflow-hidden pb-3">
            <div className="space-y-2">
              {audit.keyword_analysis.critical_missing?.length > 0 && (
                <div>
                  <p className="text-[10px] font-medium text-red-500 uppercase tracking-wide mb-1">Missing</p>
                  <div className="flex flex-wrap gap-1">
                    {audit.keyword_analysis.critical_missing.map((kw: string, i: number) => (
                      <span key={i} className="rounded-full bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-[10px] text-red-600 dark:text-red-400">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {audit.keyword_analysis.present_exact_match?.length > 0 && (
                <div>
                  <p className="text-[10px] font-medium text-green-500 uppercase tracking-wide mb-1">Matched</p>
                  <div className="flex flex-wrap gap-1">
                    {audit.keyword_analysis.present_exact_match.map((kw: string, i: number) => (
                      <span key={i} className="rounded-full bg-green-500/10 border border-green-500/20 px-2 py-0.5 text-[10px] text-green-600 dark:text-green-400">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {audit.keyword_analysis.present_wrong_phrasing?.length > 0 && (
                <div>
                  <p className="text-[10px] font-medium text-yellow-500 uppercase tracking-wide mb-1">Wrong Phrasing</p>
                  <div className="flex flex-wrap gap-1">
                    {audit.keyword_analysis.present_wrong_phrasing.map((kw: any, i: number) => (
                      <span key={i} className="rounded-full bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 text-[10px] text-yellow-600 dark:text-yellow-400">
                        {typeof kw === 'string' ? kw : `${kw.cv_phrase} \u2192 ${kw.jd_phrase}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Collapsible.Panel>
        </Collapsible.Root>
      )}

      {/* Quick Wins */}
      {audit?.top_5_quick_wins && Array.isArray(audit.top_5_quick_wins) && (
        <Collapsible.Root defaultOpen={true}>
          <SectionHeader badge={<Badge>{audit.top_5_quick_wins.length}</Badge>}>
            Quick Wins
          </SectionHeader>
          <Collapsible.Panel className="overflow-hidden pb-3">
            <div className="space-y-2">
              {audit.top_5_quick_wins.map((win: any, i: number) => {
                const impactColor =
                  win.impact === 'high' ? 'red' as const
                  : win.impact === 'medium' ? 'yellow' as const
                  : 'green' as const;
                return (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground mt-0.5">
                      {win.priority || i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground">{typeof win === 'string' ? win : win.action}</p>
                      {win.reason && <p className="text-muted-foreground mt-0.5">{win.reason}</p>}
                    </div>
                    {win.impact && <Badge variant={impactColor}>{win.impact}</Badge>}
                  </div>
                );
              })}
            </div>
          </Collapsible.Panel>
        </Collapsible.Root>
      )}

      {/* Changes Made */}
      {rewrite?.changes_made && Array.isArray(rewrite.changes_made) && rewrite.changes_made.length > 0 && (
        <Collapsible.Root defaultOpen={false}>
          <SectionHeader badge={<Badge>{rewrite.changes_made.length}</Badge>}>
            Changes Made
          </SectionHeader>
          <Collapsible.Panel className="overflow-hidden pb-3">
            <div className="space-y-2">
              {rewrite.changes_made.map((change: any, i: number) => (
                <div key={i} className="rounded-lg border border-border p-2 space-y-1.5 text-xs">
                  <p className="font-medium text-muted-foreground uppercase text-[10px] tracking-wide">{change.section}</p>
                  <div className="rounded bg-red-500/10 dark:bg-red-500/15 p-1.5">
                    <p className="text-foreground line-through opacity-60">{change.original}</p>
                  </div>
                  <div className="rounded bg-green-500/10 dark:bg-green-500/15 p-1.5">
                    <p className="text-foreground">{change.rewritten}</p>
                  </div>
                  {change.reason && (
                    <p className="text-muted-foreground italic">{change.reason}</p>
                  )}
                </div>
              ))}
            </div>
          </Collapsible.Panel>
        </Collapsible.Root>
      )}
    </div>
  );
}
