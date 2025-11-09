import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en/translation.json';
import fa from './locales/fa/translation.json';

export const DIR_MAP: Record<string, 'ltr' | 'rtl'> = {
  en: 'ltr',
  fa: 'rtl'
};

const resources = {
  en: { translation: en },
  fa: { translation: fa }
} as const;

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export const applyDirection = (lng: string) => {
  const dir = DIR_MAP[lng] ?? 'ltr';
  const root = document.documentElement;
  root.setAttribute('dir', dir);
  root.setAttribute('lang', lng);
  if (dir === 'rtl') {
    root.classList.add('rtl');
  } else {
    root.classList.remove('rtl');
  }
};

i18n.on('languageChanged', applyDirection);

if (typeof window !== 'undefined') {
  applyDirection(i18n.language);
}

export default i18n;
