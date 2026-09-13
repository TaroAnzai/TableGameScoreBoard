import { redirectSystemPath } from '@/app/+native-intent';
import {
  isExternalNavigationBlocked,
  registerExternalNavigationBlock,
} from '@/src/utils/externalNavigationGuard';

describe('redirectSystemPath external navigation guard', () => {
  it('block中の非初回Deep Linkを破棄し、解除後の新しいリンクだけを処理する', () => {
    const unblock = registerExternalNavigationBlock();
    expect(isExternalNavigationBlocked()).toBe(true);
    expect(
      redirectSystemPath({ path: 'mahjongapp://tournament/blocked-key', initial: false }),
    ).toBeNull();

    unblock();
    expect(isExternalNavigationBlocked()).toBe(false);
    expect(redirectSystemPath({ path: 'mahjongapp://tournament/new-key', initial: false })).toMatch(
      /^\/tournament\/new-key\?__externalEntry=\d+-\d+$/,
    );
  });

  it('block中でも初回Deep Linkは処理する', () => {
    const unblock = registerExternalNavigationBlock();
    expect(redirectSystemPath({ path: 'mahjongapp://group/group-key', initial: true })).toBe(
      '/group/group-key',
    );
    unblock();
  });
});
