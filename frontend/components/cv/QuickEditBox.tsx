'use client';

import { useState } from 'react';
import { refineCV } from '@/lib/api';
import toast from 'react-hot-toast';
import { Send, Sparkles } from 'lucide-react';

interface QuickEditBoxProps {
  cvRecordId: string | null;
  onRefine: (updatedFinalCV: any) => void;
}

export default function QuickEditBox({ cvRecordId, onRefine }: QuickEditBoxProps) {
  const [text, setText] = useState('');
  const [refining, setRefining] = useState(false);

  const handleRefine = async () => {
    if (!text.trim() || !cvRecordId) return;
    setRefining(true);
    try {
      const res = await refineCV(cvRecordId, text.trim());
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
        background: 'rgba(0,0,0,0.28)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        border: refining ? '1px solid rgba(118,77,240,0.35)' : '1px solid rgba(255,255,255,0.07)',
        transition: 'border-color 0.3s',
      }}
    >
      {/* AI Working Banner */}
      {refining && (
        <div
          className="flex items-center gap-3 px-5 py-3"
          style={{
            background: 'linear-gradient(90deg, rgba(118,77,240,0.12), rgba(118,77,240,0.06))',
            borderBottom: '1px solid rgba(118,77,240,0.15)',
          }}
        >
          <div className="relative flex items-center justify-center h-5 w-5">
            <div className="absolute inset-0 rounded-full animate-ping" style={{ background: 'rgba(118,77,240,0.3)' }} />
            <Sparkles className="h-3.5 w-3.5 relative" style={{ color: '#a78bfa' }} />
          </div>
          <div>
            <p className="text-xs font-bold" style={{ color: '#c4b5fd' }}>AI is editing your CV...</p>
            <p className="text-[10px]" style={{ color: 'rgba(199,183,255,0.5)' }}>This may take a few seconds</p>
          </div>
          <div className="ml-auto flex gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      )}

      <div className="p-5">
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Quick Edit
        </p>
        <div className="flex gap-2">
          <textarea
            placeholder="Tell AI what to change..."
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              e.currentTarget.style.height = 'auto';
              e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
            }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !refining) { e.preventDefault(); handleRefine(); } }}
            rows={1}
            disabled={refining}
            className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none resize-none overflow-hidden transition-all"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.8)',
              minHeight: '40px',
              opacity: refining ? 0.5 : 1,
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'rgba(118,77,240,0.45)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
          />
          <button
            onClick={handleRefine}
            disabled={refining || !text.trim() || !cvRecordId}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all disabled:opacity-30"
            style={{
              background: 'rgba(118,77,240,0.22)',
              border: '1px solid rgba(118,77,240,0.38)',
              color: '#c4b5fd',
            }}
            onMouseEnter={e => { if (!refining) (e.currentTarget as HTMLElement).style.background = 'rgba(118,77,240,0.35)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(118,77,240,0.22)'; }}
          >
            {refining
              ? <span className="lds-roller-sm" style={{ color: '#c4b5fd' }}><span /><span /><span /><span /><span /><span /><span /><span /></span>
              : <Send className="h-3.5 w-3.5" />
            }
          </button>
        </div>
      </div>
    </div>
  );
}
