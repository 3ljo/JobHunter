'use client';
import GenericRenderer from './GenericRenderer';
import type { TemplateProps } from './types';

export default function FinanceAnalyst(props: TemplateProps) {
  return (
    <GenericRenderer
      {...props}
      theme={{
        primary: '#064e3b',
        accent: '#10b981',
        fontFamily: "'Inter','Segoe UI',Arial,sans-serif",
        headerStyle: 'band',
        sectionStyle: 'rule',
        skillStyle: 'pills',
        tagline: 'Finance · Analytics',
      }}
    />
  );
}
