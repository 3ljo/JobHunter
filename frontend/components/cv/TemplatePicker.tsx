'use client';

import { Check, Crown, Lock } from 'lucide-react';
import { TEMPLATES, type TemplateId } from './templates';

interface TemplatePickerProps {
  value: TemplateId;
  onChange: (id: TemplateId) => void;
  isPro?: boolean;
  onUpgrade?: () => void;
  /** Template ids to hide from the grid — e.g. ['original'] in flows with no uploaded PDF. */
  exclude?: TemplateId[];
}

export default function TemplatePicker({ value, onChange, isPro = false, onUpgrade, exclude }: TemplatePickerProps) {
  const excluded = new Set(exclude || []);
  const list = Object.values(TEMPLATES).filter((t) => !excluded.has(t.id));

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

  if (id === 'sidebar') {
    return (
      <div className={common} style={paperStyle}>
        <svg viewBox="0 0 60 80" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
          {/* Navy sidebar */}
          <rect x="0" y="0" width="22" height="80" fill="#0f1f3d" />
          <circle cx="11" cy="14" r="5" fill="#fff" opacity="0.9" />
          <rect x="3" y="22" width="16" height="1.6" fill="#fff" opacity="0.95" />
          <rect x="3" y="25" width="10" height="1" fill="#d97706" />
          <rect x="3" y="32" width="10" height="0.9" fill="#d97706" />
          <rect x="3" y="35" width="14" height="0.8" fill="#fff" opacity="0.7" />
          <rect x="3" y="37" width="12" height="0.8" fill="#fff" opacity="0.7" />
          <rect x="3" y="42" width="10" height="0.9" fill="#d97706" />
          <rect x="3" y="45" width="14" height="0.8" fill="#fff" opacity="0.7" />
          <rect x="3" y="47" width="13" height="0.8" fill="#fff" opacity="0.7" />
          {/* Right column */}
          <rect x="26" y="10" width="12" height="1.4" fill="#0f1f3d" />
          <line x1="26" y1="14" x2="56" y2="14" stroke="#0f1f3d" strokeWidth="0.6" />
          <rect x="26" y="18" width="22" height="1" fill="#666" />
          <rect x="26" y="20" width="20" height="1" fill="#666" />
          <rect x="26" y="27" width="14" height="1.4" fill="#0f1f3d" />
          <rect x="48" y="27" width="6" height="1" fill="#d97706" />
          <rect x="26" y="30" width="18" height="0.9" fill="#aaa" />
          <rect x="28" y="33" width="26" height="0.9" fill="#aaa" />
          <rect x="28" y="35" width="22" height="0.9" fill="#aaa" />
          <rect x="26" y="42" width="14" height="1.4" fill="#0f1f3d" />
          <rect x="26" y="45" width="26" height="0.9" fill="#aaa" />
          <rect x="26" y="47" width="22" height="0.9" fill="#aaa" />
          <rect x="26" y="55" width="14" height="1.4" fill="#0f1f3d" />
          <rect x="26" y="58" width="22" height="0.9" fill="#aaa" />
          <rect x="26" y="60" width="20" height="0.9" fill="#aaa" />
        </svg>
      </div>
    );
  }

  if (id === 'creative') {
    return (
      <div className={common} style={paperStyle}>
        <svg viewBox="0 0 60 80" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
          <defs>
            <linearGradient id="cv-creative" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="60" height="22" fill="url(#cv-creative)" />
          <circle cx="11" cy="11" r="5" fill="#fff" opacity="0.95" />
          <rect x="20" y="7" width="32" height="3" fill="#fff" />
          <rect x="20" y="13" width="26" height="1.2" fill="#fff" opacity="0.85" />
          <line x1="6" y1="28" x2="14" y2="28" stroke="#7c3aed" strokeWidth="1.5" />
          <rect x="16" y="27" width="14" height="1.4" fill="#1f2937" />
          <rect x="6" y="32" width="44" height="1" fill="#888" />
          <rect x="6" y="34" width="38" height="1" fill="#888" />
          <line x1="6" y1="42" x2="14" y2="42" stroke="#ec4899" strokeWidth="1.5" />
          <rect x="16" y="41" width="14" height="1.4" fill="#1f2937" />
          <rect x="8" y="46" width="22" height="1" fill="#111" />
          <rect x="42" y="46" width="10" height="1" fill="#7c3aed" />
          <rect x="8" y="48" width="40" height="0.9" fill="#aaa" />
          <rect x="8" y="50" width="36" height="0.9" fill="#aaa" />
          <line x1="6" y1="58" x2="14" y2="58" stroke="#7c3aed" strokeWidth="1.5" />
          <rect x="16" y="57" width="14" height="1.4" fill="#1f2937" />
          <rect x="6" y="62" width="9" height="2" rx="1" fill="#7c3aed" opacity="0.18" />
          <rect x="17" y="62" width="11" height="2" rx="1" fill="#ec4899" opacity="0.18" />
          <rect x="30" y="62" width="8" height="2" rx="1" fill="#7c3aed" opacity="0.18" />
          <rect x="40" y="62" width="10" height="2" rx="1" fill="#ec4899" opacity="0.18" />
        </svg>
      </div>
    );
  }

  if (id === 'darktech') {
    return (
      <div className={common} style={paperStyle}>
        <svg viewBox="0 0 60 80" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
          {/* Dark sidebar */}
          <rect x="0" y="0" width="22" height="80" fill="#0b1220" />
          <rect x="4" y="6" width="14" height="11" rx="1.5" fill="#22d3ee" opacity="0.18" />
          <rect x="4" y="6" width="14" height="11" rx="1.5" fill="none" stroke="#22d3ee" strokeWidth="0.4" />
          <rect x="3" y="20" width="16" height="1.5" fill="#fff" />
          <rect x="3" y="23" width="6" height="0.7" fill="#22d3ee" />
          <rect x="3" y="29" width="8" height="0.8" fill="#22d3ee" />
          <rect x="3" y="32" width="6" height="1.3" rx="0.4" fill="#22d3ee" opacity="0.20" />
          <rect x="10" y="32" width="9" height="1.3" rx="0.4" fill="#22d3ee" opacity="0.20" />
          <rect x="3" y="34.5" width="7" height="1.3" rx="0.4" fill="#22d3ee" opacity="0.20" />
          <rect x="11" y="34.5" width="8" height="1.3" rx="0.4" fill="#22d3ee" opacity="0.20" />
          <rect x="3" y="42" width="8" height="0.8" fill="#22d3ee" />
          <rect x="3" y="45" width="14" height="0.8" fill="#fff" opacity="0.7" />
          <rect x="3" y="47" width="12" height="0.8" fill="#fff" opacity="0.7" />
          {/* Right (light) column */}
          <rect x="22" y="0" width="38" height="80" fill="#fafafa" />
          <rect x="26" y="9" width="16" height="1.4" fill="#0b1220" />
          <rect x="26" y="14" width="28" height="6" rx="1" fill="#fff" stroke="#e5e7eb" strokeWidth="0.4" />
          <rect x="28" y="16" width="20" height="0.8" fill="#888" />
          <rect x="28" y="17.5" width="18" height="0.8" fill="#888" />
          <rect x="26" y="23" width="14" height="1.4" fill="#0b1220" />
          <rect x="26" y="27" width="28" height="14" rx="1" fill="#fff" stroke="#e5e7eb" strokeWidth="0.4" />
          <rect x="28" y="29" width="14" height="1.1" fill="#0b1220" />
          <rect x="46" y="29" width="6" height="1.1" rx="0.5" fill="#22d3ee" opacity="0.4" />
          <rect x="28" y="32" width="22" height="0.8" fill="#888" />
          <rect x="28" y="35" width="22" height="0.8" fill="#aaa" />
          <rect x="28" y="37" width="20" height="0.8" fill="#aaa" />
          <rect x="26" y="44" width="14" height="1.4" fill="#0b1220" />
          <rect x="26" y="48" width="28" height="11" rx="1" fill="#fff" stroke="#e5e7eb" strokeWidth="0.4" />
          <rect x="28" y="50" width="14" height="1.1" fill="#0b1220" />
          <rect x="28" y="53" width="22" height="0.8" fill="#aaa" />
          <rect x="28" y="55" width="20" height="0.8" fill="#aaa" />
        </svg>
      </div>
    );
  }

  if (id === 'sales') {
    return (
      <div className={common} style={paperStyle}>
        <svg viewBox="0 0 60 80" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
          <rect x="0" y="0" width="60" height="2" fill="#065f46" />
          <rect x="6" y="8" width="22" height="3" fill="#0a0a0a" />
          <rect x="34" y="9" width="20" height="2" rx="1" fill="#10b981" opacity="0.18" />
          <rect x="6" y="14" width="34" height="1" fill="#666" />
          <line x1="6" y1="20" x2="20" y2="20" stroke="#10b981" strokeWidth="1.4" />
          <rect x="6" y="22" width="14" height="1.3" fill="#065f46" />
          <rect x="6" y="25" width="44" height="0.9" fill="#888" />
          <rect x="6" y="27" width="38" height="0.9" fill="#888" />
          <line x1="6" y1="32" x2="20" y2="32" stroke="#10b981" strokeWidth="1.4" />
          <rect x="6" y="34" width="14" height="1.3" fill="#065f46" />
          <rect x="6" y="38" width="20" height="1" fill="#111" />
          <rect x="44" y="38" width="8" height="1" fill="#065f46" />
          <rect x="6" y="41" width="9" height="2.4" rx="0.5" fill="#10b981" />
          <rect x="17" y="41.4" width="34" height="1.6" fill="#aaa" />
          <rect x="6" y="45" width="9" height="2.4" rx="0.5" fill="#10b981" />
          <rect x="17" y="45.4" width="32" height="1.6" fill="#aaa" />
          <rect x="6" y="49" width="9" height="2.4" rx="0.5" fill="#10b981" />
          <rect x="17" y="49.4" width="36" height="1.6" fill="#aaa" />
          <line x1="6" y1="56" x2="20" y2="56" stroke="#10b981" strokeWidth="1.4" />
          <rect x="6" y="58" width="14" height="1.3" fill="#065f46" />
          <rect x="6" y="61" width="9" height="2" rx="0.5" fill="#10b981" opacity="0.20" />
          <rect x="16" y="61" width="11" height="2" rx="0.5" fill="#10b981" opacity="0.20" />
          <rect x="28" y="61" width="9" height="2" rx="0.5" fill="#10b981" opacity="0.20" />
          <rect x="38" y="61" width="13" height="2" rx="0.5" fill="#10b981" opacity="0.20" />
        </svg>
      </div>
    );
  }

  if (id === 'functional') {
    return (
      <div className={common} style={paperStyle}>
        <svg viewBox="0 0 60 80" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
          <rect x="0" y="0" width="60" height="22" fill="#faf5ff" />
          <rect x="14" y="6" width="32" height="3.5" rx="0.4" fill="#5b21b6" />
          <rect x="18" y="11.5" width="24" height="1" fill="#888" />
          <rect x="10" y="15" width="40" height="1" fill="#374151" />
          <rect x="14" y="17" width="32" height="1" fill="#374151" />
          <rect x="6" y="26" width="14" height="1.4" fill="#5b21b6" />
          <rect x="6" y="30" width="22" height="3" rx="1.2" fill="#5b21b6" opacity="0.10" />
          <rect x="6" y="30" width="22" height="3" rx="1.2" fill="none" stroke="#5b21b6" strokeWidth="0.3" opacity="0.6" />
          <circle cx="9" cy="31.5" r="0.9" fill="#5b21b6" />
          <rect x="11" y="31" width="14" height="1" fill="#374151" />
          <rect x="32" y="30" width="22" height="3" rx="1.2" fill="#0d9488" opacity="0.10" />
          <rect x="32" y="30" width="22" height="3" rx="1.2" fill="none" stroke="#0d9488" strokeWidth="0.3" opacity="0.6" />
          <circle cx="35" cy="31.5" r="0.9" fill="#0d9488" />
          <rect x="37" y="31" width="14" height="1" fill="#374151" />
          <rect x="6" y="34" width="22" height="3" rx="1.2" fill="#0d9488" opacity="0.10" />
          <rect x="6" y="34" width="22" height="3" rx="1.2" fill="none" stroke="#0d9488" strokeWidth="0.3" opacity="0.6" />
          <circle cx="9" cy="35.5" r="0.9" fill="#0d9488" />
          <rect x="11" y="35" width="14" height="1" fill="#374151" />
          <rect x="32" y="34" width="22" height="3" rx="1.2" fill="#5b21b6" opacity="0.10" />
          <rect x="32" y="34" width="22" height="3" rx="1.2" fill="none" stroke="#5b21b6" strokeWidth="0.3" opacity="0.6" />
          <circle cx="35" cy="35.5" r="0.9" fill="#5b21b6" />
          <rect x="37" y="35" width="14" height="1" fill="#374151" />
          <rect x="6" y="42" width="14" height="1.4" fill="#5b21b6" />
          <rect x="6" y="46" width="22" height="1" fill="#5b21b6" />
          <rect x="42" y="46" width="10" height="1" fill="#0d9488" />
          <rect x="8" y="48.5" width="42" height="0.9" fill="#aaa" />
          <rect x="8" y="50.3" width="36" height="0.9" fill="#aaa" />
          <rect x="6" y="56" width="14" height="1.4" fill="#5b21b6" />
          <rect x="6" y="60" width="22" height="3" rx="0.6" fill="#fafafa" stroke="#e5e7eb" strokeWidth="0.3" />
          <rect x="32" y="60" width="22" height="3" rx="0.6" fill="#fafafa" stroke="#e5e7eb" strokeWidth="0.3" />
        </svg>
      </div>
    );
  }

  if (id === 'serif') {
    return (
      <div className={common} style={paperStyle}>
        <svg viewBox="0 0 60 80" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
          <rect x="22" y="6" width="16" height="4" fill="#111827" />
          <line x1="20" y1="13.5" x2="30" y2="13.5" stroke="#b45309" strokeWidth="0.5" />
          <rect x="29.4" y="12.7" width="1.2" height="1.2" transform="rotate(45 30 13.3)" fill="#b45309" />
          <line x1="30" y1="13.5" x2="40" y2="13.5" stroke="#b45309" strokeWidth="0.5" />
          <rect x="20" y="16" width="20" height="0.9" fill="#374151" />
          <rect x="22" y="22" width="16" height="1.3" fill="#111827" />
          <line x1="20" y1="25" x2="40" y2="25" stroke="#b45309" strokeWidth="0.4" />
          <rect x="8" y="28" width="44" height="0.9" fill="#374151" />
          <rect x="8" y="30" width="44" height="0.9" fill="#374151" />
          <rect x="8" y="32" width="40" height="0.9" fill="#374151" />
          <rect x="22" y="38" width="16" height="1.3" fill="#111827" />
          <line x1="20" y1="41" x2="40" y2="41" stroke="#b45309" strokeWidth="0.4" />
          <rect x="8" y="44" width="22" height="1.1" fill="#111827" />
          <rect x="42" y="44" width="10" height="1" fill="#b45309" />
          <rect x="11" y="46.5" width="40" height="0.9" fill="#444" />
          <rect x="11" y="48.5" width="36" height="0.9" fill="#444" />
          <rect x="22" y="55" width="16" height="1.3" fill="#111827" />
          <line x1="20" y1="58" x2="40" y2="58" stroke="#b45309" strokeWidth="0.4" />
          <rect x="11" y="61" width="38" height="0.9" fill="#444" />
          <rect x="11" y="63" width="34" height="0.9" fill="#444" />
          <rect x="22" y="69" width="16" height="1.3" fill="#111827" />
          <line x1="20" y1="72" x2="40" y2="72" stroke="#b45309" strokeWidth="0.4" />
        </svg>
      </div>
    );
  }

  if (id === 'mono') {
    return (
      <div className={common} style={paperStyle}>
        <svg viewBox="0 0 60 80" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
          <rect x="0" y="0" width="60" height="20" fill="#0a0a0a" />
          <rect x="6" y="7" width="30" height="3.5" fill="#fff" />
          <rect x="6" y="13" width="22" height="1" fill="#fff" opacity="0.7" />
          <rect x="6" y="26" width="14" height="1.3" fill="#0a0a0a" />
          <line x1="6" y1="29" x2="54" y2="29" stroke="#0a0a0a" strokeWidth="0.8" />
          <rect x="6" y="32" width="44" height="1" fill="#888" />
          <rect x="6" y="34" width="38" height="1" fill="#888" />
          <rect x="6" y="40" width="14" height="1.3" fill="#0a0a0a" />
          <line x1="6" y1="43" x2="54" y2="43" stroke="#0a0a0a" strokeWidth="0.8" />
          <rect x="6" y="46" width="22" height="1.1" fill="#0a0a0a" />
          <rect x="42" y="46" width="10" height="1.1" fill="#0a0a0a" />
          <rect x="6" y="48.5" width="40" height="0.9" fill="#aaa" />
          <rect x="6" y="50.5" width="36" height="0.9" fill="#aaa" />
          <rect x="6" y="58" width="14" height="1.3" fill="#0a0a0a" />
          <line x1="6" y1="61" x2="54" y2="61" stroke="#0a0a0a" strokeWidth="0.8" />
          <rect x="6" y="64" width="42" height="0.9" fill="#aaa" />
          <rect x="6" y="66" width="38" height="0.9" fill="#aaa" />
        </svg>
      </div>
    );
  }

  if (id === 'timeline') {
    return (
      <div className={common} style={paperStyle}>
        <svg viewBox="0 0 60 80" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
          <rect x="6" y="9" width="22" height="3" fill="#0f172a" />
          <rect x="6" y="14" width="30" height="1" fill="#888" />
          <rect x="6" y="18" width="10" height="1" fill="#2563eb" />
          <rect x="6" y="24" width="12" height="1.4" fill="#0f172a" />
          <line x1="14" y1="32" x2="14" y2="68" stroke="#2563eb" strokeWidth="0.6" />
          <circle cx="14" cy="33" r="1.4" fill="#fff" stroke="#2563eb" strokeWidth="0.7" />
          <rect x="18" y="32" width="10" height="0.9" fill="#2563eb" />
          <rect x="18" y="34" width="20" height="1.1" fill="#0f172a" />
          <rect x="18" y="36" width="16" height="0.8" fill="#888" />
          <rect x="20" y="38.5" width="30" height="0.8" fill="#aaa" />
          <rect x="20" y="40.3" width="26" height="0.8" fill="#aaa" />
          <circle cx="14" cy="46" r="1.4" fill="#fff" stroke="#2563eb" strokeWidth="0.7" />
          <rect x="18" y="45" width="10" height="0.9" fill="#2563eb" />
          <rect x="18" y="47" width="22" height="1.1" fill="#0f172a" />
          <rect x="20" y="49.5" width="30" height="0.8" fill="#aaa" />
          <rect x="20" y="51.3" width="26" height="0.8" fill="#aaa" />
          <circle cx="14" cy="58" r="1.4" fill="#fff" stroke="#2563eb" strokeWidth="0.7" />
          <rect x="18" y="57" width="10" height="0.9" fill="#2563eb" />
          <rect x="18" y="59" width="20" height="1.1" fill="#0f172a" />
          <rect x="20" y="61.5" width="28" height="0.8" fill="#aaa" />
          <rect x="6" y="72" width="9" height="2" rx="0.5" fill="#2563eb" opacity="0.18" />
          <rect x="17" y="72" width="11" height="2" rx="0.5" fill="#2563eb" opacity="0.18" />
          <rect x="30" y="72" width="9" height="2" rx="0.5" fill="#2563eb" opacity="0.18" />
        </svg>
      </div>
    );
  }

  if (id === 'banking') {
    return (
      <div className={common} style={paperStyle}>
        <svg viewBox="0 0 60 80" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
          <line x1="6" y1="11" x2="54" y2="11" stroke="#0c1d3d" strokeWidth="1" />
          <rect x="20" y="13" width="20" height="3" fill="#0c1d3d" />
          <rect x="20" y="18" width="20" height="0.9" fill="#444" />
          <line x1="6" y1="22" x2="54" y2="22" stroke="#0c1d3d" strokeWidth="0.5" />
          <rect x="6" y="27" width="22" height="1.4" fill="#0c1d3d" />
          <line x1="6" y1="30" x2="54" y2="30" stroke="#0c1d3d" strokeWidth="0.4" />
          <rect x="6" y="33" width="44" height="0.9" fill="#444" />
          <rect x="6" y="35" width="38" height="0.9" fill="#444" />
          <rect x="6" y="40" width="22" height="1.4" fill="#0c1d3d" />
          <line x1="6" y1="43" x2="54" y2="43" stroke="#0c1d3d" strokeWidth="0.4" />
          <rect x="6" y="46" width="22" height="1.1" fill="#0c1d3d" />
          <rect x="42" y="46" width="10" height="1" fill="#666" />
          <rect x="6" y="48" width="22" height="0.9" fill="#666" />
          <rect x="8" y="50.5" width="40" height="0.9" fill="#aaa" />
          <rect x="8" y="52.5" width="36" height="0.9" fill="#aaa" />
          <rect x="6" y="58" width="22" height="1.4" fill="#0c1d3d" />
          <line x1="6" y1="61" x2="54" y2="61" stroke="#0c1d3d" strokeWidth="0.4" />
          <rect x="6" y="64" width="44" height="0.9" fill="#aaa" />
        </svg>
      </div>
    );
  }

  if (id === 'healthcare') {
    return (
      <div className={common} style={paperStyle}>
        <svg viewBox="0 0 60 80" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
          <rect x="0" y="0" width="60" height="2" fill="#0d9488" />
          <circle cx="11" cy="14" r="5" fill="#e6fffb" stroke="#0d9488" strokeWidth="0.6" />
          <rect x="20" y="10" width="28" height="3" fill="#115e59" />
          <rect x="20" y="15" width="22" height="1" fill="#666" />
          <rect x="6" y="24" width="22" height="1.4" fill="#115e59" />
          <line x1="6" y1="27" x2="54" y2="27" stroke="#0d9488" strokeWidth="0.6" />
          <rect x="6" y="30" width="40" height="0.9" fill="#888" />
          <rect x="6" y="32" width="36" height="0.9" fill="#888" />
          <rect x="6" y="38" width="22" height="1.4" fill="#115e59" />
          <line x1="6" y1="41" x2="54" y2="41" stroke="#0d9488" strokeWidth="0.6" />
          <rect x="6" y="44" width="20" height="1.1" fill="#115e59" />
          <rect x="42" y="44" width="10" height="1" fill="#0d9488" />
          <rect x="8" y="46.5" width="40" height="0.9" fill="#aaa" />
          <rect x="6" y="54" width="22" height="1.4" fill="#115e59" />
          <line x1="6" y1="57" x2="54" y2="57" stroke="#0d9488" strokeWidth="0.6" />
          <rect x="6" y="60" width="9" height="2" rx="1" fill="#0d9488" opacity="0.18" />
          <rect x="16" y="60" width="11" height="2" rx="1" fill="#0d9488" opacity="0.18" />
          <rect x="28" y="60" width="9" height="2" rx="1" fill="#0d9488" opacity="0.18" />
          <rect x="38" y="60" width="13" height="2" rx="1" fill="#0d9488" opacity="0.18" />
        </svg>
      </div>
    );
  }

  if (id === 'government') {
    return (
      <div className={common} style={paperStyle}>
        <svg viewBox="0 0 60 80" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
          <rect x="14" y="9" width="32" height="3" fill="#002868" />
          <rect x="18" y="14" width="24" height="1" fill="#666" />
          <line x1="6" y1="18" x2="54" y2="18" stroke="#002868" strokeWidth="0.5" />
          <line x1="6" y1="20" x2="54" y2="20" stroke="#002868" strokeWidth="0.5" />
          <rect x="6" y="25" width="22" height="1.4" fill="#002868" />
          <line x1="6" y1="28" x2="54" y2="28" stroke="#002868" strokeWidth="1" />
          <rect x="6" y="31" width="44" height="0.9" fill="#444" />
          <rect x="6" y="33" width="38" height="0.9" fill="#444" />
          <rect x="6" y="38" width="22" height="1.4" fill="#002868" />
          <line x1="6" y1="41" x2="54" y2="41" stroke="#002868" strokeWidth="1" />
          <rect x="6" y="44" width="20" height="1.1" fill="#002868" />
          <rect x="6" y="46" width="22" height="0.9" fill="#666" />
          <rect x="8" y="48" width="42" height="0.9" fill="#aaa" />
          <rect x="8" y="50" width="38" height="0.9" fill="#aaa" />
          <rect x="6" y="56" width="22" height="1.4" fill="#002868" />
          <line x1="6" y1="59" x2="54" y2="59" stroke="#002868" strokeWidth="1" />
          <rect x="6" y="62" width="22" height="1.1" fill="#002868" />
          <rect x="6" y="64" width="20" height="0.9" fill="#666" />
          <rect x="6" y="70" width="22" height="1.4" fill="#002868" />
          <line x1="6" y1="73" x2="54" y2="73" stroke="#002868" strokeWidth="1" />
          <rect x="6" y="76" width="40" height="0.9" fill="#aaa" />
        </svg>
      </div>
    );
  }

  if (id === 'designer') {
    return (
      <div className={common} style={paperStyle}>
        <svg viewBox="0 0 60 80" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
          <rect x="0" y="0" width="60" height="22" fill="#fef3ec" />
          <rect x="6" y="6" width="11" height="11" rx="2" fill="#fff" stroke="#fb7185" strokeWidth="0.6" />
          <rect x="20" y="6" width="14" height="1" fill="#fb7185" />
          <rect x="20" y="9" width="28" height="3.5" fill="#1f1f2c" />
          <rect x="20" y="15" width="22" height="1" fill="#5b5b6a" />
          <rect x="6" y="26" width="14" height="1.3" fill="#1f1f2c" />
          <line x1="6" y1="29" x2="20" y2="29" stroke="#fb7185" strokeWidth="0.8" />
          <rect x="6" y="32" width="44" height="0.9" fill="#888" />
          <rect x="6" y="34" width="38" height="0.9" fill="#888" />
          <rect x="6" y="40" width="14" height="1.3" fill="#1f1f2c" />
          <line x1="6" y1="43" x2="20" y2="43" stroke="#fb7185" strokeWidth="0.8" />
          <rect x="6" y="46" width="20" height="1.1" fill="#1f1f2c" />
          <rect x="42" y="46" width="10" height="1" fill="#fb7185" />
          <rect x="8" y="48.5" width="40" height="0.9" fill="#aaa" />
          <rect x="6" y="56" width="14" height="1.3" fill="#1f1f2c" />
          <line x1="6" y1="59" x2="20" y2="59" stroke="#fb7185" strokeWidth="0.8" />
          <rect x="6" y="62" width="9" height="2.2" rx="1.1" fill="#fef3ec" stroke="#fb718550" strokeWidth="0.4" />
          <rect x="16" y="62" width="11" height="2.2" rx="1.1" fill="#fef3ec" stroke="#fb718550" strokeWidth="0.4" />
          <rect x="28" y="62" width="9" height="2.2" rx="1.1" fill="#fef3ec" stroke="#fb718550" strokeWidth="0.4" />
          <rect x="38" y="62" width="13" height="2.2" rx="1.1" fill="#fef3ec" stroke="#fb718550" strokeWidth="0.4" />
        </svg>
      </div>
    );
  }

  if (id === 'marketing') {
    return (
      <div className={common} style={paperStyle}>
        <svg viewBox="0 0 60 80" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
          <defs>
            <linearGradient id="cv-mkt" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#db2777" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="60" height="22" fill="url(#cv-mkt)" />
          <rect x="6" y="8" width="34" height="3.5" fill="#fff" />
          <rect x="6" y="14" width="28" height="1" fill="#fff" opacity="0.85" />
          <rect x="6" y="26" width="3" height="1.4" fill="#db2777" />
          <rect x="11" y="26" width="14" height="1.4" fill="#0f172a" />
          <rect x="6" y="30" width="44" height="0.9" fill="#888" />
          <rect x="6" y="32" width="38" height="0.9" fill="#888" />
          <rect x="6" y="38" width="3" height="1.4" fill="#db2777" />
          <rect x="11" y="38" width="14" height="1.4" fill="#0f172a" />
          <rect x="6" y="42" width="22" height="1.1" fill="#db2777" />
          <rect x="40" y="42" width="12" height="2" rx="1" fill="#f97316" opacity="0.20" />
          <rect x="8" y="45" width="42" height="0.9" fill="#aaa" />
          <rect x="8" y="47" width="38" height="0.9" fill="#aaa" />
          <rect x="6" y="54" width="3" height="1.4" fill="#db2777" />
          <rect x="11" y="54" width="14" height="1.4" fill="#0f172a" />
          <rect x="6" y="58" width="9" height="2" rx="0.5" fill="#db2777" opacity="0.15" />
          <rect x="16" y="58" width="11" height="2" rx="0.5" fill="#db2777" opacity="0.15" />
          <rect x="28" y="58" width="9" height="2" rx="0.5" fill="#db2777" opacity="0.15" />
          <rect x="38" y="58" width="13" height="2" rx="0.5" fill="#db2777" opacity="0.15" />
        </svg>
      </div>
    );
  }

  if (id === 'legal') {
    return (
      <div className={common} style={paperStyle}>
        <svg viewBox="0 0 60 80" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
          <rect x="18" y="9" width="24" height="3.5" fill="#1a1a1a" />
          <line x1="20" y1="15" x2="28" y2="15" stroke="#7f1d1d" strokeWidth="0.5" />
          <rect x="29" y="14" width="2" height="2" transform="rotate(45 30 15)" fill="#7f1d1d" />
          <line x1="32" y1="15" x2="40" y2="15" stroke="#7f1d1d" strokeWidth="0.5" />
          <rect x="20" y="17" width="20" height="1" fill="#666" />
          <rect x="22" y="24" width="16" height="1.2" fill="#7f1d1d" />
          <rect x="6" y="28" width="44" height="0.9" fill="#444" />
          <rect x="6" y="30" width="40" height="0.9" fill="#444" />
          <rect x="22" y="36" width="16" height="1.2" fill="#7f1d1d" />
          <rect x="6" y="40" width="22" height="1.1" fill="#7f1d1d" />
          <rect x="42" y="40" width="10" height="0.9" fill="#666" />
          <rect x="6" y="42" width="20" height="0.9" fill="#666" />
          <rect x="8" y="44.5" width="42" height="0.9" fill="#444" />
          <rect x="8" y="46.5" width="38" height="0.9" fill="#444" />
          <rect x="22" y="52" width="16" height="1.2" fill="#7f1d1d" />
          <rect x="6" y="56" width="22" height="1.1" fill="#7f1d1d" />
          <rect x="6" y="58" width="20" height="0.9" fill="#666" />
          <rect x="22" y="64" width="16" height="1.2" fill="#7f1d1d" />
          <rect x="6" y="68" width="40" height="0.9" fill="#444" />
        </svg>
      </div>
    );
  }

  if (id === 'twotone') {
    return (
      <div className={common} style={paperStyle}>
        <svg viewBox="0 0 60 80" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
          <rect x="0" y="0" width="60" height="24" fill="#1e293b" />
          <circle cx="11" cy="13" r="5" fill="#fff" opacity="0.9" stroke="#38bdf8" strokeWidth="0.6" />
          <rect x="20" y="9" width="28" height="3.5" fill="#fff" />
          <rect x="20" y="15" width="14" height="1" fill="#38bdf8" />
          <rect x="20" y="17.5" width="22" height="0.9" fill="#fff" opacity="0.78" />
          <rect x="6" y="28" width="14" height="1.3" fill="#1e293b" />
          <line x1="6" y1="31" x2="54" y2="31" stroke="#1e293b" strokeWidth="0.7" />
          <rect x="6" y="34" width="44" height="0.9" fill="#888" />
          <rect x="6" y="36" width="38" height="0.9" fill="#888" />
          <rect x="6" y="42" width="14" height="1.3" fill="#1e293b" />
          <line x1="6" y1="45" x2="54" y2="45" stroke="#1e293b" strokeWidth="0.7" />
          <rect x="6" y="48" width="20" height="1.1" fill="#1e293b" />
          <rect x="42" y="48" width="10" height="1" fill="#38bdf8" />
          <rect x="8" y="50.5" width="42" height="0.9" fill="#aaa" />
          <rect x="8" y="52.5" width="38" height="0.9" fill="#aaa" />
          <rect x="6" y="58" width="14" height="1.3" fill="#1e293b" />
          <line x1="6" y1="61" x2="54" y2="61" stroke="#1e293b" strokeWidth="0.7" />
          <rect x="6" y="64" width="42" height="0.9" fill="#aaa" />
        </svg>
      </div>
    );
  }

  if (id === 'startup') {
    return (
      <div className={common} style={paperStyle}>
        <svg viewBox="0 0 60 80" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
          <rect x="6" y="9" width="22" height="3.5" fill="#0a0a0a" />
          <rect x="30" y="10" width="14" height="2" rx="0.5" fill="#22c55e" />
          <rect x="6" y="15" width="30" height="1" fill="#666" />
          <rect x="6" y="22" width="3" height="1.2" fill="#0a0a0a" />
          <rect x="11" y="22" width="14" height="1.3" fill="#0a0a0a" />
          <rect x="6" y="26" width="44" height="0.9" fill="#444" />
          <rect x="6" y="28" width="38" height="0.9" fill="#444" />
          <rect x="6" y="34" width="3" height="1.2" fill="#0a0a0a" />
          <rect x="11" y="34" width="14" height="1.3" fill="#0a0a0a" />
          <rect x="6" y="38" width="22" height="1.1" fill="#0a0a0a" />
          <rect x="42" y="38" width="10" height="2" rx="0.5" fill="#f4f4f5" />
          <rect x="6" y="40" width="20" height="0.9" fill="#22c55e" />
          <rect x="9" y="42.5" width="42" height="0.9" fill="#aaa" />
          <rect x="9" y="44.3" width="38" height="0.9" fill="#aaa" />
          <rect x="6" y="50" width="3" height="1.2" fill="#0a0a0a" />
          <rect x="11" y="50" width="14" height="1.3" fill="#0a0a0a" />
          <rect x="6" y="54" width="9" height="2" rx="0.5" fill="#f4f4f5" />
          <rect x="16" y="54" width="11" height="2" rx="0.5" fill="#f4f4f5" />
          <rect x="28" y="54" width="9" height="2" rx="0.5" fill="#f4f4f5" />
          <rect x="38" y="54" width="13" height="2" rx="0.5" fill="#f4f4f5" />
          <rect x="6" y="62" width="3" height="1.2" fill="#0a0a0a" />
          <rect x="11" y="62" width="14" height="1.3" fill="#0a0a0a" />
          <rect x="6" y="66" width="40" height="0.9" fill="#aaa" />
        </svg>
      </div>
    );
  }

  const theme = THUMB_THEMES[id];
  if (theme) {
    return <ThemeThumbnail theme={theme} />;
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

interface ThumbTheme {
  primary: string;
  accent: string;
  bg?: string;
  layout?: 'single' | 'centered' | 'band' | 'sidebar-right' | 'sidebar-left' | 'three' | 'horizontal' | 'cards' | 'magazine' | 'bars' | 'mono';
  hasPhoto?: boolean;
  fontHint?: 'serif' | 'sans' | 'mono';
}

const THUMB_THEMES: Partial<Record<TemplateId, ThumbTheme>> = {
  realestate: { primary: '#1f2937', accent: '#b8860b', layout: 'centered', fontHint: 'serif' },
  education: { primary: '#15803d', accent: '#f59e0b', layout: 'single' },
  nonprofit: { primary: '#365314', accent: '#84cc16', layout: 'centered' },
  construction: { primary: '#1f2937', accent: '#ea580c', layout: 'band' },
  journalism: { primary: '#0a0a0a', accent: '#0a0a0a', layout: 'centered', fontHint: 'serif' },
  finance: { primary: '#064e3b', accent: '#10b981', layout: 'band' },
  research: { primary: '#1e40af', accent: '#0ea5e9', layout: 'single' },
  media: { primary: '#27272a', accent: '#f43f5e', layout: 'band' },
  retail: { primary: '#7c2d12', accent: '#f59e0b', layout: 'centered' },
  logistics: { primary: '#1e3a8a', accent: '#64748b', layout: 'single' },
  pastel: { primary: '#86198f', accent: '#f0abfc', bg: '#fdf4ff', layout: 'single' },
  noir: { primary: '#18181b', accent: '#ef4444', layout: 'band' },
  botanical: { primary: '#3f6212', accent: '#a3a380', bg: '#f7f8f3', layout: 'centered', fontHint: 'serif' },
  sunset: { primary: '#9a3412', accent: '#fbbf24', bg: '#fff7ed', layout: 'band' },
  neon: { primary: '#581c87', accent: '#06b6d4', layout: 'band', fontHint: 'mono' },
  kraft: { primary: '#3f2a14', accent: '#92400e', bg: '#e8d8b0', layout: 'centered', fontHint: 'mono' },
  typewriter: { primary: '#1a1a1a', accent: '#1a1a1a', layout: 'mono', fontHint: 'mono' },
  booklet: { primary: '#0f172a', accent: '#475569', layout: 'centered', fontHint: 'serif' },
  blocks: { primary: '#4338ca', accent: '#a78bfa', layout: 'single' },
  magazine: { primary: '#0a0a0a', accent: '#dc2626', layout: 'magazine', fontHint: 'serif' },
  rightcol: { primary: '#0e7490', accent: '#fef3c7', layout: 'sidebar-right', hasPhoto: true },
  threecol: { primary: '#1e3a8a', accent: '#0ea5e9', layout: 'three' },
  horizontal: { primary: '#0f172a', accent: '#f97316', layout: 'horizontal' },
  infographic: { primary: '#0f766e', accent: '#facc15', layout: 'bars' },
  cards: { primary: '#312e81', accent: '#818cf8', bg: '#f8fafc', layout: 'cards' },
};

function ThemeThumbnail({ theme }: { theme: ThumbTheme }) {
  const bg = theme.bg || '#ffffff';
  const p = theme.primary;
  const a = theme.accent;
  const layout = theme.layout || 'single';

  const baseClass = 'w-full aspect-[4/5] rounded-md overflow-hidden';

  if (layout === 'sidebar-right') {
    return (
      <div className={baseClass} style={{ background: bg }}>
        <svg viewBox="0 0 60 80" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
          <rect x="38" y="0" width="22" height="80" fill={a} />
          <circle cx="49" cy="14" r="5" fill="#fff" stroke={p} strokeWidth="0.6" />
          <rect x="41" y="22" width="16" height="0.9" fill={p} opacity="0.7" />
          <rect x="41" y="24" width="14" height="0.9" fill={p} opacity="0.7" />
          <rect x="41" y="32" width="10" height="1" fill={p} />
          <rect x="41" y="35" width="14" height="0.8" fill={p} opacity="0.6" />
          <rect x="41" y="37" width="13" height="0.8" fill={p} opacity="0.6" />
          <rect x="6" y="10" width="22" height="3" fill={p} />
          <rect x="6" y="15" width="22" height="0.9" fill="#888" />
          <rect x="6" y="22" width="3" height="0.6" fill={a} />
          <rect x="6" y="26" width="12" height="1.3" fill={p} />
          <line x1="6" y1="29" x2="36" y2="29" stroke={p} strokeWidth="0.6" />
          <rect x="6" y="32" width="28" height="0.9" fill="#aaa" />
          <rect x="6" y="34" width="24" height="0.9" fill="#aaa" />
          <rect x="6" y="40" width="12" height="1.3" fill={p} />
          <line x1="6" y1="43" x2="36" y2="43" stroke={p} strokeWidth="0.6" />
          <rect x="6" y="46" width="18" height="1" fill={p} />
          <rect x="6" y="48.5" width="28" height="0.9" fill="#aaa" />
          <rect x="6" y="50.5" width="24" height="0.9" fill="#aaa" />
          <rect x="6" y="56" width="12" height="1.3" fill={p} />
          <line x1="6" y1="59" x2="36" y2="59" stroke={p} strokeWidth="0.6" />
          <rect x="6" y="62" width="26" height="0.9" fill="#aaa" />
        </svg>
      </div>
    );
  }

  if (layout === 'sidebar-left') {
    return (
      <div className={baseClass} style={{ background: bg }}>
        <svg viewBox="0 0 60 80" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
          <rect x="0" y="0" width="22" height="80" fill={p} />
          <circle cx="11" cy="14" r="5" fill="#fff" opacity="0.92" />
          <rect x="3" y="22" width="16" height="1.4" fill="#fff" />
          <rect x="3" y="28" width="10" height="0.9" fill={a} />
          <rect x="3" y="31" width="14" height="0.8" fill="#fff" opacity="0.7" />
          <rect x="3" y="33" width="12" height="0.8" fill="#fff" opacity="0.7" />
          <rect x="26" y="10" width="14" height="1.3" fill={p} />
          <line x1="26" y1="14" x2="56" y2="14" stroke={p} strokeWidth="0.6" />
          <rect x="26" y="20" width="14" height="1.3" fill={p} />
          <rect x="48" y="20" width="6" height="1" fill={a} />
          <rect x="26" y="23" width="26" height="0.9" fill="#aaa" />
          <rect x="28" y="25" width="24" height="0.9" fill="#aaa" />
          <rect x="26" y="34" width="14" height="1.3" fill={p} />
          <rect x="26" y="37" width="26" height="0.9" fill="#aaa" />
          <rect x="26" y="46" width="14" height="1.3" fill={p} />
          <rect x="26" y="49" width="26" height="0.9" fill="#aaa" />
        </svg>
      </div>
    );
  }

  if (layout === 'three') {
    return (
      <div className={baseClass} style={{ background: bg }}>
        <svg viewBox="0 0 60 80" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
          <rect x="6" y="9" width="22" height="3" fill={p} />
          <rect x="6" y="14" width="28" height="1" fill="#888" />
          <rect x="6" y="18" width="10" height="1" fill={a} />
          <rect x="6" y="26" width="12" height="1.3" fill={p} />
          <line x1="6" y1="29" x2="40" y2="29" stroke={p} strokeWidth="0.6" />
          <rect x="6" y="32" width="32" height="1" fill={p} opacity="0.4" />
          <rect x="6" y="36" width="12" height="1.3" fill={p} />
          <rect x="6" y="38.5" width="32" height="0.9" fill="#aaa" />
          <rect x="6" y="40.3" width="28" height="0.9" fill="#aaa" />
          <rect x="6" y="46" width="32" height="1" fill={p} opacity="0.4" />
          <rect x="6" y="48" width="32" height="0.9" fill="#aaa" />
          <rect x="6" y="50" width="28" height="0.9" fill="#aaa" />
          <rect x="42" y="26" width="12" height="1.3" fill={p} />
          <line x1="42" y1="29" x2="54" y2="29" stroke={p} strokeWidth="0.6" />
          <rect x="42" y="32" width="11" height="0.9" fill="#aaa" />
          <rect x="42" y="34" width="9" height="0.9" fill="#aaa" />
          <rect x="42" y="40" width="12" height="1.3" fill={p} />
          <line x1="42" y1="43" x2="54" y2="43" stroke={p} strokeWidth="0.6" />
          <rect x="42" y="46" width="11" height="0.9" fill="#aaa" />
          <rect x="42" y="48" width="9" height="0.9" fill="#aaa" />
          <rect x="42" y="54" width="12" height="1.3" fill={p} />
          <line x1="42" y1="57" x2="54" y2="57" stroke={p} strokeWidth="0.6" />
          <rect x="42" y="60" width="11" height="0.9" fill="#aaa" />
        </svg>
      </div>
    );
  }

  if (layout === 'horizontal') {
    return (
      <div className={baseClass} style={{ background: bg }}>
        <svg viewBox="0 0 60 80" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
          <rect x="6" y="10" width="34" height="5" fill={p} />
          <rect x="44" y="10" width="10" height="0.8" fill="#888" />
          <rect x="44" y="12" width="9" height="0.8" fill="#888" />
          <rect x="44" y="14" width="10" height="0.8" fill="#888" />
          <line x1="6" y1="20" x2="54" y2="20" stroke={a} strokeWidth="1.2" />
          <rect x="6" y="26" width="14" height="1.3" fill={p} />
          <line x1="6" y1="29" x2="54" y2="29" stroke={a} strokeWidth="0.5" />
          <rect x="6" y="32" width="44" height="0.9" fill="#aaa" />
          <rect x="6" y="38" width="14" height="1.3" fill={p} />
          <line x1="6" y1="41" x2="54" y2="41" stroke={a} strokeWidth="0.5" />
          <rect x="6" y="44" width="8" height="1" fill={a} />
          <rect x="20" y="44" width="20" height="1.1" fill={p} />
          <rect x="20" y="46" width="32" height="0.9" fill="#aaa" />
          <rect x="6" y="52" width="8" height="1" fill={a} />
          <rect x="20" y="52" width="22" height="1.1" fill={p} />
          <rect x="20" y="54" width="32" height="0.9" fill="#aaa" />
          <rect x="6" y="60" width="14" height="1.3" fill={p} />
          <line x1="6" y1="63" x2="54" y2="63" stroke={a} strokeWidth="0.5" />
          <rect x="6" y="66" width="40" height="0.9" fill="#aaa" />
        </svg>
      </div>
    );
  }

  if (layout === 'bars') {
    return (
      <div className={baseClass} style={{ background: bg }}>
        <svg viewBox="0 0 60 80" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
          <rect x="6" y="9" width="22" height="3" fill={p} />
          <rect x="6" y="14" width="30" height="1" fill="#888" />
          <rect x="6" y="18" width="10" height="1" fill={a} />
          <rect x="6" y="24" width="14" height="1.3" fill={p} />
          <line x1="6" y1="27" x2="54" y2="27" stroke={p} strokeWidth="0.5" />
          <rect x="6" y="30" width="40" height="0.9" fill="#aaa" />
          <rect x="6" y="32" width="36" height="0.9" fill="#aaa" />
          <rect x="6" y="38" width="14" height="1.3" fill={p} />
          <line x1="6" y1="41" x2="54" y2="41" stroke={p} strokeWidth="0.5" />
          {[0, 1, 2, 3, 4].map((i) => {
            const widths = [42, 36, 30, 38, 28];
            return (
              <g key={i}>
                <rect x="6" y={44 + i * 4} width="14" height="0.7" fill="#888" />
                <rect x="22" y={44 + i * 4} width="32" height="1.4" rx="0.7" fill="#e2e8f0" />
                <rect x="22" y={44 + i * 4} width={widths[i] * 0.5} height="1.4" rx="0.7" fill={p} />
              </g>
            );
          })}
        </svg>
      </div>
    );
  }

  if (layout === 'cards') {
    return (
      <div className={baseClass} style={{ background: bg }}>
        <svg viewBox="0 0 60 80" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
          <rect x="6" y="9" width="22" height="3" fill={p} />
          <rect x="6" y="14" width="30" height="1" fill="#888" />
          <rect x="6" y="18" width="10" height="1" fill={a} />
          {[24, 38, 54, 68].map((y, i) => {
            const heights = [12, 14, 12, 8];
            return (
              <g key={i}>
                <rect x="6" y={y} width="48" height={heights[i]} rx="1.2" fill="#fff" stroke="#e2e8f0" strokeWidth="0.4" />
                <rect x="9" y={y + 2} width="14" height="1" fill={p} />
                <rect x="9" y={y + 4.5} width="40" height="0.8" fill="#aaa" />
                {heights[i] > 9 && <rect x="9" y={y + 6.5} width="36" height="0.8" fill="#aaa" />}
                {heights[i] > 11 && <rect x="9" y={y + 8.5} width="38" height="0.8" fill="#aaa" />}
              </g>
            );
          })}
        </svg>
      </div>
    );
  }

  if (layout === 'magazine') {
    return (
      <div className={baseClass} style={{ background: bg }}>
        <svg viewBox="0 0 60 80" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
          <rect x="6" y="8" width="14" height="1" fill={a} />
          <rect x="6" y="12" width="42" height="6" fill={p} />
          <rect x="6" y="20" width="22" height="1" fill="#888" />
          <line x1="6" y1="24" x2="54" y2="24" stroke={p} strokeWidth="0.8" />
          <rect x="6" y="28" width="6" height="6" fill={a} />
          <rect x="14" y="29" width="38" height="0.8" fill="#444" />
          <rect x="14" y="31" width="38" height="0.8" fill="#444" />
          <rect x="14" y="33" width="34" height="0.8" fill="#444" />
          <rect x="6" y="40" width="14" height="1.3" fill={p} />
          <line x1="6" y1="43" x2="54" y2="43" stroke={p} strokeWidth="0.6" />
          <rect x="6" y="46" width="20" height="1" fill={p} />
          <rect x="44" y="46" width="10" height="0.9" fill={a} />
          <rect x="6" y="48.5" width="44" height="0.8" fill="#aaa" />
          <rect x="6" y="56" width="14" height="1.3" fill={p} />
          <line x1="6" y1="59" x2="54" y2="59" stroke={p} strokeWidth="0.6" />
          <rect x="6" y="62" width="42" height="0.9" fill="#aaa" />
        </svg>
      </div>
    );
  }

  if (layout === 'mono') {
    return (
      <div className={baseClass} style={{ background: bg }}>
        <svg viewBox="0 0 60 80" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
          <rect x="6" y="10" width="22" height="2" fill={p} />
          <rect x="6" y="14" width="34" height="0.8" fill="#666" />
          <line x1="6" y1="18" x2="54" y2="18" stroke={p} strokeWidth="0.4" />
          <rect x="6" y="22" width="10" height="1" fill={p} />
          <line x1="6" y1="24" x2="54" y2="24" stroke={p} strokeWidth="0.4" />
          <rect x="6" y="27" width="40" height="0.7" fill="#888" />
          <rect x="6" y="29" width="36" height="0.7" fill="#888" />
          <rect x="6" y="34" width="10" height="1" fill={p} />
          <line x1="6" y1="36" x2="54" y2="36" stroke={p} strokeWidth="0.4" />
          <rect x="6" y="39" width="42" height="0.7" fill="#888" />
          <rect x="6" y="41" width="38" height="0.7" fill="#888" />
          <rect x="6" y="46" width="10" height="1" fill={p} />
          <line x1="6" y1="48" x2="54" y2="48" stroke={p} strokeWidth="0.4" />
          <rect x="6" y="51" width="40" height="0.7" fill="#888" />
        </svg>
      </div>
    );
  }

  if (layout === 'centered') {
    return (
      <div className={baseClass} style={{ background: bg }}>
        <svg viewBox="0 0 60 80" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
          <rect x="14" y="10" width="32" height="3.5" fill={p} />
          <rect x="20" y="15.5" width="20" height="1" fill={a} />
          <line x1="10" y1="20" x2="50" y2="20" stroke={p} strokeWidth="0.6" />
          <rect x="14" y="26" width="14" height="1.4" fill={p} />
          <line x1="10" y1="29" x2="50" y2="29" stroke={p} strokeWidth="0.5" />
          <rect x="6" y="32" width="48" height="0.9" fill="#888" />
          <rect x="6" y="34" width="44" height="0.9" fill="#888" />
          <rect x="14" y="40" width="14" height="1.4" fill={p} />
          <line x1="10" y1="43" x2="50" y2="43" stroke={p} strokeWidth="0.5" />
          <rect x="6" y="46" width="22" height="1.1" fill={p} />
          <rect x="42" y="46" width="10" height="1" fill={a} />
          <rect x="6" y="48.5" width="48" height="0.9" fill="#aaa" />
          <rect x="6" y="50.5" width="44" height="0.9" fill="#aaa" />
          <rect x="14" y="58" width="14" height="1.4" fill={p} />
          <line x1="10" y1="61" x2="50" y2="61" stroke={p} strokeWidth="0.5" />
          <rect x="6" y="64" width="44" height="0.9" fill="#aaa" />
        </svg>
      </div>
    );
  }

  if (layout === 'band') {
    return (
      <div className={baseClass} style={{ background: bg }}>
        <svg viewBox="0 0 60 80" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
          <rect x="0" y="0" width="60" height="20" fill={p} />
          <rect x="6" y="7" width="32" height="3.5" fill="#fff" />
          <rect x="6" y="13" width="14" height="1" fill={a} />
          <rect x="6" y="15" width="22" height="0.9" fill="#fff" opacity="0.7" />
          <rect x="6" y="26" width="14" height="1.3" fill={p} />
          <rect x="6" y="29" width="2" height="3" fill={a} />
          <rect x="9" y="32" width="44" height="0.9" fill="#888" />
          <rect x="9" y="34" width="38" height="0.9" fill="#888" />
          <rect x="6" y="40" width="14" height="1.3" fill={p} />
          <rect x="6" y="43" width="2" height="3" fill={a} />
          <rect x="9" y="46" width="22" height="1.1" fill={p} />
          <rect x="42" y="46" width="10" height="1" fill={a} />
          <rect x="9" y="48.5" width="42" height="0.9" fill="#aaa" />
          <rect x="9" y="50.5" width="38" height="0.9" fill="#aaa" />
          <rect x="6" y="56" width="14" height="1.3" fill={p} />
          <rect x="6" y="59" width="2" height="3" fill={a} />
          <rect x="9" y="62" width="9" height="2" rx="1" fill={a} opacity="0.20" />
          <rect x="20" y="62" width="11" height="2" rx="1" fill={a} opacity="0.20" />
          <rect x="32" y="62" width="9" height="2" rx="1" fill={a} opacity="0.20" />
          <rect x="42" y="62" width="11" height="2" rx="1" fill={a} opacity="0.20" />
        </svg>
      </div>
    );
  }

  // single (default) — left-aligned name with accent rule
  return (
    <div className={baseClass} style={{ background: bg }}>
      <svg viewBox="0 0 60 80" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
        <rect x="6" y="9" width="22" height="3" fill={p} />
        <rect x="6" y="14" width="30" height="1" fill="#888" />
        <rect x="6" y="18" width="10" height="1" fill={a} />
        <rect x="6" y="24" width="14" height="1.3" fill={p} />
        <line x1="6" y1="27" x2="54" y2="27" stroke={p} strokeWidth="0.5" />
        <rect x="6" y="30" width="44" height="0.9" fill="#888" />
        <rect x="6" y="32" width="38" height="0.9" fill="#888" />
        <rect x="6" y="38" width="14" height="1.3" fill={p} />
        <line x1="6" y1="41" x2="54" y2="41" stroke={p} strokeWidth="0.5" />
        <rect x="6" y="44" width="22" height="1.1" fill={p} />
        <rect x="42" y="44" width="10" height="1" fill={a} />
        <rect x="6" y="46.5" width="42" height="0.9" fill="#aaa" />
        <rect x="6" y="48.5" width="38" height="0.9" fill="#aaa" />
        <rect x="6" y="54" width="14" height="1.3" fill={p} />
        <line x1="6" y1="57" x2="54" y2="57" stroke={p} strokeWidth="0.5" />
        <rect x="6" y="60" width="9" height="2" rx="0.6" fill={a} opacity="0.20" />
        <rect x="17" y="60" width="11" height="2" rx="0.6" fill={a} opacity="0.20" />
        <rect x="30" y="60" width="9" height="2" rx="0.6" fill={a} opacity="0.20" />
        <rect x="40" y="60" width="13" height="2" rx="0.6" fill={a} opacity="0.20" />
      </svg>
    </div>
  );
}
