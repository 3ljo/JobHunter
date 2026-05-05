'use client';
import GenericRenderer from './GenericRenderer';
import type { TemplateProps } from './types';

export default function ConstructionTrades(props: TemplateProps) {
  return (
    <GenericRenderer
      {...props}
      theme={{
        primary: '#1f2937',
        accent: '#ea580c',
        fontFamily: "'Inter','Segoe UI',Arial,sans-serif",
        headerStyle: 'band',
        sectionStyle: 'tab',
        skillStyle: 'plain',
        tagline: 'Skilled Trades Professional',
      }}
    />
  );
}
