'use client';
import GenericRenderer from './GenericRenderer';
import type { TemplateProps } from './types';

export default function NonprofitMission(props: TemplateProps) {
  return (
    <GenericRenderer
      {...props}
      theme={{
        primary: '#365314',
        accent: '#84cc16',
        fontFamily: "'Inter','Segoe UI',Arial,sans-serif",
        headerStyle: 'centered',
        sectionStyle: 'plain',
        skillStyle: 'pills',
        tagline: 'Mission-Driven Professional',
      }}
    />
  );
}
