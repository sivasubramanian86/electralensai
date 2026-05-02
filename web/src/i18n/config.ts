import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation bundles
import enTranslations from '../locales/en/translation.json';
import hiTranslations from '../locales/hi/translation.json';
import taTranslations from '../locales/ta/translation.json';
import teTranslations from '../locales/te/translation.json';
import knTranslations from '../locales/kn/translation.json';
import mlTranslations from '../locales/ml/translation.json';
import bnTranslations from '../locales/bn/translation.json';
import guTranslations from '../locales/gu/translation.json';
import mrTranslations from '../locales/mr/translation.json';
import esTranslations from '../locales/es/translation.json';
import frTranslations from '../locales/fr/translation.json';
import deTranslations from '../locales/de/translation.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      hi: { translation: hiTranslations },
      ta: { translation: taTranslations },
      te: { translation: teTranslations },
      kn: { translation: knTranslations },
      ml: { translation: mlTranslations },
      bn: { translation: bnTranslations },
      gu: { translation: guTranslations },
      mr: { translation: mrTranslations },
      es: { translation: esTranslations },
      fr: { translation: frTranslations },
      de: { translation: deTranslations },
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already safes from XSS
    },
    detection: {
      order: ['querystring', 'cookie', 'localStorage', 'sessionStorage', 'navigator', 'htmlTag', 'path', 'subdomain'],
      caches: ['localStorage', 'cookie'],
    }
  });

export default i18n;
