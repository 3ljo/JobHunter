'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { Globe, Search, Check } from 'lucide-react';

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'af', name: 'Afrikaans', flag: '🇿🇦' },
  { code: 'sq', name: 'Albanian', flag: '🇦🇱' },
  { code: 'am', name: 'Amharic', flag: '🇪🇹' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'hy', name: 'Armenian', flag: '🇦🇲' },
  { code: 'az', name: 'Azerbaijani', flag: '🇦🇿' },
  { code: 'eu', name: 'Basque', flag: '🇪🇸' },
  { code: 'be', name: 'Belarusian', flag: '🇧🇾' },
  { code: 'bn', name: 'Bengali', flag: '🇧🇩' },
  { code: 'bs', name: 'Bosnian', flag: '🇧🇦' },
  { code: 'bg', name: 'Bulgarian', flag: '🇧🇬' },
  { code: 'ca', name: 'Catalan', flag: '🇪🇸' },
  { code: 'ceb', name: 'Cebuano', flag: '🇵🇭' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', flag: '🇨🇳' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', flag: '🇹🇼' },
  { code: 'co', name: 'Corsican', flag: '🇫🇷' },
  { code: 'hr', name: 'Croatian', flag: '🇭🇷' },
  { code: 'cs', name: 'Czech', flag: '🇨🇿' },
  { code: 'da', name: 'Danish', flag: '🇩🇰' },
  { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
  { code: 'eo', name: 'Esperanto', flag: '🌍' },
  { code: 'et', name: 'Estonian', flag: '🇪🇪' },
  { code: 'fi', name: 'Finnish', flag: '🇫🇮' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'fy', name: 'Frisian', flag: '🇳🇱' },
  { code: 'gl', name: 'Galician', flag: '🇪🇸' },
  { code: 'ka', name: 'Georgian', flag: '🇬🇪' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'el', name: 'Greek', flag: '🇬🇷' },
  { code: 'gu', name: 'Gujarati', flag: '🇮🇳' },
  { code: 'ht', name: 'Haitian Creole', flag: '🇭🇹' },
  { code: 'ha', name: 'Hausa', flag: '🇳🇬' },
  { code: 'haw', name: 'Hawaiian', flag: '🇺🇸' },
  { code: 'he', name: 'Hebrew', flag: '🇮🇱' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'hmn', name: 'Hmong', flag: '🇱🇦' },
  { code: 'hu', name: 'Hungarian', flag: '🇭🇺' },
  { code: 'is', name: 'Icelandic', flag: '🇮🇸' },
  { code: 'ig', name: 'Igbo', flag: '🇳🇬' },
  { code: 'id', name: 'Indonesian', flag: '🇮🇩' },
  { code: 'ga', name: 'Irish', flag: '🇮🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'jv', name: 'Javanese', flag: '🇮🇩' },
  { code: 'kn', name: 'Kannada', flag: '🇮🇳' },
  { code: 'kk', name: 'Kazakh', flag: '🇰🇿' },
  { code: 'km', name: 'Khmer', flag: '🇰🇭' },
  { code: 'rw', name: 'Kinyarwanda', flag: '🇷🇼' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'ku', name: 'Kurdish', flag: '🇮🇶' },
  { code: 'ky', name: 'Kyrgyz', flag: '🇰🇬' },
  { code: 'lo', name: 'Lao', flag: '🇱🇦' },
  { code: 'la', name: 'Latin', flag: '🇻🇦' },
  { code: 'lv', name: 'Latvian', flag: '🇱🇻' },
  { code: 'lt', name: 'Lithuanian', flag: '🇱🇹' },
  { code: 'lb', name: 'Luxembourgish', flag: '🇱🇺' },
  { code: 'mk', name: 'Macedonian', flag: '🇲🇰' },
  { code: 'mg', name: 'Malagasy', flag: '🇲🇬' },
  { code: 'ms', name: 'Malay', flag: '🇲🇾' },
  { code: 'ml', name: 'Malayalam', flag: '🇮🇳' },
  { code: 'mt', name: 'Maltese', flag: '🇲🇹' },
  { code: 'mi', name: 'Maori', flag: '🇳🇿' },
  { code: 'mr', name: 'Marathi', flag: '🇮🇳' },
  { code: 'mn', name: 'Mongolian', flag: '🇲🇳' },
  { code: 'my', name: 'Myanmar (Burmese)', flag: '🇲🇲' },
  { code: 'ne', name: 'Nepali', flag: '🇳🇵' },
  { code: 'no', name: 'Norwegian', flag: '🇳🇴' },
  { code: 'ny', name: 'Nyanja (Chichewa)', flag: '🇲🇼' },
  { code: 'or', name: 'Odia (Oriya)', flag: '🇮🇳' },
  { code: 'ps', name: 'Pashto', flag: '🇦🇫' },
  { code: 'fa', name: 'Persian', flag: '🇮🇷' },
  { code: 'pl', name: 'Polish', flag: '🇵🇱' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'pa', name: 'Punjabi', flag: '🇮🇳' },
  { code: 'ro', name: 'Romanian', flag: '🇷🇴' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'sm', name: 'Samoan', flag: '🇼🇸' },
  { code: 'gd', name: 'Scots Gaelic', flag: '🏴' },
  { code: 'sr', name: 'Serbian', flag: '🇷🇸' },
  { code: 'st', name: 'Sesotho', flag: '🇱🇸' },
  { code: 'sn', name: 'Shona', flag: '🇿🇼' },
  { code: 'sd', name: 'Sindhi', flag: '🇵🇰' },
  { code: 'si', name: 'Sinhala', flag: '🇱🇰' },
  { code: 'sk', name: 'Slovak', flag: '🇸🇰' },
  { code: 'sl', name: 'Slovenian', flag: '🇸🇮' },
  { code: 'so', name: 'Somali', flag: '🇸🇴' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'su', name: 'Sundanese', flag: '🇮🇩' },
  { code: 'sw', name: 'Swahili', flag: '🇰🇪' },
  { code: 'sv', name: 'Swedish', flag: '🇸🇪' },
  { code: 'tl', name: 'Tagalog (Filipino)', flag: '🇵🇭' },
  { code: 'tg', name: 'Tajik', flag: '🇹🇯' },
  { code: 'ta', name: 'Tamil', flag: '🇮🇳' },
  { code: 'tt', name: 'Tatar', flag: '🇷🇺' },
  { code: 'te', name: 'Telugu', flag: '🇮🇳' },
  { code: 'th', name: 'Thai', flag: '🇹🇭' },
  { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
  { code: 'tk', name: 'Turkmen', flag: '🇹🇲' },
  { code: 'uk', name: 'Ukrainian', flag: '🇺🇦' },
  { code: 'ur', name: 'Urdu', flag: '🇵🇰' },
  { code: 'ug', name: 'Uyghur', flag: '🇨🇳' },
  { code: 'uz', name: 'Uzbek', flag: '🇺🇿' },
  { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
  { code: 'cy', name: 'Welsh', flag: '🏴' },
  { code: 'xh', name: 'Xhosa', flag: '🇿🇦' },
  { code: 'yi', name: 'Yiddish', flag: '🇮🇱' },
  { code: 'yo', name: 'Yoruba', flag: '🇳🇬' },
  { code: 'zu', name: 'Zulu', flag: '🇿🇦' },
];

const STORAGE_KEY = 'jh_lang';

/** Programmatically trigger Google Translate via its hidden <select> */
function triggerGoogleTranslate(langCode: string) {
  const sel = document.querySelector<HTMLSelectElement>('.goog-te-combo');
  if (!sel) return false;
  sel.value = langCode;
  sel.dispatchEvent(new Event('change'));
  return true;
}

/** Inject an early <style> into <head> to kill Google Translate UI before it paints */
function injectBlockerCSS() {
  if (document.getElementById('gt-blocker-css')) return;
  const style = document.createElement('style');
  style.id = 'gt-blocker-css';
  style.textContent = `
    .goog-te-banner-frame, body > .skiptranslate,
    iframe.goog-te-banner-frame, iframe.skiptranslate,
    .goog-te-spinner-pos, #goog-gt-tt,
    .goog-te-balloon-frame, .goog-te-menu-frame,
    .goog-te-ftab-frame, div[id^="goog-gt-"] {
      display: none !important;
      visibility: hidden !important;
      height: 0 !important;
      opacity: 0 !important;
    }
    body { top: 0px !important; }
    #google_translate_element {
      position: fixed !important; left: -9999px !important; top: -9999px !important;
      visibility: hidden !important;
    }
  `;
  document.head.prepend(style);
}

export default function LanguageSwitcher() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [active, setActive] = useState('en');
  const [gtReady, setGtReady] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();

  // 1. On mount: inject blocker CSS, read saved lang, load Google Translate
  useEffect(() => {
    injectBlockerCSS();

    const saved = localStorage.getItem(STORAGE_KEY) || 'en';
    setActive(saved);

    // Create hidden container
    if (!document.getElementById('google_translate_element')) {
      const div = document.createElement('div');
      div.id = 'google_translate_element';
      document.body.appendChild(div);
    }

    (window as any).googleTranslateElementInit = () => {
      new (window as any).google.translate.TranslateElement(
        { pageLanguage: 'en', autoDisplay: false },
        'google_translate_element'
      );
      setGtReady(true);
    };

    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src =
        '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    } else {
      // Script already loaded from a previous mount
      setGtReady(!!document.querySelector('.goog-te-combo'));
    }
  }, []);

  // 2. When Google Translate is ready and we have a saved non-English lang, trigger it
  useEffect(() => {
    if (!gtReady) return;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved !== 'en') {
      triggerGoogleTranslate(saved);
    }
  }, [gtReady]);

  // 3. On route change, re-trigger translation for new content
  useEffect(() => {
    if (!gtReady) return;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved !== 'en') {
      // Small delay to let Next.js render new content first
      const timer = setTimeout(() => triggerGoogleTranslate(saved), 200);
      return () => clearTimeout(timer);
    }
  }, [pathname, gtReady]);

  // 4. MutationObserver to continuously kill Google Translate UI + body shift
  useEffect(() => {
    const observer = new MutationObserver(() => {
      document.body.style.top = '0px';
      document
        .querySelectorAll(
          '.goog-te-banner-frame, body > .skiptranslate, iframe.skiptranslate, .goog-te-spinner-pos, #goog-gt-tt'
        )
        .forEach((el) => {
          const h = el as HTMLElement;
          h.style.display = 'none';
          h.style.visibility = 'hidden';
          h.style.height = '0';
        });
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class'],
    });
    return () => observer.disconnect();
  }, []);

  // Focus search when opened
  useEffect(() => {
    if (open) {
      setSearch('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = useMemo(
    () =>
      languages.filter((l) =>
        l.name.toLowerCase().includes(search.toLowerCase())
      ),
    [search]
  );

  const handleSelect = useCallback(
    (lang: (typeof languages)[number]) => {
      setActive(lang.code);
      setOpen(false);
      localStorage.setItem(STORAGE_KEY, lang.code);

      if (lang.code === 'en') {
        // Reset — clear cookies, clear storage, reload once to restore original
        document.cookie =
          'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie =
          'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.' +
          window.location.hostname;
        localStorage.removeItem(STORAGE_KEY);
        window.location.reload();
        return;
      }

      // Trigger translation without reload
      if (!triggerGoogleTranslate(lang.code)) {
        // Fallback: set cookie and reload
        const value = '/en/' + lang.code;
        document.cookie = 'googtrans=' + value + '; path=/;';
        document.cookie =
          'googtrans=' + value + '; path=/; domain=.' + window.location.hostname;
        window.location.reload();
      }
    },
    []
  );

  const activeLang = languages.find((l) => l.code === active);

  return (
    <div ref={ref} className="relative notranslate">
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
        aria-label="Translate page"
        title="Translate"
      >
        <Globe className="h-4 w-4 shrink-0" />
        {activeLang && active !== 'en' && (
          <span className="text-sm leading-none">{activeLang.flag}</span>
        )}
      </button>

      <div
        className="absolute right-0 top-full mt-2 rounded-xl z-[999] transition-all duration-150 overflow-hidden"
        style={{
          background: '#12163a',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
          width: '260px',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transform: open ? 'translateY(0)' : 'translateY(-8px)',
        }}
      >
        <div
          className="flex items-center gap-2 px-3 py-2.5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          <Search
            className="h-3.5 w-3.5 shrink-0"
            style={{ color: 'rgba(255,255,255,0.3)' }}
          />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search language..."
            className="flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-white/25"
            style={{ color: 'rgba(255,255,255,0.85)' }}
          />
        </div>

        <div className="lang-list overflow-y-auto py-1" style={{ maxHeight: '300px' }}>
          {filtered.length === 0 && (
            <p
              className="px-3 py-4 text-center text-xs font-medium"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              No languages found
            </p>
          )}
          {filtered.map((lang) => {
            const isActive = active === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang)}
                className="flex items-center gap-3 w-full px-3 py-2 text-left transition-colors duration-100"
                style={{
                  background: isActive
                    ? 'rgba(118,77,240,0.15)'
                    : 'transparent',
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.65)',
                }}
                onMouseEnter={(e) => {
                  if (!isActive)
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive)
                    e.currentTarget.style.background = 'transparent';
                }}
              >
                <span className="text-base leading-none">{lang.flag}</span>
                <span className="text-sm font-semibold flex-1">{lang.name}</span>
                {isActive && (
                  <Check
                    className="h-3.5 w-3.5 shrink-0"
                    style={{ color: '#764DF0' }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
