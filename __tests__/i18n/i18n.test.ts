import { toSupportedLanguage } from '@/src/i18n/i18n';

describe('toSupportedLanguage', () => {
  it('keeps supported languages and maps Chinese to zh-CN', () => {
    expect(toSupportedLanguage('ja')).toBe('ja');
    expect(toSupportedLanguage('en')).toBe('en');
    expect(toSupportedLanguage('zh')).toBe('zh-CN');
  });

  it.each(['fr', null, undefined])('falls back to English for %s', (languageCode) => {
    expect(toSupportedLanguage(languageCode)).toBe('en');
  });
});
