import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './en.json';
import ja from './ja.json';

export type SupportedLanguage = 'ja' | 'en';

export const toSupportedLanguage = (languageCode: string | null | undefined): SupportedLanguage => {
  return languageCode === 'ja' ? 'ja' : 'en';
};

// The default export is the configured i18next instance, not its named `use` export.
// eslint-disable-next-line import/no-named-as-default-member
i18n.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  resources: {
    ja: { translation: ja },
    en: { translation: en },
  },
  lng: toSupportedLanguage(getLocales()[0]?.languageCode),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
