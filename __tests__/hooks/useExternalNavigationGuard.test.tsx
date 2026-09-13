import { renderHook } from '@testing-library/react-native';

import { useExternalNavigationGuard } from '@/src/hooks/useExternalNavigationGuard';
import { isExternalNavigationBlocked } from '@/src/utils/externalNavigationGuard';

jest.mock('expo-router', () => ({
  useFocusEffect: (effect: () => void | (() => void)) => {
    const React = jest.requireActual('react');
    React.useEffect(effect, [effect]);
  },
}));

describe('useExternalNavigationGuard', () => {
  it('有効化、解除、unmountに合わせてblock状態を更新する', async () => {
    const { rerender, unmount } = await renderHook(
      ({ blocked }: { blocked: boolean }) => useExternalNavigationGuard(blocked),
      { initialProps: { blocked: false } },
    );
    expect(isExternalNavigationBlocked()).toBe(false);

    await rerender({ blocked: true });
    expect(isExternalNavigationBlocked()).toBe(true);

    await rerender({ blocked: false });
    expect(isExternalNavigationBlocked()).toBe(false);

    await rerender({ blocked: true });
    await unmount();
    expect(isExternalNavigationBlocked()).toBe(false);
  });

  it('複数要因の一方が解除されてもblockを維持する', async () => {
    const first = await renderHook(() => useExternalNavigationGuard(true));
    const second = await renderHook(() => useExternalNavigationGuard(true));
    expect(isExternalNavigationBlocked()).toBe(true);

    await first.unmount();
    expect(isExternalNavigationBlocked()).toBe(true);

    await second.unmount();
    expect(isExternalNavigationBlocked()).toBe(false);
  });
});
