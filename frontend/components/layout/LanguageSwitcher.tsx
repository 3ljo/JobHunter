'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Search, Check } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '@/lib/i18n/config';

export default function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const active = i18n.resolvedLanguage ?? i18n.language ?? 'en';
  const activeMeta =
    SUPPORTED_LANGUAGES.find((l) => l.code === active) ??
    SUPPORTED_LANGUAGES.find((l) => l.code.split('-')[0] === active.split('-')[0]) ??
    SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    if (open) {
      setSearch('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', handler);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', handler);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return SUPPORTED_LANGUAGES;
    return SUPPORTED_LANGUAGES.filter((l) =>
      l.name.toLowerCase().includes(q) ||
      l.nativeName.toLowerCase().includes(q) ||
      l.code.toLowerCase().includes(q),
    );
  }, [search]);

  const handleSelect = (code: string) => {
    i18n.changeLanguage(code);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 h-9 px-2.5 rounded-lg transition-all duration-200"
        style={{
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: 'rgba(255,255,255,0.6)',
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget;
          el.style.background = 'rgba(255,255,255,0.1)';
          el.style.borderColor = 'rgba(118,77,240,0.45)';
          el.style.color = '#fff';
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget;
          el.style.background = 'rgba(255,255,255,0.06)';
          el.style.borderColor = 'rgba(255,255,255,0.1)';
          el.style.color = 'rgba(255,255,255,0.6)';
        }}
        aria-label={t('languageSwitcher.label')}
        title={t('languageSwitcher.label')}
      >
        <Globe className="h-4 w-4 shrink-0" />
        <span className="text-sm leading-none">{activeMeta.flag}</span>
        <span className="text-[11px] font-bold uppercase tracking-wider">
          {activeMeta.code.split('-')[0]}
        </span>
      </button>

      <div
        className="absolute right-0 top-full mt-2 rounded-xl z-[999] transition-all duration-150 overflow-hidden"
        style={{
          background: '#12163a',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
          width: '280px',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transform: open ? 'translateY(0)' : 'translateY(-8px)',
        }}
      >
        <div
          className="flex items-center gap-2 px-3 py-2.5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          <Search className="h-3.5 w-3.5 shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }} />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('languageSwitcher.search')}
            className="flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-white/25"
            style={{ color: 'rgba(255,255,255,0.85)' }}
          />
        </div>

        <div className="overflow-y-auto py-1" style={{ maxHeight: '320px' }}>
          {filtered.length === 0 && (
            <p className="px-3 py-4 text-center text-xs font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>
              —
            </p>
          )}
          {filtered.map((lang) => {
            const isActive = active === lang.code || active.split('-')[0] === lang.code.split('-')[0];
            return (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                className="flex items-center gap-3 w-full px-3 py-2 text-left transition-colors duration-100"
                style={{
                  background: isActive ? 'rgba(118,77,240,0.15)' : 'transparent',
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.65)',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                }}
              >
                <span className="text-base leading-none">{lang.flag}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{lang.nativeName}</p>
                  <p className="text-[11px] text-white/40 truncate">{lang.name}</p>
                </div>
                {isActive && <Check className="h-3.5 w-3.5 shrink-0" style={{ color: '#764DF0' }} />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
