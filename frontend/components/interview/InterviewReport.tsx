'use client';

import { useState } from 'react';
import { CheckCircle2, AlertCircle, TrendingUp, ChevronDown, Trophy, RotateCcw } from 'lucide-react';
import { useInterviewStore } from '@/store/interviewStore';

const glass = {
  background: 'rgba(0,0,0,0.30)',
  backdropFilter: 'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)',
  border: '1px solid rgba(255,255,255,0.08)',
} as const;

export default function InterviewReport() {
  const { questions, answers, report, jobTitle, reset } = useInterviewStore();
  const [open, setOpen] = useState<number | null>(0);

  if (!report) return null;

  const score = report.overall_score;
  const color = score >= 80 ? '#34d399' : score >= 60 ? '#a78bfa' : score >= 40 ? '#fbbf24' : '#f87171';

  return (
    <div className="mx-auto max-w-4xl">
      {/* Overall score */}
      <div className="rounded-2xl p-5 sm:p-6 text-center" style={glass}>
        <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-white/50">
          <Trophy className="h-3.5 w-3.5" style={{ color: '#fbbf24' }} />
          Interview Report{jobTitle ? ` · ${jobTitle}` : ''}
        </div>
        <div className="mt-4 flex items-end justify-center gap-1">
          <span className="font-black tabular-nums leading-none" style={{ fontSize: 'clamp(64px, 15vw, 96px)', color }}>
            {score}
          </span>
          <span className="text-xl font-black text-white/30 mb-2">/100</span>
        </div>
        <p className="text-sm text-white/55 mt-2">
          {score >= 80 ? 'Strong performance — you are interview-ready.'
            : score >= 60 ? 'Solid performance with clear areas to sharpen.'
            : score >= 40 ? 'Some gaps to address before the real interview.'
            : 'Significant prep needed — practice the improvements below.'}
        </p>
      </div>

      {/* Strengths / Weaknesses / Improvements */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mt-4">
        <ListCard
          title="Strengths"
          icon={<CheckCircle2 className="h-4 w-4" style={{ color: '#34d399' }} />}
          items={report.strengths}
          accent="#34d399"
        />
        <ListCard
          title="Weaknesses"
          icon={<AlertCircle className="h-4 w-4" style={{ color: '#fbbf24' }} />}
          items={report.weaknesses}
          accent="#fbbf24"
        />
        <ListCard
          title="Top improvements"
          icon={<TrendingUp className="h-4 w-4" style={{ color: '#a78bfa' }} />}
          items={report.top_improvements}
          accent="#a78bfa"
          ordered
        />
      </div>

      {/* Per-question breakdown */}
      <div className="rounded-2xl mt-4 overflow-hidden" style={glass}>
        <div className="px-4 sm:px-5 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <p className="text-xs font-bold uppercase tracking-widest text-white/50">Per-question breakdown</p>
        </div>
        {questions.map((q, i) => {
          const a = answers[q.id];
          const isOpen = open === i;
          return (
            <div key={q.id} className="border-b last:border-b-0" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                className="w-full flex items-center gap-3 px-4 sm:px-5 py-3 text-left"
              >
                <span className="text-[10px] font-black w-6 shrink-0 text-white/40">#{i + 1}</span>
                <span className="flex-1 min-w-0 text-[13px] text-white/85 truncate">{q.text}</span>
                {a && (
                  <span
                    className="text-[11px] font-black tabular-nums shrink-0 px-2 py-0.5 rounded"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      color: a.score >= 80 ? '#34d399' : a.score >= 60 ? '#a78bfa' : a.score >= 40 ? '#fbbf24' : '#f87171',
                    }}
                  >
                    {a.score}
                  </span>
                )}
                <ChevronDown
                  className="h-4 w-4 shrink-0 text-white/30 transition-transform"
                  style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}
                />
              </button>
              {isOpen && a && (
                <div className="px-4 sm:px-5 pb-4 space-y-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Your answer</p>
                    <p className="text-[13px] text-white/75 whitespace-pre-wrap">{a.transcript || <em className="opacity-50">(no answer)</em>}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Feedback</p>
                    <p className="text-[13px] text-white/75 whitespace-pre-wrap">{a.feedback}</p>
                  </div>
                  {a.missing_signals && a.missing_signals.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Signals to add</p>
                      <div className="flex flex-wrap gap-1.5">
                        {a.missing_signals.map((s, k) => (
                          <span key={k} className="text-[11px] px-2 py-0.5 rounded"
                            style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.25)' }}
                          >{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center mt-5">
        <button
          type="button"
          onClick={reset}
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold"
          style={{
            background: 'rgba(118,77,240,0.18)',
            border: '1px solid rgba(118,77,240,0.35)',
            color: '#c4b5fd',
          }}
        >
          <RotateCcw className="h-4 w-4" />
          Run another interview
        </button>
      </div>
    </div>
  );
}

function ListCard({
  title,
  icon,
  items,
  accent,
  ordered,
}: {
  title: string;
  icon: React.ReactNode;
  items: string[];
  accent: string;
  ordered?: boolean;
}) {
  return (
    <div className="rounded-2xl p-4 sm:p-5" style={glass}>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>{title}</p>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-white/40 italic">No items.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li key={i} className="text-[13px] text-white/75 leading-relaxed flex gap-2">
              <span className="shrink-0 font-black" style={{ color: accent }}>{ordered ? `${i + 1}.` : '•'}</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
