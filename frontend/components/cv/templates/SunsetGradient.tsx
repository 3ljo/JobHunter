'use client';
import GenericRenderer from './GenericRenderer';
import type { TemplateProps } from './types';

export default function SunsetGradient(props: TemplateProps) {
  return (
    <GenericRenderer
      {...props}
      theme={{
        primary: '#9a3412',
        accent: '#fbbf24',
        fontFamily: "'Inter','Segoe UI',Arial,sans-serif",
        headerStyle: 'band',
        sectionStyle: 'rule',
        skillStyle: 'pills',
        bg: '#fff7ed',
      }}
    />
  );
}
