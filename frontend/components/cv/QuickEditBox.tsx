'use client';

import Image from 'next/image';
import { useState } from 'react';
import { refineCV } from '@/lib/api';
import toast from 'react-hot-toast';
import { Send } from 'lucide-react';

interface QuickEditBoxProps {
  cvRecordId: string | null;
  onRefine: (updatedFinalCV: any) => void;
}

const SUGGESTIONS = [
  'Add a 2-sentence summary',
  'Make bullets start with action verbs',
  'Add AWS and Docker to my skills',
  'Quantify my achievements',
];

export default function QuickEditBox({ cvRecordId, onRefine }: QuickEditBoxProps) {
  const [text, setText] = useState('');
  const [refining, setRefining] = useState(false);

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
      className="rounded-2xl overflow-hidden"
      style={{
        background:
          'linear-gradient(165deg, rgba(118,77,240,0.12) 0%, rgba(91,33,182,0.06) 55%, rgba(0,0,0,0.32) 100%)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        border: refining ? '1px solid rgba(118,77,240,0.45)' : '1px solid rgba(255,255,255,0.08)',
        transition: 'border-color 0.3s',
      }}
    >
      {/* hairline */}
      <div
        style={{
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(118,77,240,0.55), transparent)',
        }}
      />

      {/* Header row: robot avatar + title */}
      <div className="flex items-center gap-3 px-5 pt-4 pb-3">
        <div
          className="relative shrink-0"
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background:
              'radial-gradient(circle at 30% 30%, rgba(167,139,250,0.35), rgba(118,77,240,0.18) 60%, rgba(24,10,56,0.9) 100%)',
            border: '1px solid rgba(167,139,250,0.35)',
            boxShadow: refining
              ? '0 0 0 4px rgba(118,77,240,0.18), 0 0 22px rgba(118,77,240,0.45)'
              : '0 0 0 3px rgba(118,77,240,0.10)',
            overflow: 'hidden',
          }}
        >
          <Image
            src="/aivent/misc/robot-idle.png"
            alt=""
            fill
            sizes="44px"
            priority={false}
            style={{ objectFit: 'contain', objectPosition: 'center 60%', transform: 'scale(1.4)' }}
          />
          {/* live dot when working */}
          <span
            className="absolute"
            style={{
              right: 1,
              bottom: 1,
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: refining ? '#34d399' : '#64748b',
              border: '2px solid #0f0a28',
              transition: 'background 0.3s',
            }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-[13px] font-black" style={{ color: 'rgba(245,243,255,0.96)' }}>
              AI Editor
            </p>
            <span
              className="text-[9px] font-black px-1.5 py-0.5 rounded"
              style={{
                background: 'rgba(192,132,252,0.18)',
                color: '#e9d5ff',
                border: '1px solid rgba(192,132,252,0.35)',
              }}
            >
              PRO
            </span>
          </div>
          <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
            {refining ? 'Thinking…' : 'Tell me what to change in your CV.'}
          </p>
        </div>
      </div>

      {/* Thinking bar */}
      {refining && (
        <div
          className="h-[2px]"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(118,77,240,0.9) 50%, transparent 100%)',
            backgroundSize: '200% 100%',
            animation: 'quickedit-shimmer 1.3s linear infinite',
          }}
        />
      )}

      {/* Input */}
      <div className="px-5 pb-4 pt-1">
        <div className="flex gap-2 items-end">
          <textarea
            placeholder="e.g. Add a 2-sentence summary highlighting my Python experience…"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              e.currentTarget.style.height = 'auto';
              e.currentTarget.style.height = Math.min(e.currentTarget.scrollHeight, 160) + 'px';
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !refining) {
                e.preventDefault();
                handleRefine();
              }
            }}
            rows={2}
            disabled={refining}
            className="flex-1 rounded-xl px-4 py-3 text-sm outline-none resize-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.9)',
              minHeight: 52,
              maxHeight: 160,
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
            className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl transition-all disabled:opacity-60"
            style={{
              background: 'linear-gradient(135deg, #764DF0 0%, #5b21b6 100%)',
              border: '1px solid rgba(167,139,250,0.5)',
              color: '#f5f3ff',
              boxShadow: refining
                ? '0 0 0 3px rgba(118,77,240,0.22), 0 6px 16px rgba(118,77,240,0.35)'
                : '0 6px 16px rgba(118,77,240,0.3)',
              cursor: refining ? 'progress' : 'pointer',
            }}
            onMouseEnter={(e) => {
              if (!refining) {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 20px rgba(118,77,240,0.42)';
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 16px rgba(118,77,240,0.3)';
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

        {/* Suggestion chips — horizontal scroll so they never wrap awkwardly */}
        <div
          className="mt-2.5 flex gap-1.5 overflow-x-auto"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setText(s)}
              disabled={refining}
              className="shrink-0 text-[10.5px] px-2.5 py-1 rounded-md whitespace-nowrap transition-colors disabled:opacity-40"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.6)',
              }}
              onMouseEnter={(e) => {
                if (!refining) {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(118,77,240,0.18)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(118,77,240,0.35)';
                  (e.currentTarget as HTMLElement).style.color = '#ddd6fe';
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
                (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.6)';
              }}
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
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
