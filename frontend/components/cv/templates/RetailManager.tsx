'use client';
import GenericRenderer from './GenericRenderer';
import type { TemplateProps } from './types';

export default function RetailManager(props: TemplateProps) {
  return (
    <GenericRenderer
      {...props}
      theme={{
        primary: '#7c2d12',
        accent: '#f59e0b',
        fontFamily: "'Inter','Segoe UI',Arial,sans-serif",
        headerStyle: 'centered',
        sectionStyle: 'rule',
        skillStyle: 'plain',
        tagline: 'Retail · Operations',
      }}
    />
  );
}
