'use client';
import GenericRenderer from './GenericRenderer';
import type { TemplateProps } from './types';

export default function LogisticsSupply(props: TemplateProps) {
  return (
    <GenericRenderer
      {...props}
      theme={{
        primary: '#1e3a8a',
        accent: '#64748b',
        fontFamily: "'Inter','Segoe UI',Arial,sans-serif",
        headerStyle: 'left',
        sectionStyle: 'rule',
        skillStyle: 'inline',
        tagline: 'Supply Chain · Operations',
      }}
    />
  );
}
