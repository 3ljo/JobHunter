'use client';

import { TEMPLATE_COMPONENTS, DEFAULT_TEMPLATE, type TemplateId } from './templates';

interface CVPreviewProps {
  cv: any;
  template?: TemplateId;
  photo?: string | null;
}

export default function CVPreview({ cv, template, photo }: CVPreviewProps) {
  if (!cv) return null;

  const active: TemplateId = (template && TEMPLATE_COMPONENTS[template]) ? template : DEFAULT_TEMPLATE;
  const Template = TEMPLATE_COMPONENTS[active];

  return (
    <div className="cv-preview-scroller">
      <div className="cv-preview-pages">
        <Template cv={cv} photo={photo ?? null} />
      </div>

      <style jsx>{`
        .cv-preview-scroller {
          overflow-x: auto;
          overflow-y: hidden;
          scroll-snap-type: x proximity;
          -webkit-overflow-scrolling: touch;
          height: clamp(520px, calc(100vh - 280px), 880px);
          background: #ffffff;
          border-radius: 12px;
        }
        .cv-preview-pages {
          height: 100%;
          column-width: 620px;
          column-gap: 28px;
          column-fill: auto;
          column-rule: 1px dashed #e5e7eb;
          padding: 0;
        }
        .cv-preview-pages > :global(*) {
          scroll-snap-align: start;
        }
        @media (max-width: 640px) {
          .cv-preview-scroller {
            height: clamp(460px, calc(100vh - 340px), 760px);
          }
          .cv-preview-pages {
            column-width: 88vw;
            column-gap: 18px;
          }
        }
      `}</style>
    </div>
  );
}
