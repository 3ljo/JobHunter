'use client';

import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TEMPLATE_COMPONENTS, DEFAULT_TEMPLATE, type TemplateId } from './templates';

interface CVPreviewProps {
  cv: any;
  template?: TemplateId;
  photo?: string | null;
}

export default function CVPreview({ cv, template, photo }: CVPreviewProps) {
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

  const scrollByPage = (dir: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    const page = el.clientWidth * 0.9 * dir;
    el.scrollBy({ left: page, behavior: 'smooth' });
  };

  return (
    <div style={{ position: 'relative' }}>
      <div
        ref={scrollRef}
        style={{
          overflowX: 'auto',
          overflowY: 'hidden',
          WebkitOverflowScrolling: 'touch',
          scrollSnapType: 'x proximity',
          height: 'min(calc(100vh - 240px), 860px)',
          minHeight: 460,
          background: '#ffffff',
          borderRadius: 12,
        }}
      >
        <div
          style={{
            height: '100%',
            columnWidth: 'min(88vw, 620px)',
            columnGap: 24,
            columnFill: 'auto',
            columnRule: '1px dashed #e5e7eb',
          }}
        >
          <Template cv={cv} photo={photo ?? null} />
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
