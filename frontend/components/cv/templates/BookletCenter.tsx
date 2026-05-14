'use client';
import GenericRenderer from './GenericRenderer';
import type { TemplateProps } from './types';

export default function BookletCenter(props: TemplateProps) {
  return (
    <GenericRenderer
      {...props}
      theme={{
        primary: '#0f172a',
        accent: '#475569',
        fontFamily: "'Crimson Pro','Georgia',serif",
        headerStyle: 'centered',
        sectionStyle: 'plain',
        skillStyle: 'inline',
        baseSize: 14,
      }}
    />
  );
}
