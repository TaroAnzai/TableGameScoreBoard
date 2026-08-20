import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { BottomNavigation } from '@/components/BottomNavigation';

const mockReplace = jest.fn();
let mockPathname = '/';

jest.mock('expo-router', () => ({
  router: { replace: (...args: unknown[]) => mockReplace(...args) },
  usePathname: () => mockPathname,
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 0 }),
}));
jest.mock('@/components/SavedLinksPopover', () => {
  const { View } = jest.requireActual('react-native');
  return {
    SavedLinksPopover: ({ trigger }: { trigger: React.ReactNode }) => <View>{trigger}</View>,
  };
});

describe('BottomNavigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname = '/';
  });

  it('主要な3操作をアクセシブルに表示し、ホームへ遷移できる', async () => {
    await render(<BottomNavigation />);

    expect(screen.getByRole('button', { name: 'ホーム' }).props.accessibilityState?.selected).toBe(true);
    expect(screen.getByRole('button', { name: '保存済み' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '設定' })).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'ホーム' }));
    expect(mockReplace).toHaveBeenCalledWith('/');
  });

  it('設定画面では設定項目を選択状態にする', async () => {
    mockPathname = '/settings';
    await render(<BottomNavigation />);

    const settings = screen.getByRole('button', { name: '設定' });
    expect(settings.props.accessibilityState?.selected).toBe(true);

    fireEvent.press(settings);
    expect(mockReplace).toHaveBeenCalledWith('/settings');
  });
});
