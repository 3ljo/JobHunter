'use client';

import Image from 'next/image';
import { useState } from 'react';
import { refineCV } from '@/lib/api';
import toast from 'react-hot-toast';
import { Send, Sparkles } from 'lucide-react';

interface QuickEditBoxProps {
  cvRecordId: string | null;
  onRefine: (updatedFinalCV: any) => void;
}

const SUGGESTIONS = [
  'Add a strong 2-sentence summary',
  'Make all bullets start with action verbs',
  'Add AWS and Docker to my skills',
  'Quantify my achievements with numbers',
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
      className="rounded-2xl overflow-hidden relative"
      style={{
        background:
          'radial-gradient(140% 100% at 100% 0%, rgba(118,77,240,0.18) 0%, rgba(118,77,240,0.04) 42%, rgba(0,0,0,0.28) 100%)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        border: refining ? '1px solid rgba(118,77,240,0.45)' : '1px solid rgba(255,255,255,0.08)',
        transition: 'border-color 0.3s',
      }}
    >
      {/* decorative top hairline */}
      <div
        style={{
          height: '1px',
          background:
            'linear-gradient(90deg, transparent, rgba(118,77,240,0.55), transparent)',
        }}
      />

      {/* AI Working Banner */}
      {refining && (
        <div
          className="flex items-center gap-3 px-5 py-3"
          style={{
            background: 'linear-gradient(90deg, rgba(118,77,240,0.18), rgba(118,77,240,0.06))',
            borderBottom: '1px solid rgba(118,77,240,0.22)',
          }}
        >
          <div className="relative flex items-center justify-center h-5 w-5">
            <div className="absolute inset-0 rounded-full animate-ping" style={{ background: 'rgba(118,77,240,0.35)' }} />
            <Sparkles className="h-3.5 w-3.5 relative" style={{ color: '#a78bfa' }} />
          </div>
          <div>
            <p className="text-xs font-bold" style={{ color: '#c4b5fd' }}>AI is editing your CV…</p>
            <p className="text-[10px]" style={{ color: 'rgba(199,183,255,0.55)' }}>This may take a few seconds</p>
          </div>
          <div className="ml-auto flex gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      )}

      <div className="relative p-5 pr-28 sm:pr-32">
        {/* Robot — decorative, absolute-positioned right, clipped at the bottom */}
        <div
          className="hidden sm:block pointer-events-none select-none"
          style={{
            position: 'absolute',
            right: -6,
            bottom: -12,
            width: 112,
            height: 140,
            opacity: refining ? 1 : 0.92,
            filter: refining
              ? 'drop-shadow(0 0 20px rgba(118,77,240,0.55))'
              : 'drop-shadow(0 6px 14px rgba(0,0,0,0.45))',
            transition: 'all 0.3s',
          }}
        >
          <Image
            src="/aivent/misc/robot-idle.png"
            alt=""
            fill
            sizes="112px"
            priority={false}
            style={{ objectFit: 'contain', objectPosition: 'bottom right' }}
          />
          {/* glow ring when refining */}
          {refining && (
            <span
              className="absolute rounded-full animate-ping"
              style={{
                left: '50%',
                top: '30%',
                width: 70,
                height: 70,
                transform: 'translate(-50%, -50%)',
                background: 'rgba(118,77,240,0.28)',
              }}
            />
          )}
        </div>

        {/* small sm:hidden version above the textarea so the robot isn't lost on mobile */}
        <div className="sm:hidden flex items-center gap-2 mb-2">
          <div
            className="relative shrink-0"
            style={{ width: 40, height: 48 }}
          >
            <Image
              src="/aivent/misc/robot-idle.png"
              alt=""
              fill
              sizes="40px"
              style={{ objectFit: 'contain', objectPosition: 'bottom' }}
            />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest" style={{ color: 'rgba(221,214,254,0.95)' }}>
              Quick Edit
            </p>
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Tell the AI what to change
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 mb-2">
          <Sparkles className="h-3.5 w-3.5" style={{ color: '#c4b5fd' }} />
          <p className="text-xs font-black uppercase tracking-widest" style={{ color: 'rgba(221,214,254,0.95)' }}>
            Quick Edit
          </p>
          <span
            className="text-[9px] font-black px-1.5 py-0.5 rounded"
            style={{
              background: 'rgba(192,132,252,0.18)',
              color: '#e9d5ff',
              border: '1px solid rgba(192,132,252,0.35)',
            }}
          >
            AI
          </span>
        </div>

        <p className="hidden sm:block text-[12px] leading-relaxed mb-3" style={{ color: 'rgba(255,255,255,0.55)' }}>
          Type what you want changed — add a summary, rewrite a bullet, inject keywords, change tone.
        </p>

        <div className="flex gap-2 items-end">
          <textarea
            placeholder="e.g. Add a 2-sentence summary that highlights my Python experience…"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              e.currentTarget.style.height = 'auto';
              e.currentTarget.style.height = Math.min(e.currentTarget.scrollHeight, 180) + 'px';
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
              color: 'rgba(255,255,255,0.85)',
              minHeight: '56px',
              maxHeight: '180px',
              overflowY: 'auto',
              opacity: refining ? 0.5 : 1,
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
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-all disabled:opacity-40"
            style={{
              background: 'linear-gradient(135deg, rgba(118,77,240,0.35), rgba(91,33,182,0.4))',
              border: '1px solid rgba(118,77,240,0.55)',
              color: '#f5f3ff',
              boxShadow: '0 6px 16px rgba(118,77,240,0.25)',
              cursor: refining ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={(e) => {
              if (!refining) {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 20px rgba(118,77,240,0.35)';
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 16px rgba(118,77,240,0.25)';
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

        {/* Suggestion chips — give the user a one-tap nudge */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setText(s)}
              disabled={refining}
              className="text-[10.5px] px-2 py-1 rounded-md transition-colors disabled:opacity-40"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.55)',
              }}
              onMouseEnter={(e) => {
                if (!refining) {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(118,77,240,0.15)';
                  (e.currentTarget as HTMLElement).style.color = '#ddd6fe';
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.55)';
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
