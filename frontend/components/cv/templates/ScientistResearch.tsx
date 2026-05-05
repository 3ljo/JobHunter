'use client';
import GenericRenderer from './GenericRenderer';
import type { TemplateProps } from './types';

export default function ScientistResearch(props: TemplateProps) {
  return (
    <GenericRenderer
      {...props}
      theme={{
        primary: '#1e40af',
        accent: '#0ea5e9',
        fontFamily: "'IBM Plex Sans','Inter',sans-serif",
        headerStyle: 'left',
        sectionStyle: 'rule',
        skillStyle: 'pills',
        tagline: 'Research Scientist',
      }}
    />
  );
}
