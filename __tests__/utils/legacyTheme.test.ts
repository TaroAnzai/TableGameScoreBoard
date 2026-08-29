import { NAV_THEME, THEME } from '@/lib/theme';

describe('legacy navigation theme', () => {
  it.each(['light', 'dark'] as const)('%sテーマの主要色をnavigation themeへ対応付ける', (mode) => {
    expect(NAV_THEME[mode].colors).toEqual(
      expect.objectContaining({
        background: THEME[mode].background,
        border: THEME[mode].border,
        card: THEME[mode].card,
        notification: THEME[mode].destructive,
        primary: THEME[mode].primary,
        text: THEME[mode].foreground,
      }),
    );
  });

  it('lightとdarkで背景・前景・チャート色を分離する', () => {
    expect(THEME.light.background).not.toBe(THEME.dark.background);
    expect(THEME.light.foreground).not.toBe(THEME.dark.foreground);
    expect(THEME.light.chart1).not.toBe(THEME.dark.chart1);
  });
});
