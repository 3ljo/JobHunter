'use client';
import GenericRenderer from './GenericRenderer';
import type { TemplateProps } from './types';

export default function TypewriterMono(props: TemplateProps) {
  return (
    <GenericRenderer
      {...props}
      theme={{
        primary: '#1a1a1a',
        accent: '#1a1a1a',
        fontFamily: "'Courier New','Courier',monospace",
        headerStyle: 'left',
        sectionStyle: 'rule',
        skillStyle: 'inline',
        baseSize: 13,
      }}
    />
  );
}
