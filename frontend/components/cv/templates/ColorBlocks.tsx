'use client';
import GenericRenderer from './GenericRenderer';
import type { TemplateProps } from './types';

export default function ColorBlocks(props: TemplateProps) {
  return (
    <GenericRenderer
      {...props}
      theme={{
        primary: '#4338ca',
        accent: '#a78bfa',
        fontFamily: "'Inter','Segoe UI',Arial,sans-serif",
        headerStyle: 'left',
        sectionStyle: 'block',
        skillStyle: 'pills',
      }}
    />
  );
}
