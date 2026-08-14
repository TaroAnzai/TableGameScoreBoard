import { vars } from 'nativewind';

import type { SemanticColors } from './themes';

export const semanticColorVariables = {
  primary: '--ds-primary',
  onPrimary: '--ds-on-primary',
  primaryContainer: '--ds-primary-container',
  onPrimaryContainer: '--ds-on-primary-container',
  background: '--ds-background',
  surface: '--ds-surface',
  surfaceVariant: '--ds-surface-variant',
  onSurface: '--ds-on-surface',
  onSurfaceVariant: '--ds-on-surface-variant',
  outline: '--ds-outline',
  error: '--ds-error',
  onError: '--ds-on-error',
  success: '--ds-success',
  warning: '--ds-warning',
  disabled: '--ds-disabled',
  onDisabled: '--ds-on-disabled',
  scorePositive: '--ds-score-positive',
  scoreNegative: '--ds-score-negative',
  rank1: '--ds-rank-1',
  rank2: '--ds-rank-2',
  rank3: '--ds-rank-3',
  chip: '--ds-chip',
} as const satisfies Record<keyof SemanticColors, `--${string}`>;

export const createNativeWindTheme = (theme: SemanticColors) => {
  return vars(
    Object.fromEntries(
      Object.entries(semanticColorVariables).map(([role, variable]) => [
        variable,
        theme[role as keyof SemanticColors],
      ]),
    ),
  );
};
