'use client';

import { useEffect, useRef, useState } from 'react';
import { previewCVPdf } from '@/lib/api';
import { TEMPLATE_COMPONENTS, DEFAULT_TEMPLATE, type TemplateId } from './templates';

interface CVPreviewProps {
  cv: any;
  template?: TemplateId;
  photo?: string | null;
  /** Data URL of the originally uploaded PDF — used when template === 'original'. */
  originalPdfDataUrl?: string | null;
  /** The cv_record_id on the server — used to fetch a rendered PDF preview per template. */
  cvRecordId?: string | null;
}

export default function CVPreview({
  cv,
  template,
  photo,
  originalPdfDataUrl,
  cvRecordId,
}: CVPreviewProps) {
  const active: TemplateId =
    template && TEMPLATE_COMPONENTS[template] ? template : DEFAULT_TEMPLATE;

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastUrlRef = useRef<string | null>(null);

  // Fetch a server-rendered PDF for non-"original" templates.
  // Refetch whenever template, photo, or the finalCV changes (e.g. after Quick Edit).
  useEffect(() => {
    if (active === 'original') {
      // Clean up any lingering template blob so switching back/forth is instant.
      if (lastUrlRef.current) {
        URL.revokeObjectURL(lastUrlRef.current);
        lastUrlRef.current = null;
      }
      setPdfUrl(null);
      setError(null);
      return;
    }
    if (!cvRecordId) {
      setPdfUrl(null);
      return;
    }

    let cancelled = false;
    setFetching(true);
    setError(null);

    previewCVPdf(cvRecordId, { template: active, photo: photo ?? null })
      .then((url) => {
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        if (lastUrlRef.current) URL.revokeObjectURL(lastUrlRef.current);
        lastUrlRef.current = url;
        setPdfUrl(url);
      })
      .catch(() => {
        if (!cancelled) setError('Could not render the PDF preview. Try again.');
      })
      .finally(() => {
        if (!cancelled) setFetching(false);
      });

    return () => {
      cancelled = true;
    };
    // Re-run when any of these change. `cv` is a proxy for "the structured data
    // was refined" — we rely on refineCV having already persisted it server-side.
  }, [active, cvRecordId, photo, cv]);

  // Revoke on unmount
  useEffect(() => {
    return () => {
      if (lastUrlRef.current) {
        URL.revokeObjectURL(lastUrlRef.current);
        lastUrlRef.current = null;
      }
    };
  }, []);

  if (!cv) return null;

  const iframeHeight = 'min(calc(100vh - 180px), 900px)';

  // "original" template: show the user's uploaded PDF directly in an iframe.
  if (active === 'original') {
    if (originalPdfDataUrl) {
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

  // Non-"original" templates: server-rendered PDF in an iframe, same UX as Keep My Own.
  return (
    <div style={{ background: '#ffffff', position: 'relative' }}>
      {pdfUrl ? (
        <iframe
          src={pdfUrl}
          title="CV preview"
          className="w-full block bg-white"
          style={{ height: iframeHeight, border: 'none' }}
        />
      ) : (
        <div
          className="flex flex-col items-center justify-center gap-3"
          style={{ height: iframeHeight, background: '#f8fafc' }}
        >
          {error ? (
            <p className="text-sm" style={{ color: '#b91c1c' }}>
              {error}
            </p>
          ) : (
            <>
              <span className="lds-roller-sm" style={{ color: '#7c3aed' }}>
                <span /><span /><span /><span /><span /><span /><span /><span />
              </span>
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#64748b' }}>
                Rendering {active}…
              </p>
            </>
          )}
        </div>
      )}

      {/* Subtle overlay spinner while refetching over an existing preview (template switch) */}
      {fetching && pdfUrl && (
        <div
          className="absolute top-3 right-3 flex items-center gap-2 px-3 py-1.5 rounded-lg pointer-events-none"
          style={{
            background: 'rgba(15,10,40,0.85)',
            backdropFilter: 'blur(6px)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <span className="lds-roller-sm" style={{ color: '#c4b5fd' }}>
            <span /><span /><span /><span /><span /><span /><span /><span />
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#e9d5ff' }}>
            Rendering
          </span>
        </div>
      )}
    </div>
  );
}
