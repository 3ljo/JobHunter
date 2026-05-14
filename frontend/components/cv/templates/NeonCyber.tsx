'use client';
import GenericRenderer from './GenericRenderer';
import type { TemplateProps } from './types';

export default function NeonCyber(props: TemplateProps) {
  return (
    <GenericRenderer
      {...props}
      theme={{
        primary: '#581c87',
        accent: '#06b6d4',
        fontFamily: "'JetBrains Mono','SF Mono',Consolas,monospace",
        headerStyle: 'band',
        sectionStyle: 'block',
        skillStyle: 'pills',
        baseSize: 13,
      }}
    />
  );
}
