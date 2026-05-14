'use client';
import GenericRenderer from './GenericRenderer';
import type { TemplateProps } from './types';

export default function JournalistEditorial(props: TemplateProps) {
  return (
    <GenericRenderer
      {...props}
      theme={{
        primary: '#0a0a0a',
        accent: '#0a0a0a',
        fontFamily: "'Georgia','Times New Roman',serif",
        headerStyle: 'centered',
        sectionStyle: 'rule',
        skillStyle: 'inline',
        tagline: 'Reporter · Writer · Editor',
      }}
    />
  );
}
