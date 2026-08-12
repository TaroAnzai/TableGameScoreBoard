import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocales } from 'expo-localization';
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import i18n, { type SupportedLanguage, toSupportedLanguage } from '@/src/i18n/i18n';

export type LanguageMode = 'system' | SupportedLanguage;

type LanguageContextValue = {
  languageMode: LanguageMode;
  resolvedLanguage: SupportedLanguage;
  setLanguageMode: (mode: LanguageMode) => Promise<void>;
};

const LANGUAGE_MODE_STORAGE_KEY = 'languageMode';
const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const isLanguageMode = (value: string | null): value is LanguageMode => {
  return value === 'system' || value === 'ja' || value === 'en';
};

export const LanguageProvider = ({ children }: PropsWithChildren) => {
  const locales = useLocales();
  const systemLanguage = toSupportedLanguage(locales[0]?.languageCode);
  const [languageMode, setLanguageModeState] = useState<LanguageMode>('system');

  useEffect(() => {
    let isMounted = true;

    void AsyncStorage.getItem(LANGUAGE_MODE_STORAGE_KEY)
      .then((storedMode) => {
        if (isMounted && isLanguageMode(storedMode)) {
          setLanguageModeState(storedMode);
        }
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, []);

  const resolvedLanguage = languageMode === 'system' ? systemLanguage : languageMode;

  useEffect(() => {
    if (i18n.resolvedLanguage !== resolvedLanguage) {
      void i18n.changeLanguage(resolvedLanguage);
    }
  }, [resolvedLanguage]);

  const setLanguageMode = useCallback(async (mode: LanguageMode) => {
    await AsyncStorage.setItem(LANGUAGE_MODE_STORAGE_KEY, mode);
    setLanguageModeState(mode);
  }, []);

  const contextValue = useMemo(
    () => ({ languageMode, resolvedLanguage, setLanguageMode }),
    [languageMode, resolvedLanguage, setLanguageMode],
  );

  return <LanguageContext.Provider value={contextValue}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }

  return context;
};
