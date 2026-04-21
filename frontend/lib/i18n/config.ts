'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import de from './locales/de.json';
import fr from './locales/fr.json';
import es from './locales/es.json';
import it from './locales/it.json';
import pt from './locales/pt.json';
import sq from './locales/sq.json';
import tr from './locales/tr.json';
import ar from './locales/ar.json';
import zhCN from './locales/zh-CN.json';
import ru from './locales/ru.json';
import ja from './locales/ja.json';
import nl from './locales/nl.json';
import pl from './locales/pl.json';
import hi from './locales/hi.json';

export const SUPPORTED_LANGUAGES = [
  { code: 'en',    name: 'English',              nativeName: 'English',    flag: '🇬🇧' },
  { code: 'de',    name: 'German',               nativeName: 'Deutsch',    flag: '🇩🇪' },
  { code: 'fr',    name: 'French',               nativeName: 'Français',   flag: '🇫🇷' },
  { code: 'es',    name: 'Spanish',              nativeName: 'Español',    flag: '🇪🇸' },
  { code: 'it',    name: 'Italian',              nativeName: 'Italiano',   flag: '🇮🇹' },
  { code: 'pt',    name: 'Portuguese',           nativeName: 'Português',  flag: '🇵🇹' },
  { code: 'nl',    name: 'Dutch',                nativeName: 'Nederlands', flag: '🇳🇱' },
  { code: 'pl',    name: 'Polish',               nativeName: 'Polski',     flag: '🇵🇱' },
  { code: 'sq',    name: 'Albanian',             nativeName: 'Shqip',      flag: '🇦🇱' },
  { code: 'tr',    name: 'Turkish',              nativeName: 'Türkçe',     flag: '🇹🇷' },
  { code: 'ru',    name: 'Russian',              nativeName: 'Русский',    flag: '🇷🇺' },
  { code: 'ar',    name: 'Arabic',               nativeName: 'العربية',    flag: '🇸🇦', rtl: true },
  { code: 'hi',    name: 'Hindi',                nativeName: 'हिन्दी',     flag: '🇮🇳' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文',    flag: '🇨🇳' },
  { code: 'ja',    name: 'Japanese',             nativeName: '日本語',      flag: '🇯🇵' },
] as const;

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]['code'];

export const STORAGE_KEY = 'jh_lang';

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        en:      { translation: en },
        de:      { translation: de },
        fr:      { translation: fr },
        es:      { translation: es },
        it:      { translation: it },
        pt:      { translation: pt },
        sq:      { translation: sq },
        tr:      { translation: tr },
        ar:      { translation: ar },
        'zh-CN': { translation: zhCN },
        ru:      { translation: ru },
        ja:      { translation: ja },
        nl:      { translation: nl },
        pl:      { translation: pl },
        hi:      { translation: hi },
      },
      fallbackLng: 'en',
      supportedLngs: SUPPORTED_LANGUAGES.map((l) => l.code),
      nonExplicitSupportedLngs: true,
      interpolation: { escapeValue: false },
      detection: {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage'],
        lookupLocalStorage: STORAGE_KEY,
      },
      react: { useSuspense: false },
    });
}

export default i18n;
