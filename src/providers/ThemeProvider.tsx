import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme, View } from 'react-native';

import { createNativeWindTheme, type ThemeName, themes } from '@/src/lib/theme';

export type ThemeMode = 'system' | 'light' | 'dark';

type ThemeContextValue = {
  themeMode: ThemeMode;
  resolvedTheme: ThemeName;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
};

const THEME_MODE_STORAGE_KEY = 'themeMode';
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const isThemeMode = (value: string | null): value is ThemeMode => {
  return value === 'system' || value === 'light' || value === 'dark';
};

export const ThemeProvider = ({ children }: PropsWithChildren) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    let isMounted = true;

    void AsyncStorage.getItem(THEME_MODE_STORAGE_KEY)
      .then((storedMode) => {
        if (isMounted && isThemeMode(storedMode)) {
          setThemeModeState(storedMode);
        }
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, []);

  const resolvedTheme: ThemeName =
    themeMode === 'system' ? (systemColorScheme === 'dark' ? 'dark' : 'light') : themeMode;

  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await AsyncStorage.setItem(THEME_MODE_STORAGE_KEY, mode);
  }, []);

  const contextValue = useMemo(
    () => ({ themeMode, resolvedTheme, setThemeMode }),
    [resolvedTheme, setThemeMode, themeMode],
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      <View className="flex-1" style={createNativeWindTheme(themes[resolvedTheme])}>
        {children}
      </View>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
};
