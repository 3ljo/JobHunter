'use client';

import { Collapsible } from '@base-ui/react/collapsible';
import { ChevronDown } from 'lucide-react';

interface AnalysisSidebarProps {
  audit: any;
  rewrite: any;
}

function SectionHeader({ children, badge }: { children: React.ReactNode; badge?: React.ReactNode }) {
  return (
    <Collapsible.Trigger className="flex w-full items-center justify-between py-2 text-sm font-medium text-zinc-200 cursor-pointer hover:text-white transition-colors">
      <div className="flex items-center gap-2">
        <span>{children}</span>
        {badge}
      </div>
      <ChevronDown className="h-3.5 w-3.5 text-zinc-500 transition-transform duration-200 [[data-open]_&]:rotate-180" />
    </Collapsible.Trigger>
  );
}

function Badge({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'red' | 'green' | 'yellow' }) {
  const colors = {
    default: 'bg-zinc-800 text-zinc-400',
    red: 'bg-red-500/10 text-red-400',
    green: 'bg-green-500/10 text-green-400',
    yellow: 'bg-yellow-500/10 text-yellow-400',
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
    <div className="divide-y divide-white/[0.06]">
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
                const color = status === 'FAIL' ? 'text-red-400' : 'text-yellow-400';
                return (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span className={`mt-0.5 shrink-0 ${color}`}>{icon}</span>
                    <div>
                      <p className="text-zinc-200">{item.item}</p>
                      {item.fix && <p className="text-zinc-500">{item.fix}</p>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bullet issues */}
            {audit.bullet_analysis && Array.isArray(audit.bullet_analysis) && audit.bullet_analysis.some((b: any) => b.weak_verb || b.missing_metric || b.buried_keyword) && (
              <div className="mt-3 space-y-1.5">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Bullet Issues</p>
                {audit.bullet_analysis.filter((b: any) => b.weak_verb || b.missing_metric || b.buried_keyword).map((bullet: any, i: number) => (
                  <div key={i} className="text-xs space-y-0.5">
                    <p className="text-zinc-200 truncate">{bullet.original}</p>
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

      {/* Changes Made */}
      {rewrite?.changes_made && Array.isArray(rewrite.changes_made) && rewrite.changes_made.length > 0 && (
        <Collapsible.Root defaultOpen={false}>
          <SectionHeader badge={<Badge>{rewrite.changes_made.length}</Badge>}>
            Changes Made
          </SectionHeader>
          <Collapsible.Panel className="overflow-hidden pb-3">
            <div className="space-y-2">
              {rewrite.changes_made.map((change: any, i: number) => (
                <div key={i} className="rounded-lg border border-white/[0.06] p-2 space-y-1.5 text-xs">
                  <p className="font-medium text-zinc-500 uppercase text-[10px] tracking-wide">{change.section}</p>
                  <div className="rounded bg-red-500/10 p-1.5">
                    <p className="text-zinc-300 line-through opacity-60">{change.original}</p>
                  </div>
                  <div className="rounded bg-green-500/10 p-1.5">
                    <p className="text-zinc-200">{change.rewritten}</p>
                  </div>
                  {change.reason && (
                    <p className="text-zinc-500 italic">{change.reason}</p>
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
