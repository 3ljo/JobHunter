'use client';
import GenericRenderer from './GenericRenderer';
import type { TemplateProps } from './types';

export default function EducationTeacher(props: TemplateProps) {
  return (
    <GenericRenderer
      {...props}
      theme={{
        primary: '#15803d',
        accent: '#f59e0b',
        fontFamily: "'Inter','Segoe UI',Arial,sans-serif",
        headerStyle: 'left',
        sectionStyle: 'rule',
        skillStyle: 'pills',
        tagline: 'Educator',
      }}
    />
  );
}
