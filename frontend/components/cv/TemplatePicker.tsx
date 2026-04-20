'use client';

import { Check, Crown, Lock } from 'lucide-react';
import { TEMPLATES, type TemplateId } from './templates';

interface TemplatePickerProps {
  value: TemplateId;
  onChange: (id: TemplateId) => void;
  isPro?: boolean;
  onUpgrade?: () => void;
}

export default function TemplatePicker({ value, onChange, isPro = false, onUpgrade }: TemplatePickerProps) {
  const list = Object.values(TEMPLATES);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-2.5">
      {list.map((t) => {
        const isActive = value === t.id;
        const locked = t.proOnly && !isPro;

        return (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              if (locked) { onUpgrade?.(); return; }
              onChange(t.id);
            }}
            className="relative text-left rounded-lg p-2 sm:p-2.5 transition-all duration-150"
            style={{
              background: isActive ? 'rgba(118,77,240,0.14)' : 'rgba(255,255,255,0.025)',
              border: isActive ? '1px solid rgba(118,77,240,0.55)' : '1px solid rgba(255,255,255,0.06)',
              cursor: locked ? 'not-allowed' : 'pointer',
              opacity: locked ? 0.72 : 1,
              boxShadow: isActive ? '0 0 0 3px rgba(118,77,240,0.10)' : 'none',
            }}
          >
            <div className="relative">
              <TemplateThumbnail id={t.id} />
              {locked && (
                <div
                  className="absolute inset-0 flex items-center justify-center rounded-md"
                  style={{ background: 'rgba(15,10,40,0.55)', backdropFilter: 'blur(1px)' }}
                >
                  <Lock className="h-4 w-4 text-white/80" />
                </div>
              )}
              {isActive && (
                <span
                  className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full"
                  style={{ background: '#764df0' }}
                >
                  <Check className="h-2.5 w-2.5 text-white" />
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 mt-2 min-w-0">
              <p className="text-[11px] sm:text-[12px] font-semibold text-white truncate flex-1">{t.name}</p>
              {t.proOnly && !locked && (
                <Crown className="h-2.5 w-2.5 shrink-0" style={{ color: '#fbbf24' }} />
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[9px] font-bold" style={{ color: '#34d399' }}>ATS {t.atsScore}%</span>
              <span className="text-[9px] text-white/35 truncate">· {t.region}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* Compact SVG thumbnails — small, tight aspect for a horizontal strip */
export function TemplateThumbnail({ id }: { id: TemplateId }) {
  const common = 'w-full aspect-[4/5] rounded-md overflow-hidden';
  const paperStyle = { background: '#ffffff' };

  if (id === 'original') {
    return (
      <div
        className={common}
        style={{
          background: 'linear-gradient(160deg,#1a1440 0%,#2a1b68 100%)',
          border: '1px dashed rgba(196,181,253,0.4)',
        }}
      >
        <svg viewBox="0 0 60 80" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
          <rect x="14" y="14" width="32" height="52" rx="2" fill="#fff" opacity="0.92" />
          <rect x="18" y="20" width="24" height="2" fill="#0f172a" />
          <rect x="18" y="25" width="18" height="1" fill="#64748b" />
          <line x1="18" y1="29" x2="42" y2="29" stroke="#cbd5e1" strokeWidth="0.4" />
          <rect x="18" y="33" width="10" height="1.2" fill="#0f172a" />
          <rect x="18" y="36" width="24" height="0.8" fill="#94a3b8" />
          <rect x="18" y="38" width="20" height="0.8" fill="#94a3b8" />
          <rect x="18" y="43" width="10" height="1.2" fill="#0f172a" />
          <rect x="18" y="46" width="22" height="0.8" fill="#94a3b8" />
          <rect x="18" y="48" width="18" height="0.8" fill="#94a3b8" />
          <rect x="18" y="53" width="10" height="1.2" fill="#0f172a" />
          <rect x="18" y="56" width="20" height="0.8" fill="#94a3b8" />
          <g transform="translate(38, 56)">
            <circle r="6" fill="#764df0" />
            <path
              d="M-2.5 -0.2 L-0.6 1.8 L2.8 -1.8"
              stroke="#fff"
              strokeWidth="1.2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </svg>
      </div>
    );
  }

  if (id === 'harvard') {
    return (
      <div className={common} style={paperStyle}>
        <svg viewBox="0 0 60 80" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
          <rect x="12" y="8" width="36" height="3" rx="0.5" fill="#111" />
          <rect x="18" y="13" width="24" height="1.5" fill="#888" />
          <line x1="8" y1="18" x2="52" y2="18" stroke="#111" strokeWidth="0.5" />
          <rect x="8" y="22" width="18" height="1.5" fill="#111" />
          <rect x="8" y="25" width="44" height="1" fill="#aaa" />
          <rect x="8" y="27.5" width="40" height="1" fill="#aaa" />
          <rect x="8" y="33" width="18" height="1.5" fill="#111" />
          <rect x="8" y="36" width="30" height="1" fill="#888" />
          <rect x="10" y="38.5" width="34" height="1" fill="#aaa" />
          <rect x="10" y="40.5" width="30" height="1" fill="#aaa" />
          <rect x="8" y="48" width="18" height="1.5" fill="#111" />
          <rect x="8" y="51" width="38" height="1" fill="#aaa" />
          <rect x="8" y="58" width="18" height="1.5" fill="#111" />
          <rect x="8" y="61" width="36" height="1" fill="#aaa" />
        </svg>
      </div>
    );
  }

  if (id === 'modern') {
    return (
      <div className={common} style={paperStyle}>
        <svg viewBox="0 0 60 80" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
          <rect x="14" y="9" width="32" height="3" rx="0.5" fill="#0f172a" />
          <rect x="18" y="14" width="24" height="1.2" fill="#888" />
          <rect x="6" y="22" width="10" height="1.5" fill="#0f172a" />
          <line x1="6" y1="24" x2="54" y2="24" stroke="#0f172a" strokeWidth="0.6" />
          <rect x="6" y="27" width="40" height="1" fill="#aaa" />
          <rect x="6" y="29" width="36" height="1" fill="#aaa" />
          <rect x="6" y="35" width="14" height="1.5" fill="#0f172a" />
          <line x1="6" y1="37" x2="54" y2="37" stroke="#0f172a" strokeWidth="0.6" />
          <rect x="6" y="40" width="20" height="1.2" fill="#111" />
          <rect x="42" y="40" width="10" height="1.2" fill="#888" />
          <rect x="8" y="43" width="42" height="1" fill="#aaa" />
          <rect x="8" y="45" width="38" height="1" fill="#aaa" />
          <rect x="6" y="54" width="10" height="1.5" fill="#0f172a" />
          <line x1="6" y1="56" x2="54" y2="56" stroke="#0f172a" strokeWidth="0.6" />
          <rect x="6" y="59" width="44" height="1" fill="#aaa" />
          <rect x="6" y="61" width="40" height="1" fill="#aaa" />
        </svg>
      </div>
    );
  }

  if (id === 'minimalist') {
    return (
      <div className={common} style={paperStyle}>
        <svg viewBox="0 0 60 80" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
          <rect x="12" y="12" width="36" height="3.5" rx="0.2" fill="#111" />
          <rect x="18" y="17.5" width="24" height="1" fill="#888" />
          <line x1="8" y1="22" x2="52" y2="22" stroke="#ddd" strokeWidth="0.5" />
          <rect x="8" y="28" width="8" height="1.2" fill="#111" />
          <rect x="8" y="31" width="44" height="1" fill="#bbb" />
          <rect x="8" y="33" width="40" height="1" fill="#bbb" />
          <rect x="8" y="40" width="8" height="1.2" fill="#111" />
          <rect x="8" y="43" width="28" height="1" fill="#111" />
          <rect x="10" y="45.5" width="40" height="1" fill="#bbb" />
          <rect x="10" y="47.5" width="34" height="1" fill="#bbb" />
          <rect x="8" y="56" width="8" height="1.2" fill="#111" />
          <rect x="8" y="59" width="38" height="1" fill="#bbb" />
          <rect x="8" y="66" width="8" height="1.2" fill="#111" />
          <rect x="8" y="69" width="36" height="1" fill="#bbb" />
        </svg>
      </div>
    );
  }

  if (id === 'european') {
    return (
      <div className={common} style={paperStyle}>
        <svg viewBox="0 0 60 80" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
          <rect x="6" y="8" width="10" height="13" rx="1" fill="#e5e7eb" />
          <circle cx="11" cy="13" r="2" fill="#9ca3af" />
          <path d="M7 20 Q11 17 15 20" fill="#9ca3af" />
          <rect x="20" y="9" width="30" height="3" fill="#1e3a8a" />
          <rect x="20" y="14" width="24" height="1.2" fill="#666" />
          <line x1="6" y1="24" x2="54" y2="24" stroke="#1e3a8a" strokeWidth="0.6" />
          <rect x="6" y="29" width="14" height="1.3" fill="#1e3a8a" />
          <rect x="6" y="32" width="44" height="1" fill="#aaa" />
          <rect x="6" y="34" width="40" height="1" fill="#aaa" />
          <rect x="6" y="40" width="14" height="1.3" fill="#1e3a8a" />
          <rect x="6" y="43" width="28" height="1" fill="#111" />
          <rect x="8" y="45" width="40" height="1" fill="#aaa" />
          <rect x="8" y="47" width="36" height="1" fill="#aaa" />
          <rect x="6" y="54" width="14" height="1.3" fill="#1e3a8a" />
          <rect x="6" y="57" width="42" height="1" fill="#aaa" />
          <rect x="6" y="63" width="14" height="1.3" fill="#1e3a8a" />
          <rect x="6" y="66" width="38" height="1" fill="#aaa" />
        </svg>
      </div>
    );
  }

  if (id === 'tech') {
    return (
      <div className={common} style={paperStyle}>
        <svg viewBox="0 0 60 80" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
          <rect x="6" y="9" width="22" height="3" rx="0.3" fill="#0f172a" />
          <rect x="6" y="14" width="30" height="1" fill="#64748b" />
          <rect x="6" y="18" width="48" height="1.5" fill="#0ea5e9" />
          <rect x="6" y="24" width="12" height="1.3" fill="#0ea5e9" />
          <rect x="6" y="28" width="40" height="1" fill="#111" />
          <rect x="6" y="30" width="36" height="1" fill="#111" />
          <rect x="6" y="36" width="10" height="1.3" fill="#0ea5e9" />
          <rect x="6" y="39" width="28" height="1" fill="#aaa" />
          <rect x="6" y="43" width="14" height="1.2" fill="#111" />
          <rect x="42" y="43" width="10" height="1.2" fill="#888" />
          <rect x="8" y="46" width="42" height="1" fill="#aaa" />
          <rect x="8" y="48" width="38" height="1" fill="#aaa" />
          <rect x="6" y="56" width="10" height="1.3" fill="#0ea5e9" />
          <rect x="6" y="59" width="20" height="1" fill="#aaa" />
          <rect x="6" y="65" width="10" height="1.3" fill="#0ea5e9" />
          <rect x="6" y="68" width="36" height="1" fill="#aaa" />
        </svg>
      </div>
    );
  }

  if (id === 'compact') {
    return (
      <div className={common} style={paperStyle}>
        <svg viewBox="0 0 60 80" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
          <rect x="6" y="8" width="20" height="2.5" fill="#111" />
          <rect x="6" y="12" width="34" height="1" fill="#555" />
          <line x1="6" y1="15" x2="54" y2="15" stroke="#333" strokeWidth="0.5" />
          <rect x="6" y="18" width="8" height="1" fill="#111" />
          <rect x="6" y="20" width="46" height="0.8" fill="#bbb" />
          <rect x="6" y="22" width="40" height="0.8" fill="#bbb" />
          <rect x="6" y="25" width="10" height="1" fill="#111" />
          <rect x="6" y="27" width="30" height="0.8" fill="#555" />
          <rect x="42" y="27" width="10" height="0.8" fill="#888" />
          <rect x="8" y="29" width="42" height="0.8" fill="#bbb" />
          <rect x="8" y="31" width="38" height="0.8" fill="#bbb" />
          <rect x="6" y="34" width="30" height="0.8" fill="#555" />
          <rect x="42" y="34" width="10" height="0.8" fill="#888" />
          <rect x="8" y="36" width="42" height="0.8" fill="#bbb" />
          <rect x="8" y="38" width="38" height="0.8" fill="#bbb" />
          <rect x="6" y="42" width="10" height="1" fill="#111" />
          <rect x="6" y="44" width="44" height="0.8" fill="#bbb" />
          <rect x="6" y="47" width="10" height="1" fill="#111" />
          <rect x="6" y="49" width="40" height="0.8" fill="#bbb" />
          <rect x="6" y="52" width="10" height="1" fill="#111" />
          <rect x="6" y="54" width="38" height="0.8" fill="#bbb" />
        </svg>
      </div>
    );
  }

  if (id === 'executive') {
    return (
      <div className={common} style={paperStyle}>
        <svg viewBox="0 0 60 80" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
          <rect x="14" y="9" width="32" height="3" rx="0.3" fill="#1f2937" />
          <rect x="18" y="14" width="24" height="1" fill="#666" />
          <line x1="22" y1="19" x2="38" y2="19" stroke="#7c2d12" strokeWidth="0.6" />
          <rect x="8" y="24" width="44" height="10" fill="#fafaf9" />
          <rect x="8" y="24" width="1.5" height="10" fill="#7c2d12" />
          <rect x="12" y="27" width="36" height="1" fill="#374151" />
          <rect x="12" y="29" width="32" height="1" fill="#374151" />
          <rect x="12" y="31" width="30" height="1" fill="#374151" />
          <rect x="22" y="38" width="16" height="1.2" fill="#7c2d12" />
          <rect x="8" y="42" width="20" height="1.2" fill="#111" />
          <rect x="8" y="44.5" width="28" height="1" fill="#666" />
          <rect x="10" y="47" width="40" height="1" fill="#aaa" />
          <rect x="10" y="49" width="36" height="1" fill="#aaa" />
          <rect x="22" y="56" width="16" height="1.2" fill="#7c2d12" />
          <rect x="8" y="60" width="42" height="1" fill="#aaa" />
          <rect x="22" y="66" width="16" height="1.2" fill="#7c2d12" />
          <rect x="8" y="69" width="38" height="1" fill="#aaa" />
        </svg>
      </div>
    );
  }

  if (id === 'academic') {
    return (
      <div className={common} style={paperStyle}>
        <svg viewBox="0 0 60 80" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
          <rect x="14" y="9" width="32" height="3" rx="0.3" fill="#111" />
          <rect x="16" y="14" width="28" height="1" fill="#555" />
          <line x1="6" y1="18" x2="54" y2="18" stroke="#000" strokeWidth="0.5" />
          <rect x="6" y="22" width="14" height="1.3" fill="#111" />
          <rect x="6" y="25" width="28" height="1" fill="#111" />
          <rect x="46" y="25" width="6" height="1" fill="#555" />
          <rect x="6" y="27" width="22" height="0.9" fill="#666" />
          <rect x="6" y="33" width="18" height="1.3" fill="#111" />
          <rect x="6" y="36" width="44" height="1" fill="#aaa" />
          <rect x="6" y="38" width="38" height="1" fill="#aaa" />
          <rect x="6" y="44" width="22" height="1.3" fill="#111" />
          <rect x="6" y="47" width="22" height="1" fill="#111" />
          <rect x="44" y="47" width="8" height="1" fill="#555" />
          <rect x="8" y="49" width="40" height="1" fill="#aaa" />
          <rect x="8" y="51" width="36" height="1" fill="#aaa" />
          <rect x="6" y="57" width="22" height="1.3" fill="#111" />
          <rect x="6" y="60" width="42" height="1" fill="#aaa" />
          <rect x="6" y="62" width="38" height="1" fill="#aaa" />
          <rect x="6" y="64" width="40" height="1" fill="#aaa" />
          <rect x="6" y="70" width="18" height="1.3" fill="#111" />
          <rect x="6" y="73" width="44" height="1" fill="#aaa" />
        </svg>
      </div>
    );
  }

  if (id === 'consulting') {
    return (
      <div className={common} style={paperStyle}>
        <svg viewBox="0 0 60 80" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
          <rect x="6" y="9" width="22" height="3" rx="0.3" fill="#0c2340" />
          <rect x="6" y="14" width="30" height="1" fill="#475569" />
          <rect x="6" y="18" width="48" height="3" fill="#0c2340" />
          <rect x="6" y="26" width="14" height="1.3" fill="#0c2340" />
          <rect x="6" y="29" width="44" height="1" fill="#444" />
          <rect x="6" y="31" width="38" height="1" fill="#444" />
          <rect x="6" y="37" width="18" height="1.3" fill="#0c2340" />
          <rect x="6" y="40" width="24" height="1" fill="#111" />
          <rect x="42" y="40" width="10" height="1" fill="#444" />
          <rect x="8" y="43" width="6" height="1" fill="#0c2340" />
          <rect x="15" y="43" width="30" height="1" fill="#aaa" />
          <rect x="8" y="45" width="4" height="1" fill="#0c2340" />
          <rect x="13" y="45" width="32" height="1" fill="#aaa" />
          <rect x="8" y="47" width="8" height="1" fill="#0c2340" />
          <rect x="17" y="47" width="28" height="1" fill="#aaa" />
          <rect x="6" y="54" width="14" height="1.3" fill="#0c2340" />
          <rect x="6" y="57" width="40" height="1" fill="#aaa" />
          <rect x="6" y="63" width="14" height="1.3" fill="#0c2340" />
          <rect x="6" y="66" width="36" height="1" fill="#aaa" />
        </svg>
      </div>
    );
  }

  if (id === 'swiss') {
    return (
      <div className={common} style={paperStyle}>
        <svg viewBox="0 0 60 80" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
          <rect x="6" y="10" width="30" height="4" rx="0.3" fill="#111" />
          <rect x="6" y="16" width="34" height="0.8" fill="#888" />
          <rect x="6" y="22" width="6" height="1.6" fill="#111" />
          <rect x="6" y="28" width="14" height="1" fill="#111" />
          <rect x="6" y="31" width="42" height="1" fill="#aaa" />
          <rect x="6" y="33" width="36" height="1" fill="#aaa" />
          <rect x="6" y="40" width="16" height="1" fill="#111" />
          <rect x="6" y="44" width="10" height="0.9" fill="#64748b" />
          <rect x="20" y="44" width="20" height="1" fill="#111" />
          <rect x="20" y="46" width="24" height="0.9" fill="#666" />
          <rect x="22" y="48" width="30" height="0.9" fill="#aaa" />
          <rect x="22" y="50" width="28" height="0.9" fill="#aaa" />
          <rect x="6" y="54" width="10" height="0.9" fill="#64748b" />
          <rect x="20" y="54" width="18" height="1" fill="#111" />
          <rect x="20" y="56" width="22" height="0.9" fill="#666" />
          <rect x="22" y="58" width="28" height="0.9" fill="#aaa" />
          <rect x="6" y="64" width="16" height="1" fill="#111" />
          <rect x="6" y="68" width="10" height="0.9" fill="#64748b" />
          <rect x="20" y="68" width="24" height="0.9" fill="#aaa" />
        </svg>
      </div>
    );
  }

  // Fallback — generic single-column look
  return (
    <div className={common} style={paperStyle}>
      <svg viewBox="0 0 60 80" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
        <rect x="12" y="10" width="36" height="3" fill="#111" />
        <rect x="18" y="15" width="24" height="1" fill="#888" />
        <line x1="8" y1="20" x2="52" y2="20" stroke="#666" strokeWidth="0.5" />
        <rect x="8" y="26" width="14" height="1.3" fill="#111" />
        <rect x="8" y="29" width="40" height="1" fill="#aaa" />
        <rect x="8" y="31" width="36" height="1" fill="#aaa" />
        <rect x="8" y="38" width="14" height="1.3" fill="#111" />
        <rect x="8" y="41" width="40" height="1" fill="#aaa" />
        <rect x="8" y="43" width="36" height="1" fill="#aaa" />
      </svg>
    </div>
  );
}
