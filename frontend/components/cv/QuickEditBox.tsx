'use client';

import { useEffect, useState } from 'react';
import { refineCV } from '@/lib/api';
import toast from 'react-hot-toast';
import { Send } from 'lucide-react';

interface QuickEditBoxProps {
  cvRecordId: string | null;
  onRefine: (updatedFinalCV: any) => void;
  /**
   * Imperative prefill — bump `key` to push a new prompt into the textarea.
   * Used by CreateCVSuggestions on the create-cv page so "Ask AI to fix"
   * tips can land directly in the input. The wrapping object is a sentinel
   * so the same prompt fired twice still re-prefills.
   */
  prefill?: { text: string; key: number } | null;
}

const SUGGESTIONS = [
  'Add a 2-sentence summary',
  'Start bullets with action verbs',
  'Add AWS and Docker to skills',
  'Quantify achievements with numbers',
  'Add relevant certifications',
  'Make tone sound more senior',
];

export default function QuickEditBox({ cvRecordId, onRefine, prefill }: QuickEditBoxProps) {
  const [text, setText] = useState('');
  const [refining, setRefining] = useState(false);

  // Push external prefills into the input. Watching the bumpable key — not
  // the text — means the same prompt twice still triggers a re-fill.
  useEffect(() => {
    if (prefill && prefill.text) setText(prefill.text);
  }, [prefill?.key]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefine = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      toast.error('Type what you want to change first');
      return;
    }
    if (!cvRecordId) {
      toast.error('CV record not ready — try re-running the analysis');
      return;
    }
    setRefining(true);
    try {
      const res = await refineCV(cvRecordId, trimmed);
      onRefine(res.data.final_cv);
      toast.success('CV updated');
      setText('');
    } catch {
      toast.error('Failed to apply changes');
    } finally {
      setRefining(false);
    }
  };

  return (
    <div
      className="rounded-2xl overflow-hidden relative"
      style={{
        background:
          'linear-gradient(165deg, rgba(118,77,240,0.14) 0%, rgba(91,33,182,0.05) 55%, rgba(0,0,0,0.32) 100%)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        border: refining ? '1px solid rgba(118,77,240,0.5)' : '1px solid rgba(255,255,255,0.08)',
        transition: 'border-color 0.3s',
      }}
    >
      {/* top hairline */}
      <div
        style={{
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(118,77,240,0.6), transparent)',
        }}
      />

      {/* thinking shimmer bar when AI is working */}
      {refining && (
        <div
          className="h-[2px]"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(167,139,250,0.95) 50%, transparent 100%)',
            backgroundSize: '200% 100%',
            animation: 'quickedit-shimmer 1.3s linear infinite',
          }}
        />
      )}

      <div className="px-4 sm:px-5 pt-4 pb-4">
        {/* HEADER — compact row: title, pro badge, thinking indicator */}
        <div className="flex items-center gap-2 mb-3">
          <p className="text-[13px] sm:text-[14px] font-black leading-none" style={{ color: '#f5f3ff' }}>
            AI Editor
          </p>
          <span
            className="text-[9px] font-black px-1.5 py-[2px] rounded leading-none"
            style={{
              background: 'rgba(192,132,252,0.18)',
              color: '#e9d5ff',
              border: '1px solid rgba(192,132,252,0.35)',
            }}
          >
            PRO
          </span>
          {refining && (
            <span className="flex items-center gap-1 text-[10px] font-bold ml-auto" style={{ color: '#a78bfa' }}>
              <span
                className="inline-block rounded-full"
                style={{
                  width: 5,
                  height: 5,
                  background: '#34d399',
                  boxShadow: '0 0 6px rgba(52,211,153,0.75)',
                }}
              />
              thinking…
            </span>
          )}
        </div>

        {/* INPUT row */}
        <div className="mt-3 flex gap-2 items-stretch">
          <textarea
            placeholder="e.g. Add 5 years of experience"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              e.currentTarget.style.height = 'auto';
              e.currentTarget.style.height = Math.min(e.currentTarget.scrollHeight, 140) + 'px';
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !refining) {
                e.preventDefault();
                handleRefine();
              }
            }}
            rows={1}
            disabled={refining}
            className="flex-1 rounded-xl px-4 py-2.5 text-[13px] outline-none resize-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.92)',
              minHeight: 44,
              maxHeight: 140,
              overflowY: 'auto',
              opacity: refining ? 0.55 : 1,
              lineHeight: 1.5,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'rgba(118,77,240,0.55)';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(118,77,240,0.12)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
          <button
            type="button"
            onClick={handleRefine}
            disabled={refining}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all disabled:opacity-60"
            style={{
              background: 'linear-gradient(135deg, #764DF0 0%, #5b21b6 100%)',
              border: '1px solid rgba(167,139,250,0.5)',
              color: '#f5f3ff',
              boxShadow: '0 4px 12px rgba(118,77,240,0.3)',
              cursor: refining ? 'progress' : 'pointer',
              alignSelf: 'flex-end',
            }}
            onMouseEnter={(e) => {
              if (!refining) {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 18px rgba(118,77,240,0.45)';
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(118,77,240,0.3)';
            }}
            aria-label="Apply edit"
          >
            {refining ? (
              <span className="lds-roller-sm" style={{ color: '#f5f3ff' }}>
                <span /><span /><span /><span /><span /><span /><span /><span />
              </span>
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* SUGGESTION CHIPS — 2 rows × 3 cols grid so nothing wraps weird */}
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setText(s)}
              disabled={refining}
              className="text-[10.5px] px-2 py-1.5 rounded-md transition-all disabled:opacity-40 text-left truncate"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.65)',
              }}
              onMouseEnter={(e) => {
                if (!refining) {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(118,77,240,0.18)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(118,77,240,0.38)';
                  (e.currentTarget as HTMLElement).style.color = '#ddd6fe';
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
                (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.65)';
              }}
              title={s}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes quickedit-shimmer {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }
      `}</style>
    </div>
  );
}
