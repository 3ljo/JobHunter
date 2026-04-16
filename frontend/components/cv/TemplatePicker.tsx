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
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Template
          </span>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded"
            style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)' }}
          >
            ATS-OPTIMIZED
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 gap-2 sm:gap-3">
        {list.map((t) => {
          const isActive = value === t.id;
          const locked = t.proOnly && !isPro;

          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                if (locked) {
                  onUpgrade?.();
                  return;
                }
                onChange(t.id);
              }}
              className="relative text-left rounded-xl p-3 sm:p-3.5 transition-all duration-200"
              style={{
                background: isActive ? 'rgba(118,77,240,0.14)' : 'rgba(255,255,255,0.03)',
                border: isActive ? '1px solid rgba(118,77,240,0.55)' : '1px solid rgba(255,255,255,0.08)',
                cursor: locked ? 'not-allowed' : 'pointer',
                opacity: locked ? 0.75 : 1,
              }}
            >
              <TemplateThumbnail id={t.id} />

              <div className="flex items-center gap-1.5 mt-2.5">
                <p className="text-[12px] sm:text-[13px] font-bold text-white truncate">{t.name}</p>
                {t.proOnly && (
                  <span
                    className="inline-flex items-center gap-0.5 text-[9px] font-black px-1.5 py-[1px] rounded"
                    style={{ background: 'rgba(234,179,8,0.14)', color: '#fbbf24', border: '1px solid rgba(234,179,8,0.3)' }}
                  >
                    {locked ? <Lock className="h-2.5 w-2.5" /> : <Crown className="h-2.5 w-2.5" />} PRO
                  </span>
                )}
              </div>

              <p className="text-[10px] sm:text-[11px] text-white/45 mt-0.5 line-clamp-2 leading-tight">
                {t.description}
              </p>

              <div className="flex items-center justify-between mt-2">
                <span className="text-[9px] font-bold uppercase tracking-wider text-white/35">{t.region}</span>
                <span className="text-[10px] font-bold" style={{ color: '#34d399' }}>{t.atsScore}%</span>
              </div>

              {isActive && (
                <span
                  className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full"
                  style={{ background: '#764df0', color: 'white' }}
                >
                  <Check className="h-3 w-3" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* Tiny SVG thumbnails — each mirrors the template's visual identity */
function TemplateThumbnail({ id }: { id: TemplateId }) {
  const common = 'w-full aspect-[3/4] rounded-md overflow-hidden';
  const paperStyle = { background: '#ffffff' };

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

  // european
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
