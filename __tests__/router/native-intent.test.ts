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

  it.each(['mahjongapp://create?token=token', 'mahjongapp-dev://create?token=token'])(
    'preserves the create token for %s',
    (path) => {
      expect(redirectSystemPath({ path, initial: true })).toBe('/group/create?token=token');
    },
  );
});
