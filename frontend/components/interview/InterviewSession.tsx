'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft, ChevronRight, X, Check, Mic, MicOff,
  Keyboard, Send, AlertTriangle, Volume2,
} from 'lucide-react';
import { useInterviewStore } from '@/store/interviewStore';
import { useVoiceRecognition } from './useVoiceRecognition';

const glass = {
  background: 'rgba(0,0,0,0.32)',
  backdropFilter: 'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)',
  border: '1px solid rgba(255,255,255,0.08)',
} as const;

const KIND_STYLES = {
  behavioral:  { label: 'Behavioral',  bg: 'rgba(96,165,250,0.15)',  color: '#60a5fa' },
  technical:   { label: 'Technical',   bg: 'rgba(52,211,153,0.15)',  color: '#34d399' },
  situational: { label: 'Situational', bg: 'rgba(251,191,36,0.15)',  color: '#fbbf24' },
} as const;

export default function InterviewSession() {
  const {
    questions, currentIndex, answers,
    scoring, finalizing,
    submitAnswer, next, finish, goToIndex, reset,
  } = useInterviewStore();

  const voice = useVoiceRecognition();

  const [exitOpen, setExitOpen] = useState(false);
  const [typingMode, setTypingMode] = useState(false);
  const [typed, setTyped] = useState('');

  const currentQ = questions[currentIndex];
  const currentAnswer = currentQ ? answers[currentQ.id] : undefined;
  const isLast = currentIndex === questions.length - 1;
  const allDone = questions.length > 0 && questions.every((q) => answers[q.id]);

  // Reset voice/typed state when question changes
  const lastIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!currentQ) return;
    if (lastIdRef.current === currentQ.id) return;
    lastIdRef.current = currentQ.id;
    voice.stop();
    voice.reset();
    setTyped('');
  }, [currentQ?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const transcript = useMemo(() => {
    if (typingMode) return typed.trim();
    return [voice.transcript, voice.interim].filter(Boolean).join(' ').trim();
  }, [typingMode, typed, voice.transcript, voice.interim]);

  const wordCount = transcript ? transcript.split(/\s+/).filter(Boolean).length : 0;
  const canSubmit = !!currentQ && transcript.length >= 5 && !scoring;

  const toggleMic = () => voice.listening ? voice.stop() : voice.start();

  const onSubmit = async () => {
    if (!currentQ || !canSubmit) return;
    voice.stop();
    const ok = await submitAnswer(currentQ.id, transcript);
    if (!ok) return;
    setTyped('');
    voice.reset();
  };

  const onPrev = () => {
    if (currentIndex === 0) return;
    voice.stop();
    goToIndex(currentIndex - 1);
  };

  const onNext = () => {
    if (isLast) { if (allDone) finish(); return; }
    voice.stop();
    next();
  };

  const onExit = () => { voice.stop(); reset(); };

  if (!currentQ) return null;
  const kind = KIND_STYLES[currentQ.kind];

  return (
    <div className="mx-auto w-full max-w-3xl">

      {/* ─── TOP BAR ─── */}
      <div className="flex items-center gap-2 sm:gap-3 mb-5">
        <IconBtn onClick={onPrev} disabled={currentIndex === 0} aria-label="Previous">
          <ChevronLeft className="h-4 w-4" />
        </IconBtn>

        <div className="flex-1 flex items-center gap-2 min-w-0">
          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${((currentIndex + 1) / questions.length) * 100}%`,
                background: 'linear-gradient(90deg,#764DF0,#a78bfa)',
              }}
            />
          </div>
          <span className="text-[11px] font-bold tabular-nums text-white/55 shrink-0">
            {currentIndex + 1}/{questions.length}
          </span>
        </div>

        <IconBtn onClick={() => setExitOpen(true)} aria-label="Exit" danger>
          <X className="h-4 w-4" />
        </IconBtn>
      </div>

      {/* ─── QUESTION CARD ─── */}
      <div className="rounded-3xl p-6 sm:p-8 mb-4 sm:mb-5" style={glass}>
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <span
            className="text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest"
            style={{ background: kind.bg, color: kind.color, border: `1px solid ${kind.color}33` }}
          >
            {kind.label}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">
            Question {currentIndex + 1}
          </span>
        </div>
        <p className="text-lg sm:text-xl md:text-2xl font-semibold text-white leading-relaxed">
          {currentQ.text}
        </p>
      </div>

      {/* ─── ANSWER CARD ─── */}
      <div className="rounded-3xl p-5 sm:p-6" style={glass}>
        {/* Tabs: Voice | Type */}
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-white/55">Your answer</h3>

          <div
            className="inline-flex rounded-xl p-1 gap-1"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <TabBtn active={!typingMode} onClick={() => setTypingMode(false)}>
              <Mic className="h-3.5 w-3.5" /> Voice
            </TabBtn>
            <TabBtn active={typingMode} onClick={() => setTypingMode(true)}>
              <Keyboard className="h-3.5 w-3.5" /> Type
            </TabBtn>
          </div>
        </div>

        {/* Unsupported mic warning */}
        {!typingMode && !voice.supported && (
          <Banner color="amber" icon={<AlertTriangle className="h-3.5 w-3.5" />}>
            Your browser doesn&apos;t support speech recognition. Switch to &quot;Type&quot; above.
          </Banner>
        )}
        {voice.error && (
          <Banner color="red" icon={<AlertTriangle className="h-3.5 w-3.5" />}>
            {voice.error}
          </Banner>
        )}

        {/* Voice mode */}
        {!typingMode && voice.supported && (
          <>
            {/* Transcript box */}
            <div
              className="rounded-2xl p-4 sm:p-5 mb-5"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${voice.listening ? 'rgba(239,68,68,0.35)' : 'rgba(255,255,255,0.06)'}`,
                minHeight: 140,
                transition: 'border-color 200ms',
              }}
            >
              {transcript ? (
                <p className="text-[15px] sm:text-base text-white/90 leading-relaxed break-words">
                  {voice.transcript}
                  {voice.interim && <span className="opacity-40"> {voice.interim}</span>}
                </p>
              ) : (
                <p className="text-sm text-white/35 italic">
                  {voice.listening
                    ? 'Listening… speak clearly, I&apos;m transcribing.'
                    : 'Tap the mic below and start speaking your answer.'}
                </p>
              )}
            </div>

            {/* Big mic */}
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={toggleMic}
                aria-label={voice.listening ? 'Stop recording' : 'Start recording'}
                className="relative flex items-center justify-center rounded-full transition-all"
                style={{
                  width: 88,
                  height: 88,
                  background: voice.listening
                    ? 'linear-gradient(135deg,#ef4444,#dc2626)'
                    : 'linear-gradient(135deg,#764DF0,#5b21b6)',
                  boxShadow: voice.listening
                    ? '0 0 0 10px rgba(239,68,68,0.15), 0 14px 30px rgba(239,68,68,0.35)'
                    : '0 14px 30px rgba(118,77,240,0.35)',
                }}
              >
                {voice.listening && (
                  <span className="absolute inset-0 rounded-full animate-ping" style={{ background: 'rgba(239,68,68,0.35)' }} />
                )}
                {voice.listening
                  ? <MicOff className="h-9 w-9 text-white relative" />
                  : <Mic    className="h-9 w-9 text-white relative" />}
              </button>

              <div className="h-6 mt-3">
                {voice.listening ? (
                  <p className="flex items-center gap-2 text-[12px] font-semibold" style={{ color: '#fca5a5' }}>
                    <span className="inline-block h-2 w-2 rounded-full animate-pulse" style={{ background: '#ef4444' }} />
                    Recording — tap to stop
                  </p>
                ) : (
                  <p className="text-[12px] text-white/45">Tap to record</p>
                )}
              </div>
            </div>
          </>
        )}

        {/* Type mode */}
        {typingMode && (
          <textarea
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="Type your answer…"
            rows={7}
            className="w-full rounded-2xl p-4 outline-none resize-y mb-5"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.9)',
              minHeight: 160,
              fontSize: 16,
              lineHeight: 1.55,
            }}
          />
        )}

        {/* Submit bar */}
        <div className="flex items-center justify-between gap-3 flex-wrap pt-4 mt-2 border-t"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold tabular-nums text-white/40">
              {wordCount} {wordCount === 1 ? 'word' : 'words'}
            </span>
            {transcript.length > 0 && transcript.length < 5 && (
              <span className="text-[11px] text-white/35">At least 5 chars</span>
            )}
          </div>

          <button
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold disabled:opacity-35 transition-all"
            style={{
              background: currentAnswer
                ? 'linear-gradient(135deg,#34d399,#059669)'
                : 'linear-gradient(135deg,#764DF0,#5b21b6)',
              color: 'white',
              boxShadow: canSubmit
                ? currentAnswer
                  ? '0 8px 20px rgba(52,211,153,0.3)'
                  : '0 8px 20px rgba(118,77,240,0.35)'
                : 'none',
            }}
          >
            {scoring ? (
              <>
                <span className="lds-roller-sm"><span /><span /><span /><span /><span /><span /><span /><span /></span>
                Scoring…
              </>
            ) : currentAnswer ? (
              <><Check className="h-4 w-4" /> Re-submit</>
            ) : (
              <>Submit <Send className="h-4 w-4" /></>
            )}
          </button>
        </div>
      </div>

      {/* ─── FEEDBACK ─── */}
      {currentAnswer && (
        <div
          className="rounded-3xl p-5 sm:p-6 mt-4 sm:mt-5"
          style={{
            background: 'linear-gradient(180deg,rgba(118,77,240,0.10),rgba(118,77,240,0.04))',
            border: '1px solid rgba(118,77,240,0.24)',
          }}
        >
          <div className="flex items-center justify-between gap-3 mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/55">AI Score</span>
            <span
              className="font-black tabular-nums"
              style={{
                fontSize: 32,
                lineHeight: 1,
                color: scoreColor(currentAnswer.score),
              }}
            >
              {currentAnswer.score}
              <span className="text-sm text-white/30 ml-1">/100</span>
            </span>
          </div>
          <p className="text-[13px] sm:text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
            {currentAnswer.feedback}
          </p>
          {currentAnswer.missing_signals && currentAnswer.missing_signals.length > 0 && (
            <div className="mt-4 pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-2">
                Signals to add next time
              </p>
              <div className="flex flex-wrap gap-1.5">
                {currentAnswer.missing_signals.map((s, i) => (
                  <span
                    key={i}
                    className="text-[11px] px-2 py-0.5 rounded"
                    style={{
                      background: 'rgba(251,191,36,0.1)',
                      color: '#fbbf24',
                      border: '1px solid rgba(251,191,36,0.25)',
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── QUESTION CHIPS + FINISH/NEXT ─── */}
      <div className="flex items-center flex-wrap gap-2 mt-5">
        <div className="flex items-center flex-wrap gap-1.5">
          {questions.map((q, i) => {
            const done = !!answers[q.id];
            const active = i === currentIndex;
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => goToIndex(i)}
                aria-label={`Question ${i + 1}`}
                className="inline-flex h-8 min-w-[32px] items-center justify-center gap-1 rounded-lg px-2 text-[11px] font-bold transition-all"
                style={{
                  background: active
                    ? 'rgba(167,139,250,0.18)'
                    : done
                      ? 'rgba(52,211,153,0.14)'
                      : 'rgba(255,255,255,0.04)',
                  border: active
                    ? '1px solid rgba(167,139,250,0.5)'
                    : done
                      ? '1px solid rgba(52,211,153,0.35)'
                      : '1px solid rgba(255,255,255,0.08)',
                  color: active ? '#c4b5fd' : done ? '#34d399' : 'rgba(255,255,255,0.55)',
                  boxShadow: active ? '0 0 0 3px rgba(167,139,250,0.12)' : 'none',
                }}
              >
                {done && <Check className="h-3 w-3" />}
                <span>{i + 1}</span>
              </button>
            );
          })}
        </div>

        <div className="ml-auto">
          {isLast ? (
            <button
              type="button"
              onClick={onNext}
              disabled={!allDone || finalizing}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold disabled:opacity-40"
              style={{
                background: 'linear-gradient(135deg,#34d399,#059669)',
                color: 'white',
                boxShadow: allDone ? '0 8px 24px rgba(52,211,153,0.25)' : 'none',
              }}
            >
              {finalizing ? (
                <>
                  <span className="lds-roller-sm"><span /><span /><span /><span /><span /><span /><span /><span /></span>
                  Building report…
                </>
              ) : (
                <>Finish <Check className="h-4 w-4" /></>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={onNext}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold"
              style={{
                background: 'rgba(118,77,240,0.18)',
                border: '1px solid rgba(118,77,240,0.35)',
                color: '#c4b5fd',
              }}
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* ─── EXIT MODAL ─── */}
      {exitOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(8,11,35,0.78)', backdropFilter: 'blur(8px)' }}
          onClick={() => setExitOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl p-6"
            style={{
              background: '#12163a',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            }}
          >
            <h3 className="text-lg font-bold text-white mb-1">Exit this interview?</h3>
            <p className="text-sm text-white/55 mb-5">
              Your answers on this session will be discarded.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setExitOpen(false)}
                className="flex-1 rounded-xl py-2.5 text-sm font-bold"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.85)',
                }}
              >
                Keep going
              </button>
              <button
                type="button"
                onClick={() => { setExitOpen(false); onExit(); }}
                className="flex-1 rounded-xl py-2.5 text-sm font-bold"
                style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: 'white' }}
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Tiny local components ─── */

function IconBtn({
  children, onClick, disabled, danger, 'aria-label': ariaLabel,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  'aria-label': string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className="flex h-9 w-9 items-center justify-center rounded-lg transition-all disabled:opacity-30"
      style={{
        background: danger ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.04)',
        border: danger ? '1px solid rgba(239,68,68,0.25)' : '1px solid rgba(255,255,255,0.08)',
        color: danger ? '#fca5a5' : 'rgba(255,255,255,0.7)',
      }}
    >
      {children}
    </button>
  );
}

function TabBtn({
  active, onClick, children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all"
      style={{
        background: active ? 'rgba(118,77,240,0.22)' : 'transparent',
        color: active ? '#c4b5fd' : 'rgba(255,255,255,0.55)',
      }}
    >
      {children}
    </button>
  );
}

function Banner({
  children, color, icon,
}: {
  children: React.ReactNode;
  color: 'amber' | 'red';
  icon: React.ReactNode;
}) {
  const palette = color === 'amber'
    ? { bg: 'rgba(234,179,8,0.06)', border: 'rgba(234,179,8,0.2)', fg: 'rgba(251,191,36,0.9)' }
    : { bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.2)', fg: 'rgba(252,165,165,0.9)' };
  return (
    <div
      className="flex items-start gap-2 rounded-lg px-3 py-2 mb-4"
      style={{ background: palette.bg, border: `1px solid ${palette.border}` }}
    >
      <span className="shrink-0 mt-0.5" style={{ color: palette.fg }}>{icon}</span>
      <p className="text-[11px]" style={{ color: palette.fg }}>{children}</p>
    </div>
  );
}

function scoreColor(score: number): string {
  if (score >= 80) return '#34d399';
  if (score >= 60) return '#a78bfa';
  if (score >= 40) return '#fbbf24';
  return '#f87171';
}
