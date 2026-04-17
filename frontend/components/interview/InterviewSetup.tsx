'use client';

import { useEffect, useState } from 'react';
import { FileText, Briefcase, Sparkles } from 'lucide-react';
import { getCVHistory } from '@/lib/api';
import { useInterviewStore } from '@/store/interviewStore';
import type { CVRecord } from '@/types';

const DIFFICULTIES = [
  { id: 'standard',    label: 'Standard',    desc: 'Realistic mid-level interviewer'  },
  { id: 'challenging', label: 'Challenging', desc: 'Senior interviewer, deep probes'   },
  { id: 'stress',      label: 'Stress',      desc: 'Adversarial, time-pressure style'  },
] as const;

type DiffId = typeof DIFFICULTIES[number]['id'];

export default function InterviewSetup() {
  const { start, starting } = useInterviewStore();

  const [cvs, setCvs] = useState<CVRecord[]>([]);
  const [cvId, setCvId] = useState<string>('');
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [difficulty, setDifficulty] = useState<DiffId>('standard');

  useEffect(() => {
    getCVHistory()
      .then((r) => {
        const list = r.data.cvs || [];
        setCvs(list);
        if (list[0]?.id) setCvId(list[0].id);
      })
      .catch(() => {});
  }, []);

  const canStart = jobDescription.trim().length >= 30 && !starting;

  const handleStart = () => {
    if (!canStart) return;
    start({
      cv_id: cvId || null,
      job_title: jobTitle.trim() || undefined,
      job_description: jobDescription.trim(),
      difficulty,
    });
  };

  return (
    <div className="mx-auto max-w-3xl">
      {/* CV picker */}
      <div className="rounded-2xl p-4 sm:p-5" style={glass}>
        <div className="flex items-center gap-2 mb-3">
          <FileText className="h-4 w-4" style={{ color: '#a78bfa' }} />
          <p className="text-xs font-bold uppercase tracking-widest text-white/50">Your CV (optional but recommended)</p>
        </div>

        {cvs.length === 0 ? (
          <p className="text-sm text-white/45">
            No CV history yet. You can still run the interview based on the job description alone.
          </p>
        ) : (
          <select
            value={cvId}
            onChange={(e) => setCvId(e.target.value)}
            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.85)',
            }}
          >
            <option value="" style={{ background: '#12163a' }}>No CV — interview based on JD only</option>
            {cvs.map((cv) => (
              <option key={cv.id} value={cv.id} style={{ background: '#12163a' }}>
                {cv.file_name || 'CV'} · ATS {cv.ats_score ?? '—'} · {new Date(cv.created_at).toLocaleDateString()}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Job title + description */}
      <div className="rounded-2xl p-4 sm:p-5 mt-4" style={glass}>
        <div className="flex items-center gap-2 mb-3">
          <Briefcase className="h-4 w-4" style={{ color: '#a78bfa' }} />
          <p className="text-xs font-bold uppercase tracking-widest text-white/50">The role you are interviewing for</p>
        </div>

        <input
          type="text"
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          placeholder="Job title (optional) — e.g. Senior Backend Engineer"
          className="w-full rounded-xl px-3 py-2.5 text-sm outline-none mb-3"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.85)',
          }}
        />

        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the full job description here (required)…"
          rows={6}
          className="w-full rounded-xl px-3 py-2.5 text-sm outline-none resize-y"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.85)',
            minHeight: 140,
          }}
        />
        <p className="text-[11px] text-white/35 mt-2">
          {jobDescription.trim().length < 30
            ? `Need at least ${30 - jobDescription.trim().length} more characters`
            : `${jobDescription.trim().length} characters`}
        </p>
      </div>

      {/* Difficulty */}
      <div className="rounded-2xl p-4 sm:p-5 mt-4" style={glass}>
        <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-3">Difficulty</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {DIFFICULTIES.map((d) => {
            const active = difficulty === d.id;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => setDifficulty(d.id)}
                className="text-left rounded-xl px-3 py-3 transition-all"
                style={{
                  background: active ? 'rgba(118,77,240,0.14)' : 'rgba(255,255,255,0.025)',
                  border: active ? '1px solid rgba(118,77,240,0.55)' : '1px solid rgba(255,255,255,0.07)',
                  boxShadow: active ? '0 0 0 3px rgba(118,77,240,0.10)' : 'none',
                }}
              >
                <p className="text-sm font-bold text-white">{d.label}</p>
                <p className="text-[11px] text-white/45 mt-0.5">{d.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Start */}
      <button
        type="button"
        onClick={handleStart}
        disabled={!canStart}
        className="mt-5 w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold transition-all disabled:opacity-40"
        style={{
          background: 'linear-gradient(135deg,#764DF0,#5b21b6)',
          color: 'white',
          boxShadow: canStart ? '0 8px 24px rgba(118,77,240,0.35)' : 'none',
        }}
      >
        {starting ? (
          <>
            <span className="lds-roller-sm"><span /><span /><span /><span /><span /><span /><span /><span /></span>
            Generating questions…
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Start Mock Interview
          </>
        )}
      </button>

      <p className="text-[11px] text-white/35 mt-3 text-center">
        You will answer 6 to 8 AI-generated questions by voice. We will score each answer and give
        you a final performance report.
      </p>
    </div>
  );
}

const glass = {
  background: 'rgba(0,0,0,0.30)',
  backdropFilter: 'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)',
  border: '1px solid rgba(255,255,255,0.08)',
} as const;
