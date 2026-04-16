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
    <div className="rounded-xl ring-1 ring-zinc-800 overflow-hidden">
      <Template cv={cv} photo={photo ?? null} />
    </div>
  );
}
