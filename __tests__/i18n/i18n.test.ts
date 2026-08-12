import { toSupportedLanguage } from '@/src/i18n/i18n';

describe('toSupportedLanguage', () => {
  it('keeps supported Japanese and English language codes', () => {
    expect(toSupportedLanguage('ja')).toBe('ja');
    expect(toSupportedLanguage('en')).toBe('en');
  });

  it.each(['fr', 'zh', null, undefined])('falls back to English for %s', (languageCode) => {
    expect(toSupportedLanguage(languageCode)).toBe('en');
  });
});
