'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Mic, MicOff, ChevronRight, Volume2, VolumeX, Check, Keyboard, Sparkles, AlertTriangle } from 'lucide-react';
import { useInterviewStore } from '@/store/interviewStore';
import { useVoiceRecognition } from './useVoiceRecognition';
import { useSpeak } from './useSpeak';

const glass = {
  background: 'rgba(0,0,0,0.30)',
  backdropFilter: 'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)',
  border: '1px solid rgba(255,255,255,0.08)',
} as const;

export default function InterviewSession() {
  const { questions, currentIndex, answers, scoring, finalizing, submitAnswer, next, finish, goToIndex } =
    useInterviewStore();

  const voice = useVoiceRecognition();
  const speak = useSpeak();

  const [typingMode, setTypingMode] = useState(false);
  const [typed, setTyped] = useState('');
  const [mutedNarration, setMutedNarration] = useState(false);
  const [narrated, setNarrated] = useState<Record<string, boolean>>({});

  const currentQ = questions[currentIndex];
  const currentAnswer = currentQ ? answers[currentQ.id] : undefined;
  const isLastQuestion = currentIndex === questions.length - 1;
  const allAnswered = questions.length > 0 && questions.every((q) => answers[q.id]);

  // When question changes: reset voice state, reset typed box, play narration once
  const lastQuestionIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!currentQ) return;
    if (lastQuestionIdRef.current === currentQ.id) return;
    lastQuestionIdRef.current = currentQ.id;

    voice.stop();
    voice.reset();
    setTyped('');

    if (!mutedNarration && speak.supported && !narrated[currentQ.id]) {
      speak.speak(currentQ.text).finally(() => {
        setNarrated((prev) => ({ ...prev, [currentQ.id]: true }));
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQ?.id]);

  useEffect(() => () => { speak.cancel(); }, [speak]);

  const finalTranscript = useMemo(() => {
    if (typingMode) return typed.trim();
    return [voice.transcript, voice.interim].filter(Boolean).join(' ').trim();
  }, [typingMode, typed, voice.transcript, voice.interim]);

  const canSubmit = !!currentQ && finalTranscript.length >= 5 && !scoring;

  const handleToggleMic = () => {
    if (voice.listening) voice.stop();
    else voice.start();
  };

  const handleSubmit = async () => {
    if (!currentQ || !canSubmit) return;
    voice.stop();
    speak.cancel();
    const ok = await submitAnswer(currentQ.id, finalTranscript);
    if (!ok) return;
    setTyped('');
    voice.reset();
  };

  const handleNext = () => {
    if (isLastQuestion) {
      if (allAnswered) finish();
      return;
    }
    speak.cancel();
    next();
  };

  const replayQuestion = () => {
    if (!currentQ || mutedNarration || !speak.supported) return;
    speak.speak(currentQ.text);
  };

  if (!currentQ) return null;

  const kindBadge = {
    behavioral:  { label: 'Behavioral',  bg: 'rgba(96,165,250,0.15)',  color: '#60a5fa' },
    technical:   { label: 'Technical',   bg: 'rgba(52,211,153,0.15)',  color: '#34d399' },
    situational: { label: 'Situational', bg: 'rgba(251,191,36,0.15)',  color: '#fbbf24' },
  }[currentQ.kind];

  return (
    <div className="mx-auto max-w-3xl">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${((currentIndex + 1) / questions.length) * 100}%`,
              background: 'linear-gradient(90deg,#764DF0,#a78bfa)',
            }}
          />
        </div>
        <span className="text-[11px] font-bold text-white/50 shrink-0">
          {currentIndex + 1} / {questions.length}
        </span>
      </div>

      {/* Question card */}
      <div className="rounded-2xl p-5 sm:p-6" style={glass}>
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider"
            style={{ background: kindBadge.bg, color: kindBadge.color, border: `1px solid ${kindBadge.color}33` }}
          >
            {kindBadge.label}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/35">
            Question {currentIndex + 1}
          </span>

          {/* Replay / mute */}
          <div className="ml-auto flex items-center gap-1">
            {speak.supported && (
              <button
                type="button"
                onClick={() => { if (speak.speaking) speak.cancel(); else replayQuestion(); }}
                aria-label="Replay question"
                disabled={mutedNarration}
                className="flex h-8 w-8 items-center justify-center rounded-lg disabled:opacity-40"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}
              >
                <Volume2 className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setMutedNarration((v) => {
                  const next = !v;
                  if (next) speak.cancel();
                  return next;
                });
              }}
              aria-label="Toggle narration"
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{
                background: mutedNarration ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${mutedNarration ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.08)'}`,
                color: mutedNarration ? '#fca5a5' : 'rgba(255,255,255,0.7)',
              }}
            >
              {mutedNarration ? <VolumeX className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5 opacity-0" />}
              {mutedNarration ? null : <VolumeX className="h-3.5 w-3.5 hidden" />}
            </button>
          </div>
        </div>

        <p className="text-lg sm:text-xl font-semibold text-white leading-snug">{currentQ.text}</p>
      </div>

      {/* Mic / typing input */}
      <div className="rounded-2xl p-4 sm:p-5 mt-4" style={glass}>
        {!voice.supported && !typingMode && (
          <div className="flex items-start gap-2 rounded-lg px-3 py-2 mb-3"
            style={{ background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.2)' }}
          >
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: '#fbbf24' }} />
            <p className="text-[11px]" style={{ color: 'rgba(251,191,36,0.9)' }}>
              Your browser does not support speech recognition. Please type your answer instead.
            </p>
          </div>
        )}

        {voice.error && (
          <div className="flex items-start gap-2 rounded-lg px-3 py-2 mb-3"
            style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: '#fca5a5' }} />
            <p className="text-[11px]" style={{ color: 'rgba(252,165,165,0.9)' }}>{voice.error}</p>
          </div>
        )}

        {/* Mic button (hidden when typing mode) */}
        {!typingMode && voice.supported && (
          <div className="flex flex-col items-center py-4">
            <button
              type="button"
              onClick={handleToggleMic}
              aria-label={voice.listening ? 'Stop recording' : 'Start recording'}
              className="relative flex items-center justify-center rounded-full transition-all duration-200"
              style={{
                width: 96,
                height: 96,
                background: voice.listening
                  ? 'linear-gradient(135deg,#ef4444,#dc2626)'
                  : 'linear-gradient(135deg,#764DF0,#5b21b6)',
                boxShadow: voice.listening
                  ? '0 0 0 8px rgba(239,68,68,0.15), 0 10px 30px rgba(239,68,68,0.35)'
                  : '0 10px 30px rgba(118,77,240,0.35)',
                color: 'white',
              }}
            >
              {voice.listening && (
                <span className="absolute inset-0 rounded-full animate-ping" style={{ background: 'rgba(239,68,68,0.35)' }} />
              )}
              {voice.listening ? <MicOff className="h-9 w-9 relative" /> : <Mic className="h-9 w-9 relative" />}
            </button>
            <p className="text-[12px] font-semibold text-white/60 mt-3">
              {voice.listening ? 'Listening… tap to stop' : 'Tap to answer with your voice'}
            </p>
          </div>
        )}

        {/* Live transcript */}
        {!typingMode && (
          <div
            className="rounded-xl p-3 min-h-[84px] text-sm"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              color: voice.transcript || voice.interim ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)',
            }}
          >
            {voice.transcript || voice.interim ? (
              <>
                <span>{voice.transcript}</span>
                {voice.interim && <span className="opacity-50"> {voice.interim}</span>}
              </>
            ) : (
              <em>Your transcript will appear here as you speak.</em>
            )}
          </div>
        )}

        {/* Typing fallback */}
        {typingMode && (
          <textarea
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="Type your answer…"
            rows={5}
            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none resize-y"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.85)',
              minHeight: 120,
              fontSize: 16, // prevent iOS zoom
            }}
          />
        )}

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <button
            type="button"
            onClick={() => setTypingMode((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold"
            style={{
              background: typingMode ? 'rgba(118,77,240,0.18)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${typingMode ? 'rgba(118,77,240,0.35)' : 'rgba(255,255,255,0.08)'}`,
              color: typingMode ? '#c4b5fd' : 'rgba(255,255,255,0.65)',
            }}
          >
            <Keyboard className="h-3.5 w-3.5" />
            {typingMode ? 'Back to voice' : 'Type instead'}
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="ml-auto flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold disabled:opacity-40"
            style={{
              background: currentAnswer ? 'rgba(52,211,153,0.18)' : 'rgba(118,77,240,0.22)',
              border: `1px solid ${currentAnswer ? 'rgba(52,211,153,0.38)' : 'rgba(118,77,240,0.38)'}`,
              color: currentAnswer ? '#34d399' : '#c4b5fd',
            }}
          >
            {scoring ? (
              <>
                <span className="lds-roller-sm" style={{ color: '#c4b5fd' }}><span /><span /><span /><span /><span /><span /><span /><span /></span>
                Grading…
              </>
            ) : currentAnswer ? (
              <><Check className="h-3.5 w-3.5" /> Re-submit</>
            ) : (
              <><Sparkles className="h-3.5 w-3.5" /> Submit answer</>
            )}
          </button>
        </div>
      </div>

      {/* Per-answer feedback */}
      {currentAnswer && (
        <div className="rounded-2xl p-4 sm:p-5 mt-4"
          style={{ background: 'rgba(118,77,240,0.06)', border: '1px solid rgba(118,77,240,0.22)' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">AI Score</span>
            <span className="text-xl font-black tabular-nums" style={{ color: scoreColor(currentAnswer.score) }}>
              {currentAnswer.score}
              <span className="text-xs text-white/30">/100</span>
            </span>
          </div>
          <p className="text-[13px] text-white/75 leading-relaxed whitespace-pre-wrap">{currentAnswer.feedback}</p>
          {currentAnswer.missing_signals && currentAnswer.missing_signals.length > 0 && (
            <div className="mt-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Signals to add</p>
              <div className="flex flex-wrap gap-1.5">
                {currentAnswer.missing_signals.map((s, i) => (
                  <span key={i} className="text-[11px] px-2 py-0.5 rounded"
                    style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.25)' }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Question nav */}
      <div className="flex items-center gap-2 mt-5">
        {/* Dots */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {questions.map((q, i) => {
            const done = !!answers[q.id];
            const active = i === currentIndex;
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => goToIndex(i)}
                aria-label={`Go to question ${i + 1}`}
                className="rounded-full transition-all"
                style={{
                  width: active ? 22 : 10,
                  height: 10,
                  background: done ? '#34d399' : active ? '#a78bfa' : 'rgba(255,255,255,0.15)',
                }}
              />
            );
          })}
        </div>

        <div className="ml-auto">
          {isLastQuestion ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={!allAnswered || finalizing}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold disabled:opacity-40"
              style={{
                background: 'linear-gradient(135deg,#34d399,#059669)',
                color: 'white',
                boxShadow: allAnswered ? '0 8px 24px rgba(52,211,153,0.25)' : 'none',
              }}
            >
              {finalizing ? (
                <>
                  <span className="lds-roller-sm"><span /><span /><span /><span /><span /><span /><span /><span /></span>
                  Generating report…
                </>
              ) : (
                <>Finish <Check className="h-4 w-4" /></>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
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
    </div>
  );
}

function scoreColor(score: number): string {
  if (score >= 80) return '#34d399';
  if (score >= 60) return '#a78bfa';
  if (score >= 40) return '#fbbf24';
  return '#f87171';
}
