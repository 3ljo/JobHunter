'use client';
import GenericRenderer from './GenericRenderer';
import type { TemplateProps } from './types';

export default function KraftPaper(props: TemplateProps) {
  return (
    <GenericRenderer
      {...props}
      theme={{
        primary: '#3f2a14',
        accent: '#92400e',
        fontFamily: "'Courier New','Courier',monospace",
        headerStyle: 'centered',
        sectionStyle: 'plain',
        skillStyle: 'inline',
        bg: '#e8d8b0',
        text: '#3f2a14',
      }}
    />
  );
}
