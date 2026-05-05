'use client';
import GenericRenderer from './GenericRenderer';
import type { TemplateProps } from './types';

export default function PastelSoft(props: TemplateProps) {
  return (
    <GenericRenderer
      {...props}
      theme={{
        primary: '#86198f',
        accent: '#f0abfc',
        fontFamily: "'Inter','Segoe UI',Arial,sans-serif",
        headerStyle: 'left',
        sectionStyle: 'plain',
        skillStyle: 'pills',
        bg: '#fdf4ff',
      }}
    />
  );
}
