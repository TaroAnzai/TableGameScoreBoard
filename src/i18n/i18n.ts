import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './en.json';
import ja from './ja.json';
import zhCN from './zh-CN.json';

export type SupportedLanguage = 'ja' | 'en' | 'zh-CN';

export const toSupportedLanguage = (languageCode: string | null | undefined): SupportedLanguage => {
  if (languageCode === 'ja' || languageCode === 'zh') {
    return languageCode === 'zh' ? 'zh-CN' : languageCode;
  }

  return 'en';
};

// The default export is the configured i18next instance, not its named `use` export.
// eslint-disable-next-line import/no-named-as-default-member
i18n.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  resources: {
    ja: { translation: ja },
    en: { translation: en },
    'zh-CN': { translation: zhCN },
  },
  lng: toSupportedLanguage(getLocales()[0]?.languageCode),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
