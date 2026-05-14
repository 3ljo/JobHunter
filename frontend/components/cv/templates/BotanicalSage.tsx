'use client';
import GenericRenderer from './GenericRenderer';
import type { TemplateProps } from './types';

export default function BotanicalSage(props: TemplateProps) {
  return (
    <GenericRenderer
      {...props}
      theme={{
        primary: '#3f6212',
        accent: '#a3a380',
        fontFamily: "'Cormorant Garamond','Georgia',serif",
        headerStyle: 'centered',
        sectionStyle: 'plain',
        skillStyle: 'pills',
        bg: '#f7f8f3',
        baseSize: 14,
      }}
    />
  );
}
