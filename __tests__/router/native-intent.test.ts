import { redirectSystemPath } from '@/app/+native-intent';

describe('redirectSystemPath', () => {
  it.each([
    ['mahjongapp://group/group-key', '/group/group-key'],
    ['mahjongapp:///group/group-key', '/group/group-key'],
    ['mahjongapp-dev://group/group-key', '/group/group-key'],
    ['mahjongapp-dev:///group/group-key', '/group/group-key'],
    ['https://anzai-home.com/mahjong/group/group-key', '/group/group-key'],
  ])('converts %s to %s', (path, expected) => {
    expect(redirectSystemPath({ path, initial: true })).toBe(expected);
  });

  it.each([
    'mahjongapp://create?token=token',
    'mahjongapp-dev://create?token=token',
    'https://anzai-home.com/mahjong/group/create?token=token',
  ])(
    'preserves the create token for %s',
    (path) => {
      expect(redirectSystemPath({ path, initial: true })).toBe('/group/create?token=token');
    },
  );

  it.each([
    ['mahjongapp://table/table-key', '/table/table-key'],
    [
      'https://anzai-home.com/mahjong/tournament/tournament-key?view=summary',
      '/tournament/tournament-key?view=summary',
    ],
    [
      'https://anzai-home.com/mahjong/group/create?token=token',
      '/group/create?token=token',
    ],
  ])('marks a warm-start external link: %s', (path, expectedPrefix) => {
    expect(redirectSystemPath({ path, initial: false })).toMatch(
      new RegExp(`^${expectedPrefix.replace(/[?]/g, '\\?')}[&?]__externalEntry=\\d+-\\d+$`),
    );
  });

  it('変換できないDeep Linkは無効リンク画面へ送る', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(redirectSystemPath({ path: 'http://[invalid', initial: true })).toBe('/invalid-link');
    expect(consoleError).toHaveBeenCalled();

    consoleError.mockRestore();
  });
});
