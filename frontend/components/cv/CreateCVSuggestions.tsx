'use client';

/**
 * CreateCVSuggestions — right-column "tips" card for the create-cv preview.
 *
 * Runs cheap, deterministic heuristics on the generated CV (no AI call) to
 * surface actionable improvement ideas, mirroring the style of AnalysisSidebar
 * on the analyzer page. Each tip has an "Ask AI to fix" button that hands a
 * concrete refine prompt to QuickEditBox via the `onApply` callback.
 */

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Lightbulb, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';

type Severity = 'warn' | 'info' | 'good';

interface Tip {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
  /** Ready-to-send refine prompt the user can fire at QuickEditBox. */
  prompt: string;
}

interface Props {
  cv: any;
  onApply?: (prompt: string) => void;
}

// Detect numeric/metric content in a bullet — same flavour as the Sales template
const HAS_METRIC = /[+\-]?\$?\d[\d,.]*[KMBkmb]?%?/;

const buildTips = (cv: any): Tip[] => {
  if (!cv) return [];
  const tips: Tip[] = [];

  const summary = String(cv.summary || '').trim();
  const summaryWords = summary ? summary.split(/\s+/).length : 0;
  if (!summary) {
    tips.push({
      id: 'no-summary',
      severity: 'warn',
      title: 'No professional summary',
      detail: 'Recruiters skim the top 6 lines first. A 2–3 sentence summary anchors the rest.',
      prompt: 'Write a strong 2–3 sentence professional summary based on my experience and skills.',
    });
  } else if (summaryWords > 70) {
    tips.push({
      id: 'summary-long',
      severity: 'warn',
      title: 'Summary is too long',
      detail: `It's ${summaryWords} words. Aim for 30–60 — anything more gets skimmed past.`,
      prompt: 'Tighten my professional summary to under 60 words while keeping the strongest signals.',
    });
  } else {
    tips.push({
      id: 'summary-good',
      severity: 'good',
      title: 'Summary length is on target',
      detail: 'Concise summaries get read. Yours is in the recruiter-friendly range.',
      prompt: '',
    });
  }

  const exp = Array.isArray(cv.experience) ? cv.experience : [];
  const allBullets: string[] = exp.flatMap((r: any) => (Array.isArray(r?.bullets) ? r.bullets : []))
    .map((b: any) => String(b || '').trim())
    .filter(Boolean);

  if (allBullets.length === 0 && exp.length > 0) {
    tips.push({
      id: 'no-bullets',
      severity: 'warn',
      title: 'Roles have no achievements',
      detail: 'Job titles alone don\'t differentiate. Add 3–5 outcome-focused bullets per role.',
      prompt: 'For each role, add 3–5 bullets focused on outcomes and impact, written in my voice.',
    });
  } else if (allBullets.length > 0) {
    const withMetrics = allBullets.filter((b) => HAS_METRIC.test(b)).length;
    const ratio = withMetrics / allBullets.length;
    if (ratio < 0.3) {
      tips.push({
        id: 'low-metrics',
        severity: 'warn',
        title: 'Quantify more achievements',
        detail: `Only ${withMetrics} of ${allBullets.length} bullets have numbers. Hit 40%+ to stand out.`,
        prompt: 'Rewrite my bullets to add concrete numbers, percentages, or scale wherever possible — without inventing facts.',
      });
    }
  }

  const skills = Array.isArray(cv.skills) ? cv.skills.filter(Boolean) : [];
  if (skills.length < 6) {
    tips.push({
      id: 'few-skills',
      severity: 'info',
      title: 'Skills section is thin',
      detail: `${skills.length} skill${skills.length === 1 ? '' : 's'} listed. ATS keyword match needs 8–15 relevant ones.`,
      prompt: 'Suggest 6–10 industry-standard hard skills relevant to my role and add them to the skills section.',
    });
  }

  const certs = Array.isArray(cv.certifications) ? cv.certifications.filter(Boolean) : [];
  if (certs.length === 0) {
    tips.push({
      id: 'no-certs',
      severity: 'info',
      title: 'No certifications listed',
      detail: 'Even one widely-recognised certification (AWS, PMP, Scrum, etc.) lifts ATS scores noticeably.',
      prompt: 'Suggest 2–3 industry-standard certifications relevant to my role and add them to the certifications section.',
    });
  }

  if (!cv.linkedin || !String(cv.linkedin).trim()) {
    tips.push({
      id: 'no-linkedin',
      severity: 'info',
      title: 'No LinkedIn URL',
      detail: '92% of recruiters check LinkedIn after reading the CV. Add yours next to your contact.',
      prompt: '', // user fills this themselves — no AI prompt
    });
  }

  // Generic strong-verb push if everything else looks fine
  if (allBullets.length >= 6) {
    tips.push({
      id: 'sharper-verbs',
      severity: 'info',
      title: 'Sharpen your bullet openings',
      detail: 'Vary the action verb on each bullet — never start two consecutive bullets the same way.',
      prompt: 'Rewrite my bullets so each starts with a different strong action verb. Vary openings — numbers, results, problem-first, context-first.',
    });
  }

  return tips;
};

