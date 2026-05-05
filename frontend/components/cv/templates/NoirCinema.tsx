'use client';
import GenericRenderer from './GenericRenderer';
import type { TemplateProps } from './types';

export default function NoirCinema(props: TemplateProps) {
  return (
    <GenericRenderer
      {...props}
      theme={{
        primary: '#18181b',
        accent: '#ef4444',
        fontFamily: "'Inter','Segoe UI',Arial,sans-serif",
        headerStyle: 'band',
        sectionStyle: 'tab',
        skillStyle: 'pills',
      }}
    />
  );
}
