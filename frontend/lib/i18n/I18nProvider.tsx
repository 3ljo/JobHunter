'use client';

import { useEffect } from 'react';
import { I18nextProvider, useTranslation } from 'react-i18next';
import i18n, { SUPPORTED_LANGUAGES } from './config';

function HtmlLangSync() {
  const { i18n: i18nInstance } = useTranslation();

  useEffect(() => {
    const apply = (lng: string) => {
      const base = lng.split('-')[0];
      const meta =
        SUPPORTED_LANGUAGES.find((l) => l.code === lng) ??
        SUPPORTED_LANGUAGES.find((l) => l.code.split('-')[0] === base);
      document.documentElement.lang = meta?.code ?? 'en';
      document.documentElement.dir = meta && 'rtl' in meta && meta.rtl ? 'rtl' : 'ltr';
    };
    apply(i18nInstance.language);
    i18nInstance.on('languageChanged', apply);
    return () => { i18nInstance.off('languageChanged', apply); };
  }, [i18nInstance]);

  return null;
}

export default function I18nProvider({ children }: { children: React.ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <HtmlLangSync />
      {children}
    </I18nextProvider>
  );
}
