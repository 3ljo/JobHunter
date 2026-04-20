'use client';

import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Copy, Check, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
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

  // "original" template: show the user's uploaded PDF directly in an iframe,
  // followed by an AI-suggestions panel so Quick-Edit content (summary,
  // bullets) is still visible even though the PDF itself can't be modified.
  if (active === 'original') {
    return (
      <div style={{ background: '#ffffff' }}>
        {originalPdfDataUrl ? (
          <iframe
            src={originalPdfDataUrl}
            title="Your original CV"
            className="w-full block bg-white"
            style={{ height: 'min(calc(100vh - 180px), 900px)', border: 'none' }}
          />
        ) : (
          <div
            className="px-5 py-12 text-center text-sm"
            style={{ color: 'rgba(15,23,42,0.6)' }}
          >
            Your original PDF isn&apos;t cached in this session. Re-upload your CV to see it
            here, or pick another template to view the AI-rewritten version.
          </div>
        )}
        <OriginalAISuggestions cv={cv} />
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

/**
 * Panel shown under the original uploaded PDF in "Keep My Own" mode.
 * The PDF itself can't be edited, so if the user asks the AI for a new
 * summary / extra bullets / skills, we surface those as copyable blocks
 * here — the user applies them to their own file manually.
 */
function OriginalAISuggestions({ cv }: { cv: any }) {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (id: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(id);
      toast.success('Copied');
      setTimeout(() => setCopied(null), 1500);
    } catch {
      toast.error('Copy failed');
    }
  };

  const summary = typeof cv?.summary === 'string' ? cv.summary.trim() : '';
  const skills: string[] = Array.isArray(cv?.skills)
    ? cv.skills.map((s: any) => String(s || '').trim()).filter(Boolean)
    : [];
  const bullets: string[] = Array.isArray(cv?.experience)
    ? cv.experience.flatMap((role: any) => Array.isArray(role?.bullets) ? role.bullets : [])
      .map((b: any) => String(b || '').trim())
      .filter(Boolean)
    : [];

  const hasAnything = summary || skills.length > 0 || bullets.length > 0;
  if (!hasAnything) return null;

  return (
    <div
      className="border-t"
      style={{
        background: '#f8fafc',
        borderColor: '#e2e8f0',
        padding: '18px 20px 22px',
        color: '#0f172a',
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-3.5 w-3.5" style={{ color: '#7c3aed' }} />
        <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: '#4b5563' }}>
          AI-suggested content
        </p>
        <span
          className="text-[9px] font-bold px-1.5 py-0.5 rounded"
          style={{ background: '#ede9fe', color: '#6d28d9', border: '1px solid #ddd6fe' }}
        >
          COPY INTO YOUR CV
        </span>
      </div>
      <p className="text-[11.5px] mb-3" style={{ color: '#64748b' }}>
        Your PDF stays untouched. Copy any block below into your own file to apply the AI edits.
      </p>

      {summary && (
        <SuggestionBlock
          label="Summary"
          value={summary}
          id="sum"
          copied={copied}
          onCopy={copy}
        />
      )}

      {skills.length > 0 && (
        <SuggestionBlock
          label="Skills"
          value={skills.join(', ')}
          id="skills"
          copied={copied}
          onCopy={copy}
        />
      )}

      {bullets.length > 0 && (
        <SuggestionBlock
          label={`Rewritten bullets (${bullets.length})`}
          value={bullets.map((b) => `• ${b}`).join('\n')}
          id="bullets"
          copied={copied}
          onCopy={copy}
        />
      )}
    </div>
  );
}

function SuggestionBlock({
  label,
  value,
  id,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  id: string;
  copied: string | null;
  onCopy: (id: string, value: string) => void;
}) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#475569' }}>
          {label}
        </p>
        <button
          type="button"
          onClick={() => onCopy(id, value)}
          className="flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 rounded transition-colors"
          style={{
            background: copied === id ? '#dcfce7' : '#ede9fe',
            color: copied === id ? '#166534' : '#6d28d9',
            border: '1px solid ' + (copied === id ? '#86efac' : '#ddd6fe'),
          }}
        >
          {copied === id ? (
            <>
              <Check className="h-3 w-3" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              Copy
            </>
          )}
        </button>
      </div>
      <div
        className="text-[12.5px] leading-relaxed whitespace-pre-wrap rounded-md px-3 py-2"
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          color: '#1e293b',
          maxHeight: 260,
          overflowY: 'auto',
        }}
      >
        {value}
      </div>
    </div>
  );
}
