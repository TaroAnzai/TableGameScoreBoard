import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { View } from 'react-native';

import { SavedLinksPopover } from '@/components/SavedLinksPopover';

const mockPush = jest.fn();
const mockTouch = jest.fn();
const mockRemove = jest.fn();
let mockSavedLinksState: {
  savedLinks: Array<{
    type: 'tournament' | 'table';
    key: string;
    name: string;
    savedAt: string;
    lastOpenedAt: string;
    parentGroupName?: string;
    parentTournamentName?: string;
  }>;
  isLoading: boolean;
  isError: boolean;
  isRemoving: boolean;
};

jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
}));
jest.mock('@/src/hooks/useSavedLinks', () => ({
  useSavedLinks: () => ({
    ...mockSavedLinksState,
    touch: mockTouch,
    remove: mockRemove,
  }),
}));
jest.mock('@/components/ui/popover', () => {
  const React = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');

  return {
    Popover: View,
    PopoverContent: View,
    PopoverTrigger: React.forwardRef(
      ({ children }: { children?: React.ReactNode }, ref: React.ForwardedRef<unknown>) => (
        <View ref={ref}>{children}</View>
      ),
    ),
  };
});

describe('SavedLinksPopover', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTouch.mockResolvedValue(undefined);
    mockRemove.mockResolvedValue(undefined);
    mockSavedLinksState = {
      savedLinks: [
        {
          type: 'tournament',
          key: 'older-tournament',
          name: '古い大会',
          parentGroupName: 'グループ1',
          savedAt: '2026-08-20T00:00:00.000Z',
          lastOpenedAt: '2026-08-20T00:00:00.000Z',
        },
        {
          type: 'table',
          key: 'newer-table',
          name: '新しい卓',
          parentGroupName: 'グループ1',
          parentTournamentName: '大会1',
          savedAt: '2026-08-20T00:00:00.000Z',
          lastOpenedAt: '2026-08-21T00:00:00.000Z',
        },
      ],
      isLoading: false,
      isError: false,
      isRemoving: false,
    };
  });

  it('最終表示日時の降順で大会・卓を表示する', async () => {
    await render(<SavedLinksPopover trigger={<View />} />);

    const openButtons = screen
      .getAllByRole('button')
      .filter((button) => String(button.props.accessibilityLabel).endsWith('を開く'));
    expect(openButtons.map((button) => button.props.accessibilityLabel)).toEqual([
      '新しい卓を開く',
      '古い大会を開く',
    ]);
    expect(screen.getByText('大会')).toBeTruthy();
    expect(screen.getByText('卓')).toBeTruthy();
    expect(screen.getByText('グループ1 / 大会1')).toBeTruthy();
  });

  it('項目を開くと対象ページへ遷移し、最終表示日時を更新する', async () => {
    await render(<SavedLinksPopover trigger={<View />} />);

    fireEvent.press(screen.getByRole('button', { name: '新しい卓を開く' }));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/table/[tableKey]',
      params: { tableKey: 'newer-table' },
    });
    await waitFor(() =>
      expect(mockTouch).toHaveBeenCalledWith({ type: 'table', key: 'newer-table' }),
    );
  });

  it('保存項目を削除できる', async () => {
    await render(<SavedLinksPopover trigger={<View />} />);

    fireEvent.press(screen.getByRole('button', { name: '古い大会を削除' }));

    await waitFor(() =>
      expect(mockRemove).toHaveBeenCalledWith({ type: 'tournament', key: 'older-tournament' }),
    );
  });

  it('空状態を表示する', async () => {
    mockSavedLinksState = { ...mockSavedLinksState, savedLinks: [] };
    await render(<SavedLinksPopover trigger={<View />} />);

    expect(screen.getByText('保存済みの大会・卓はありません')).toBeTruthy();
  });
});
