import { colors } from './tokens';

export type SemanticColors = { [Role in keyof typeof colors]: string };

export const lightTheme = { ...colors } satisfies SemanticColors;

/**
 * Design System v1 only defines the first twelve dark roles. The remaining
 * roles intentionally inherit their light values and are provisional until a
 * later design-system revision defines them.
 */
export const darkTheme = {
  ...lightTheme,
  primary: '#8DD8AA',
  onPrimary: '#003919',
  primaryContainer: '#0F5130',
  onPrimaryContainer: '#D8F4E3',
  background: '#101511',
  surface: '#18201A',
  surfaceVariant: '#26342B',
  onSurface: '#EDF4EE',
  onSurfaceVariant: '#BFCBC2',
  outline: '#4C5B51',
  error: '#BA1A1A',
  onError: '#FFFFFF',
} as const satisfies SemanticColors;

export const provisionalDarkRoles = [
  'success',
  'warning',
  'disabled',
  'onDisabled',
  'scorePositive',
  'scoreNegative',
  'rank1',
  'rank2',
  'rank3',
  'chip',
] as const satisfies readonly (keyof SemanticColors)[];

export const themes = {
  light: lightTheme,
  dark: darkTheme,
} as const;

export type ThemeName = keyof typeof themes;