const ICONS: Record<Severity, { Icon: typeof AlertTriangle; color: string; bg: string; border: string }> = {
  warn: {
    Icon: AlertTriangle,
    color: '#fbbf24',
    bg: 'rgba(251,191,36,0.10)',
    border: 'rgba(251,191,36,0.30)',
  },
  info: {
    Icon: Lightbulb,
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.10)',
    border: 'rgba(167,139,250,0.30)',
  },
  good: {
    Icon: CheckCircle2,
    color: '#34d399',
    bg: 'rgba(52,211,153,0.10)',
    border: 'rgba(52,211,153,0.28)',
  },
};

const glass = {
  background: 'rgba(0,0,0,0.30)',
  backdropFilter: 'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)',
  border: '1px solid rgba(255,255,255,0.08)',
} as const;

export default function CreateCVSuggestions({ cv, onApply }: Props) {
  const tips = useMemo(() => buildTips(cv), [cv]);
  const [openIds, setOpenIds] = useState<Set<string>>(() => {
    // First two are open by default — usually the highest-priority ones.
    const initial = tips.slice(0, 2).map((t) => t.id);
    return new Set(initial);
  });

  const toggle = (id: string) =>
    setOpenIds((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const warnCount = tips.filter((t) => t.severity === 'warn').length;

  if (tips.length === 0) return null;

  return (
    <div className="rounded-2xl overflow-hidden" style={glass}>
      <div style={{ height: '2px', background: 'linear-gradient(90deg,transparent,rgba(118,77,240,0.9),transparent)' }} />
      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-3.5 w-3.5" style={{ color: '#a78bfa' }} />
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/55 flex-1">
            Suggestions
          </p>
          {warnCount > 0 && (
            <span
              className="rounded-full px-2 py-0.5 text-[9px] font-bold"
              style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.25)' }}
            >
              {warnCount} priority
            </span>
          )}
        </div>

        <div className="space-y-2">
          {tips.map((tip) => {
            const open = openIds.has(tip.id);
            const meta = ICONS[tip.severity];
            const { Icon } = meta;
            return (
              <div
                key={tip.id}
                className="rounded-xl overflow-hidden transition-colors"
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <button
                  type="button"
                  onClick={() => toggle(tip.id)}
                  aria-expanded={open}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left"
                >
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                    style={{ background: meta.bg, border: `1px solid ${meta.border}` }}
                  >
                    <Icon className="h-3 w-3" style={{ color: meta.color }} />
                  </span>
                  <span className="flex-1 min-w-0 text-[12.5px] font-semibold text-white/85 truncate">
                    {tip.title}
                  </span>
                  {open
                    ? <ChevronUp className="h-3.5 w-3.5 shrink-0 text-white/40" />
                    : <ChevronDown className="h-3.5 w-3.5 shrink-0 text-white/40" />}
                </button>
                {open && (
                  <div className="px-3 pb-3 pt-1">
                    <p className="text-[11.5px] leading-relaxed mb-2" style={{ color: 'rgba(255,255,255,0.55)' }}>
                      {tip.detail}
                    </p>
                    {tip.prompt && (
                      <button
                        type="button"
                        onClick={() => onApply?.(tip.prompt)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-colors"
                        style={{
                          background: 'rgba(118,77,240,0.18)',
                          border: '1px solid rgba(118,77,240,0.35)',
                          color: '#c4b5fd',
                        }}
                      >
                        <Sparkles className="h-3 w-3" />
                        Ask AI to fix this
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
