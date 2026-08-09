export const colors = {
  primary: '#0B6B3A',
  onPrimary: '#FFFFFF',
  primaryContainer: '#D8F4E3',
  onPrimaryContainer: '#073B22',
  background: '#F7FAF7',
  surface: '#FFFFFF',
  surfaceVariant: '#EAF1EC',
  onSurface: '#17211B',
  onSurfaceVariant: '#5D6B62',
  outline: '#B8C7BD',
  error: '#BA1A1A',
  onError: '#FFFFFF',
  success: '#16834A',
  warning: '#B26A00',
  disabled: '#C9D1CB',
  onDisabled: '#7A847D',
  scorePositive: '#0B6B3A',
  scoreNegative: '#C2410C',
  rank1: '#B7791F',
  rank2: '#718096',
  rank3: '#A16207',
  chip: '#2563EB',
} as const;

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
} as const;

export const radius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
} as const;

export const typography = {
  screenTitle: { fontSize: 24, lineHeight: 32, fontWeight: '700' },
  sectionTitle: { fontSize: 20, lineHeight: 28, fontWeight: '700' },
  cardTitle: { fontSize: 17, lineHeight: 24, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  bodyStrong: { fontSize: 16, lineHeight: 24, fontWeight: '600' },
  bodySmall: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
  score: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  scoreSmall: { fontSize: 16, lineHeight: 22, fontWeight: '700' },
  rank: { fontSize: 18, lineHeight: 24, fontWeight: '700' },
  tableHeader: { fontSize: 13, lineHeight: 18, fontWeight: '700' },
} as const;

export const iconSize = {
  inline: 16,
  button: 20,
  iconButton: 24,
  emptyStateMin: 40,
  emptyStateMax: 48,
  rankStatusMin: 16,
  rankStatusMax: 20,
} as const;

export const componentSize = {
  buttonHeight: 48,
  buttonHeightSmall: 40,
  inputHeight: 48,
  iconButtonSize: 40,
  iconButtonTapTarget: 48,
  listRowMinHeight: 56,
  tableRowMinHeight: 44,
  dialogMaxWidth: 560,
} as const;

export const mahjong = {
  scoreCellWidth: 70, //Score column width in Tournament table
  scoreCellMinWidth: 70,
  gameColumnWidth: 70, //Game index column width in Table table
  playerColumnWidth: 85, //Player name column width in Tournament table
  totalColumnWidth: 104,
  tableHeaderHeight: 44,
  scoreInputHeight: 40,
} as const;

export const tokens = {
  colors,
  spacing,
  radius,
  typography,
  iconSize,
  componentSize,
  mahjong,
} as const;
