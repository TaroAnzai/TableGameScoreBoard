import i18n from '@/src/i18n/i18n';

beforeAll(async () => {
  await i18n.changeLanguage('ja');
});
