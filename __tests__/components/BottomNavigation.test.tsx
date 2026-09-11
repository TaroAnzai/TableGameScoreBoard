import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { BottomNavigation } from '@/components/BottomNavigation';

const mockDismissTo = jest.fn();
const mockPush = jest.fn();
let mockPathname = '/';

jest.mock('expo-router', () => ({
  router: {
    dismissTo: (...args: unknown[]) => mockDismissTo(...args),
    push: (...args: unknown[]) => mockPush(...args),
  },
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

  it('ホームではホームを選択済みかつ無効として表示する', async () => {
    await render(<BottomNavigation />);

    expect(screen.getByRole('button', { name: 'ホーム' }).props.accessibilityState).toEqual({
      selected: true,
      disabled: true,
    });
    expect(screen.getByRole('button', { name: '保存済み' })).toBeTruthy();
  });

  it('通常画面からホームへは履歴を破棄し、統計と設定へは履歴を残して遷移する', async () => {
    mockPathname = '/table/table-key';
    await render(<BottomNavigation />);

    await fireEvent.press(screen.getByRole('button', { name: 'ホーム' }));
    await fireEvent.press(screen.getByRole('button', { name: '統計' }));
    await fireEvent.press(screen.getByRole('button', { name: '設定' }));

    expect(mockDismissTo).toHaveBeenCalledWith('/');
    expect(mockPush).toHaveBeenNthCalledWith(1, '/stats');
    expect(mockPush).toHaveBeenNthCalledWith(2, '/settings');
  });

  it.each([
    ['/stats', '統計'],
    ['/settings', '設定'],
  ])('%sでは統計と設定を無効にし、現在項目を選択状態にする', async (pathname, selectedLabel) => {
    mockPathname = pathname;
    await render(<BottomNavigation />);

    const stats = screen.getByLabelText('統計');
    const settings = screen.getByLabelText('設定');

    expect(stats.props.accessibilityState?.disabled).toBe(true);
    expect(settings.props.accessibilityState?.disabled).toBe(true);
    expect(screen.getByLabelText(selectedLabel).props.accessibilityState?.selected).toBe(true);

    await fireEvent.press(stats);
    await fireEvent.press(settings);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('設定画面からホームへは履歴を破棄して遷移する', async () => {
    mockPathname = '/settings';
    await render(<BottomNavigation />);

    await fireEvent.press(screen.getByRole('button', { name: 'ホーム' }));
    expect(mockDismissTo).toHaveBeenCalledWith('/');
  });
});
