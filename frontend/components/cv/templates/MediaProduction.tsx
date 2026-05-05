'use client';
import GenericRenderer from './GenericRenderer';
import type { TemplateProps } from './types';

export default function MediaProduction(props: TemplateProps) {
  return (
    <GenericRenderer
      {...props}
      theme={{
        primary: '#27272a',
        accent: '#f43f5e',
        fontFamily: "'Inter','Segoe UI',Arial,sans-serif",
        headerStyle: 'band',
        sectionStyle: 'tab',
        skillStyle: 'pills',
        tagline: 'Production · Media',
      }}
    />
  );
}
