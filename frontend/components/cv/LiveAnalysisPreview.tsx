'use client';

/**
 * LiveAnalysisPreview
 *
 * Renders the streaming analysis state from the CV analysis store as a small
 * "ticker" panel shown next to the loading hero. As each NDJSON event lands —
 * parsed → audit → rewrite — a card slides in with the partial result, so the
 * user sees real progress instead of a static spinner.
 */

import { useEffect, useMemo, useState } from 'react';
import { useCVAnalysisStore, type AnalysisPhase } from '@/store/cvAnalysisStore';
import {
  FileSearch, Search, Sparkles, CheckCircle2, User, Briefcase, Target, ArrowUp,
} from 'lucide-react';

const glass = {
  background: 'rgba(0,0,0,0.30)',
  backdropFilter: 'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)',
  border: '1px solid rgba(255,255,255,0.08)',
} as const;

// Animate a number from 0 → target over ~900ms with ease-out so the score
// ring feels alive when it lands.
const useCountUp = (target: number) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!target) { setValue(0); return; }
    const startedAt = performance.now();
    const start = 0;
    let raf = 0;
    const tick = (now: number) => {
      const elapsed = now - startedAt;
      const t = Math.min(1, elapsed / 900);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(start + (target - start) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return value;
};

const scoreColor = (score: number) => {
  if (score < 40) return { fg: '#ef4444', glow: 'rgba(239,68,68,0.35)' };
  if (score < 60) return { fg: '#f59e0b', glow: 'rgba(245,158,11,0.35)' };
  if (score < 75) return { fg: '#a78bfa', glow: 'rgba(167,139,250,0.35)' };
  return { fg: '#764DF0', glow: 'rgba(118,77,240,0.35)' };
};

const PhaseBadge = ({ phase }: { phase: AnalysisPhase }) => {
  const map: Record<Exclude<AnalysisPhase, 'idle'>, { label: string; Icon: typeof FileSearch }> = {
    parsing:    { label: 'Reading your CV',     Icon: FileSearch },
    working:    { label: 'Auditing & rewriting', Icon: Search },
    finalizing: { label: 'Polishing the result', Icon: Sparkles },
  };
  if (phase === 'idle') return null;
  const { label, Icon } = map[phase];
  return (
    <div
      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5"
      style={{
        background: 'rgba(118,77,240,0.15)',
        border: '1px solid rgba(118,77,240,0.35)',
        color: '#c4b5fd',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}
    >
      <Icon className="h-3 w-3 animate-pulse" />
      {label}
    </div>
  );
};

const Skeleton = ({ width = '100%', height = 12 }: { width?: string | number; height?: number }) => (
  <div
    className="rounded"
    style={{
      width,
      height,
      background: 'linear-gradient(90deg,rgba(255,255,255,0.04) 0%,rgba(255,255,255,0.10) 50%,rgba(255,255,255,0.04) 100%)',
      backgroundSize: '200% 100%',
      animation: 'jh-shimmer 1.4s ease-in-out infinite',
    }}
  />
);

// Pin a chip into the live skill list with a small pop-in animation.
const Chip = ({ label, delay = 0 }: { label: string; delay?: number }) => (
  <span
    className="rounded-full"
    style={{
      padding: '4px 10px',
      fontSize: 11,
      fontWeight: 600,
      color: 'rgba(255,255,255,0.85)',
      background: 'rgba(118,77,240,0.18)',
      border: '1px solid rgba(118,77,240,0.32)',
      animation: `jh-pop-in 380ms ease-out both`,
      animationDelay: `${delay}ms`,
      whiteSpace: 'nowrap',
    }}
  >
    {label}
  </span>
);

const Row = ({
  Icon, label, value, loading,
}: {
  Icon: typeof User;
  label: string;
  value?: string | null;
  loading?: boolean;
}) => (
  <div className="flex items-center gap-3">
    <div
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
      style={{ background: 'rgba(118,77,240,0.15)', border: '1px solid rgba(118,77,240,0.25)' }}
    >
      <Icon className="h-4 w-4" style={{ color: '#a78bfa' }} />
    </div>
    <div className="min-w-0 flex-1">
      <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
        {label}
      </div>
      {loading ? (
        <div className="mt-1.5"><Skeleton height={11} /></div>
      ) : (
        <div
          className="mt-0.5 truncate text-sm font-semibold text-white"
          style={{ animation: 'jh-fade-up 320ms ease-out both' }}
        >
          {value || '—'}
        </div>
      )}
    </div>
  </div>
);

export default function LiveAnalysisPreview() {
  const { phase, liveParsed, liveAudit, liveFinalCV } = useCVAnalysisStore();

  const fullName: string | null = liveParsed?.cv_parsed?.full_name || null;
  const targetTitle: string | null =
    liveParsed?.jd_fingerprint?.target_job_title || null;
  const requiredSkills: string[] = useMemo(() => {
    const hard = liveParsed?.jd_fingerprint?.required_hard_skills || [];
    return Array.isArray(hard) ? hard.slice(0, 8) : [];
  }, [liveParsed]);

  const score = liveAudit?.ats_scores?.overall ?? 0;
  const projected = liveAudit?.projected_score_after_fixes ?? 0;
  const gain = Math.max(0, projected - score);
  const animatedScore = useCountUp(liveAudit ? score : 0);
  const { fg, glow } = scoreColor(score);

  const sampleBullet: string | null = useMemo(() => {
    const exp = liveFinalCV?.experience;
    if (!Array.isArray(exp)) return null;
    for (const role of exp) {
      const b = Array.isArray(role?.bullets) && role.bullets[0];
      if (b && typeof b === 'string') return b;
    }
    return null;
  }, [liveFinalCV]);

  if (phase === 'idle') return null;

  return (
    <>
      {/* Local keyframes — keeps this self-contained without touching globals. */}
      <style jsx>{`
        @keyframes jh-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes jh-pop-in {
          0%   { opacity: 0; transform: translateY(6px) scale(0.92); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes jh-fade-up {
          0%   { opacity: 0; transform: translateY(6px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes jh-card-in {
          0%   { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        className="rounded-2xl overflow-hidden w-full mt-6"
        style={{ ...glass, maxWidth: '480px', animation: 'jh-card-in 380ms ease-out both' }}
      >
        <div style={{ height: '2px', background: 'linear-gradient(90deg,transparent,rgba(118,77,240,0.9),transparent)' }} />

        <div className="p-5 sm:p-6 space-y-5">
          {/* Phase header */}
          <div className="flex items-center justify-between">
            <PhaseBadge phase={phase} />
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Live Preview
            </span>
          </div>

          {/* Identity rows — appear as soon as Stage 1a lands */}
          <div className="space-y-3">
            <Row Icon={User} label="Candidate" value={fullName} loading={!liveParsed} />
            <Row Icon={Target} label="Target Role" value={targetTitle} loading={!liveParsed} />
          </div>

          {/* Required skills — pop in once parsed */}
          {liveParsed && requiredSkills.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Keywords from JD
              </div>
              <div className="flex flex-wrap gap-1.5">
                {requiredSkills.map((s, i) => (
                  <Chip key={`${s}-${i}`} label={s} delay={i * 60} />
                ))}
              </div>
            </div>
          )}

          {/* ATS score reveal — animates in when audit lands */}
          {liveAudit && (
            <div
              className="flex items-center gap-4 rounded-xl p-3"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                animation: 'jh-card-in 420ms ease-out both',
              }}
            >
              <div
                className="flex shrink-0 items-center justify-center rounded-2xl tabular-nums"
                style={{
                  width: 64, height: 64,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: `0 0 30px ${glow}, inset 0 1px 0 rgba(255,255,255,0.06)`,
                  color: fg,
                  fontSize: 26,
                  fontWeight: 900,
                  lineHeight: 1,
                }}
              >
                {animatedScore}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Current ATS Score
                </div>
                <div className="mt-1 text-sm font-semibold text-white">
                  {score < 60
                    ? 'Lots of room to improve'
                    : score < 80
                    ? 'Solid — we can push it higher'
                    : 'Already strong'}
                </div>
                {gain > 0 && (
                  <div className="mt-1 inline-flex items-center gap-1 text-xs font-bold" style={{ color: '#10b981' }}>
                    <ArrowUp className="h-3 w-3" />
                    +{gain} after rewrite
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Rewrite preview — sample bullet animates in when Stage 3 lands */}
          {phase !== 'parsing' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Rewriting your bullets
                </div>
                {liveFinalCV && (
                  <CheckCircle2 className="h-3.5 w-3.5" style={{ color: '#10b981' }} />
                )}
              </div>
              {liveFinalCV && sampleBullet ? (
                <div
                  className="rounded-lg p-3 text-sm leading-relaxed"
                  style={{
                    background: 'rgba(118,77,240,0.10)',
                    border: '1px solid rgba(118,77,240,0.25)',
                    color: 'rgba(255,255,255,0.92)',
                    animation: 'jh-fade-up 420ms ease-out both',
                  }}
                >
                  <div className="flex items-start gap-2">
                    <Briefcase className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: '#a78bfa' }} />
                    <span>{sampleBullet}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Skeleton height={10} width="92%" />
                  <Skeleton height={10} width="78%" />
                  <Skeleton height={10} width="84%" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
