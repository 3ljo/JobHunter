'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { TEMPLATE_COMPONENTS, DEFAULT_TEMPLATE, type TemplateId } from './templates';

interface CVPreviewProps {
  cv: any;
  template?: TemplateId;
  photo?: string | null;
  /** Data URL of the originally uploaded PDF — used when template === 'original'. */
  originalPdfDataUrl?: string | null;
  /** Kept for API compat; unused now that template previews render client-side. */
  cvRecordId?: string | null;
}

/** iOS Safari can't render PDF in <iframe>. Detect and show a fallback button. */
function useIsIOS() {
  const [ios, setIos] = useState(false);
  useEffect(() => {
    const ua = navigator.userAgent || '';
    const isIOS =
      /iPad|iPhone|iPod/.test(ua) ||
      // iPad on iPadOS 13+ reports as Mac with touch events
      (/^Mac/.test(navigator.platform) && navigator.maxTouchPoints > 1);
    setIos(isIOS);
  }, []);
  return ios;
}

export default function CVPreview({ cv, template, photo, originalPdfDataUrl }: CVPreviewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const isIOS = useIsIOS();

  const active: TemplateId =
    template && TEMPLATE_COMPONENTS[template] ? template : DEFAULT_TEMPLATE;
  const Template = TEMPLATE_COMPONENTS[active];

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      setCanPrev(el.scrollLeft > 4);
      setCanNext(el.scrollLeft < max - 4);
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [cv, template]);

  if (!cv) return null;

  const iframeHeight = 'min(calc(100vh - 180px), 900px)';

  // "original" template: show the user's uploaded PDF directly.
  // iOS can't render PDF in an iframe, so offer a button to open in a new tab.
  if (active === 'original') {
    if (!originalPdfDataUrl) {
      return (
        <div
          className="px-5 py-12 text-center text-sm"
          style={{ color: 'rgba(15,23,42,0.6)', background: '#ffffff' }}
        >
          Your original PDF isn&apos;t cached in this session. Re-upload your CV to see it here,
          or pick another template to view the AI-rewritten version.
        </div>
      );
    }

    if (isIOS) {
      return (
        <div
          className="flex flex-col items-center justify-center gap-4 px-6 py-10 text-center"
          style={{ background: '#f8fafc', minHeight: 320 }}
        >
          <p className="text-sm" style={{ color: '#0f172a', fontWeight: 600 }}>
            iOS doesn&apos;t preview PDFs inline.
          </p>
          <p className="text-xs" style={{ color: '#475569', maxWidth: 280 }}>
            Tap below to open your original CV in a new tab — or switch to an ATS template to
            view the AI-rewritten version here.
          </p>
          <a
            href={originalPdfDataUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold"
            style={{
              background: 'linear-gradient(135deg, #764DF0, #5b21b6)',
              color: '#f5f3ff',
              boxShadow: '0 4px 14px rgba(118,77,240,0.35)',
            }}
          >
            <ExternalLink className="h-4 w-4" />
            Open my CV
          </a>
        </div>
      );
    }

    return (
      <div style={{ background: '#ffffff' }}>
        <iframe
          src={originalPdfDataUrl}
          title="Your original CV"
          className="w-full block bg-white"
          style={{ height: iframeHeight, border: 'none' }}
        />
      </div>
    );
  }

  const scrollByPage = (dir: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    const page = el.clientWidth * 0.9 * dir;
    el.scrollBy({ left: page, behavior: 'smooth' });
  };

  // A4 portrait — 210 × 297 mm → 1 : 1.414.
  const A4_RATIO = 1.4143;
  const pageWidth = 'min(90vw, 595px)';
  const pageHeight = `calc(min(90vw, 595px) * ${A4_RATIO})`;

  return (
    <div style={{ position: 'relative' }}>
      <div
        ref={scrollRef}
        style={{
          overflowX: 'auto',
          overflowY: 'hidden',
          WebkitOverflowScrolling: 'touch',
          scrollSnapType: 'x mandatory',
          height: pageHeight,
          maxHeight: 'calc(100vh - 180px)',
          background: 'transparent',
          borderRadius: 12,
          padding: '0 12px',
        }}
      >
        <div
          style={{
            height: '100%',
            columnWidth: pageWidth,
            columnGap: 24,
            columnFill: 'auto',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
              borderRadius: 4,
              scrollSnapAlign: 'start',
            }}
          >
            <Template cv={cv} photo={photo ?? null} />
          </div>
        </div>
      </div>

      {canPrev && (
        <button
          type="button"
          onClick={() => scrollByPage(-1)}
          aria-label="Previous page"
          className="hidden sm:flex"
          style={{
            position: 'absolute',
            left: 6,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 36,
            height: 36,
            borderRadius: 999,
            background: 'rgba(15,10,40,0.75)',
            backdropFilter: 'blur(6px)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: 'white',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <ChevronLeft style={{ width: 18, height: 18 }} />
        </button>
      )}
      {canNext && (
        <button
          type="button"
          onClick={() => scrollByPage(1)}
          aria-label="Next page"
          className="hidden sm:flex"
          style={{
            position: 'absolute',
            right: 6,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 36,
            height: 36,
            borderRadius: 999,
            background: 'rgba(15,10,40,0.75)',
            backdropFilter: 'blur(6px)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: 'white',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <ChevronRight style={{ width: 18, height: 18 }} />
        </button>
      )}
    </div>
  );
}
