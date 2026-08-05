import type { PropsWithChildren } from 'react';
import { View } from 'react-native';
import { useColorScheme } from 'nativewind';

import { createNativeWindTheme, themes, type ThemeName } from '@/src/lib/theme';

type ThemeProviderProps = PropsWithChildren<{
  /** Override for previews/tests. The app remains light-first by configuration. */
  theme?: ThemeName;
}>;

export function ThemeProvider({ children, theme }: ThemeProviderProps) {
  const { colorScheme } = useColorScheme();
  const resolvedTheme = theme ?? (colorScheme === 'dark' ? 'dark' : 'light');

  return (
    <View className="flex-1" style={createNativeWindTheme(themes[resolvedTheme])}>
      {children}
    </View>
  );
}
