'use client';

import type { CVCertification, CVEducation } from './types';
import { certIssuer, certYear, certUrl, eduLocation } from './types';

type SubColor = 'gray-700' | 'gray-600' | 'gray-500' | 'gray-400' | 'white-70';

const subColorStyle: Record<SubColor, React.CSSProperties> = {
  'gray-700': { color: '#374151' },
  'gray-600': { color: '#4b5563' },
  'gray-500': { color: '#6b7280' },
  'gray-400': { color: '#9ca3af' },
  'white-70': { color: 'rgba(255,255,255,0.7)' },
};

const linkColorStyle: Record<SubColor, React.CSSProperties> = {
  'gray-700': { color: '#1d4ed8' },
  'gray-600': { color: '#1d4ed8' },
  'gray-500': { color: '#1d4ed8' },
  'gray-400': { color: '#60a5fa' },
  'white-70': { color: '#93c5fd' },
};

export function EduExtras({
  e,
  subSize = 12,
  subColor = 'gray-600',
}: {
  e: CVEducation;
  subSize?: number;
  subColor?: SubColor;
}) {
  const loc = eduLocation(e);
  if (!loc && !e.url) return null;
  return (
    <>
      {loc && (
        <p style={{ ...subColorStyle[subColor], fontSize: subSize, lineHeight: 1.4 }}>{loc}</p>
      )}
      {e.url && (
        <p
          className="break-all"
          style={{ fontSize: subSize, lineHeight: 1.4, wordBreak: 'break-all' }}
        >
          <a
            href={e.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
            style={linkColorStyle[subColor]}
          >
            {e.url}
          </a>
        </p>
      )}
    </>
  );
}

export function CertExtras({
  cert,
  subSize = 12,
  subColor = 'gray-600',
  showMeta = true,
}: {
  cert: string | CVCertification;
  subSize?: number;
  subColor?: SubColor;
  showMeta?: boolean;
}) {
  const issuer = certIssuer(cert);
  const year = certYear(cert);
  const url = certUrl(cert);
  const meta = [issuer, year].filter(Boolean).join(' · ');
  if (!url && !(showMeta && meta)) return null;
  return (
    <>
      {showMeta && meta && (
        <p style={{ ...subColorStyle[subColor], fontSize: subSize, lineHeight: 1.4 }}>{meta}</p>
      )}
      {url && (
        <p
          className="break-all"
          style={{ fontSize: subSize, lineHeight: 1.4, wordBreak: 'break-all' }}
        >
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
            style={linkColorStyle[subColor]}
          >
            {url}
          </a>
        </p>
      )}
    </>
  );
}
