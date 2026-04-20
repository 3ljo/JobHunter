'use client';

import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TEMPLATE_COMPONENTS, DEFAULT_TEMPLATE, type TemplateId } from './templates';

interface CVPreviewProps {
  cv: any;
  template?: TemplateId;
  photo?: string | null;
  /** Data URL of the originally uploaded PDF — used when template === 'original'. */
  originalPdfDataUrl?: string | null;
}

export default function CVPreview({ cv, template, photo, originalPdfDataUrl }: CVPreviewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

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

  const active: TemplateId = (template && TEMPLATE_COMPONENTS[template]) ? template : DEFAULT_TEMPLATE;
  const Template = TEMPLATE_COMPONENTS[active];

  // "original" template: show the user's uploaded PDF directly in an iframe.
  if (active === 'original') {
    if (originalPdfDataUrl) {
      return (
        <div style={{ background: '#ffffff' }}>
          <iframe
            src={originalPdfDataUrl}
            title="Your original CV"
            className="w-full block bg-white"
            style={{ height: 'min(calc(100vh - 180px), 900px)', border: 'none' }}
          />
        </div>
      );
    }
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

  const scrollByPage = (dir: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    const page = el.clientWidth * 0.9 * dir;
    el.scrollBy({ left: page, behavior: 'smooth' });
  };

  // A4 portrait ratio is 210 × 297 mm → 1 : 1.414
  // We pick a target page width, then height is width × 1.414.
  // On mobile, width clamps to ~90vw; on desktop, tops out around 595px (A4 at 72dpi).
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
          // Gutter around the scroll track so a "single A4 page" visually sits centered
          padding: '0 12px',
        }}
      >
        <div
          style={{
            height: '100%',
            columnWidth: pageWidth,
            columnGap: 24,
            columnFill: 'auto',
            // Each column gets its own page-like frame via inner ::first-line? not reliable.
            // Instead we style the Template's root with paper look; the column container
            // stays transparent so multi-page CVs flow cleanly.
          }}
        >
          <div
            style={{
              // Make the single Template render like a paper page with subtle shadow.
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

      {/* Page nav arrows — desktop only; mobile uses touch swipe */}
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

