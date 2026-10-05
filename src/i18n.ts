import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import es from './locales/es.json';

const LANGUAGE_KEY = 'yodoku_language';

function getInitialLanguage(): 'en' | 'es' {
  try {
    const stored = localStorage.getItem(LANGUAGE_KEY);
    if (stored === 'en' || stored === 'es') return stored;
  } catch {
    // ignore localStorage errors
  }
  const nav = navigator.language?.toLowerCase();
  if (nav?.startsWith('es')) return 'es';
  return 'en';
}

export function setLanguage(lang: 'en' | 'es') {
  i18n.changeLanguage(lang);
  try {
    localStorage.setItem(LANGUAGE_KEY, lang);
  } catch {
    // ignore localStorage errors
  }
  document.documentElement.lang = lang;
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
    },
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

// Set initial HTML lang attribute
document.documentElement.lang = i18n.language;

export default i18n;