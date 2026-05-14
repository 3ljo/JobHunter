'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ExternalLink } from 'lucide-react';
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
  const isIOS = useIsIOS();

  const active: TemplateId =
    template && TEMPLATE_COMPONENTS[template] ? template : DEFAULT_TEMPLATE;
  const Template = TEMPLATE_COMPONENTS[active];

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

  // Scaled preview: render the template at its intrinsic A4 width (794px at
  // 96dpi), optically scale it down to fit the column, and let the outer
  // wrapper scroll vertically so long CVs (2+ pages of content) flow past
  // one A4 and can be scrolled through.
  return <ScaledPreview Template={Template} cv={cv} photo={photo ?? null} />;
}

interface ScaledPreviewProps {
  Template: React.FC<{ cv: any; photo?: string | null }>;
  cv: any;
  photo: string | null;
}

function ScaledPreview({ Template, cv, photo }: ScaledPreviewProps) {
  const A4_W = 794;
  const wrapperRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [scaledHeight, setScaledHeight] = useState(0);

  // Recompute scale when the column resizes, on orientation change, and
  // whenever content shifts. Covers mobile URL-bar show/hide too.
  useLayoutEffect(() => {
    const wrap = wrapperRef.current;
    const inner = innerRef.current;
    if (!wrap || !inner) return;

    const compute = () => {
      const availW = Math.max(0, wrap.clientWidth - 16);
      const s = Math.min(1, availW / A4_W);
      setScale(s);
      setScaledHeight(inner.scrollHeight * s);
    };

    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(wrap);
    ro.observe(inner);
    window.addEventListener('resize', compute);
    window.addEventListener('orientationchange', compute);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', compute);
      window.removeEventListener('orientationchange', compute);
    };
  }, [cv, photo, Template]);

  return (
    <div
      ref={wrapperRef}
      className="cv-preview-scroll relative"
      style={{
        // svh = "small viewport height" — the viewport excluding the mobile
        // URL bar. Falls back to vh on browsers that don't support svh.
        maxHeight: 'min(calc(100svh - 180px), calc(100vh - 180px))',
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '8px 6px 8px 8px',
        display: 'flex',
        justifyContent: 'center',
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(167,139,250,0.7) rgba(255,255,255,0.06)',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <div style={{ width: A4_W * scale, height: scaledHeight || undefined }}>
        <div
          ref={innerRef}
          style={{
            width: A4_W,
            background: '#ffffff',
            boxShadow: '0 4px 24px rgba(0,0,0,0.22)',
            borderRadius: 4,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          <Template cv={cv} photo={photo} />
        </div>
      </div>

      {/* Mobile scroll affordance — native iOS/Android scrollbars are hidden
          until you scroll, so a subtle bottom fade hints "there's more". */}
      <div
        className="pointer-events-none sm:hidden"
        style={{
          position: 'sticky',
          bottom: 0,
          left: 0,
          right: 0,
          height: 28,
          marginTop: -28,
          alignSelf: 'stretch',
          flex: '0 0 auto',
          background: 'linear-gradient(to top, rgba(13,17,48,0.75), rgba(13,17,48,0))',
        }}
      />

      <style jsx>{`
        /* Desktop: always-visible thin violet scrollbar. */
        .cv-preview-scroll::-webkit-scrollbar {
          width: 8px;
        }
        .cv-preview-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .cv-preview-scroll::-webkit-scrollbar-thumb {
          background: rgba(167, 139, 250, 0.55);
          border-radius: 999px;
        }
        .cv-preview-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(167, 139, 250, 0.8);
        }
        /* Mobile: slimmer so it doesn't eat into the A4 width. */
        @media (max-width: 640px) {
          .cv-preview-scroll::-webkit-scrollbar {
            width: 4px;
          }
          .cv-preview-scroll::-webkit-scrollbar-thumb {
            background: rgba(167, 139, 250, 0.85);
          }
        }
      `}</style>
    </div>
  );
}
