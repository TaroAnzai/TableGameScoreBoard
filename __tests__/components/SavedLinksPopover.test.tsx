import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { View } from 'react-native';

import { SavedLinksPopover } from '@/components/SavedLinksPopover';

const mockPush = jest.fn();
const mockTouch = jest.fn();
const mockRemove = jest.fn();
const mockClosePopover = jest.fn();
const mockAlertDialog = jest.fn(() => Promise.resolve(true));
let mockPathname = '/';
let mockSavedLinksState: {
  savedLinks: {
    type: 'tournament' | 'table';
    key: string;
    name: string;
    savedAt: string;
    lastOpenedAt: string;
    parentGroupName?: string;
    parentTournamentName?: string;
    accessLevel?: 'VIEW' | 'EDIT' | 'OWNER';
  }[];
  isLoading: boolean;
  isError: boolean;
  isRemoving: boolean;
};

jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
  usePathname: () => mockPathname,
}));
jest.mock('@/src/hooks/useSavedLinks', () => ({
  useSavedLinks: () => ({
    ...mockSavedLinksState,
    touch: mockTouch,
    remove: mockRemove,
  }),
}));
jest.mock('@/components/common/AlertDialogProvider', () => ({
  useAlertDialog: () => ({ alertDialog: mockAlertDialog }),
}));
jest.mock('@/components/ui/popover', () => {
  const React = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  const MockPopoverTrigger = React.forwardRef(
    ({ children }: { children?: React.ReactNode }, ref: React.ForwardedRef<unknown>) => {
      React.useImperativeHandle(ref, () => ({ close: mockClosePopover }));
      return <View>{children}</View>;
    },
  );
  MockPopoverTrigger.displayName = 'MockPopoverTrigger';

  return {
    Popover: View,
    PopoverContent: View,
    PopoverTrigger: MockPopoverTrigger,
  };
});

describe('SavedLinksPopover', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname = '/';
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
          accessLevel: 'EDIT',
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

    expect(screen.getAllByRole('button')).toHaveLength(2);
    expect(screen.getByText('新しい卓')).toBeTruthy();
    expect(screen.getByText('古い大会')).toBeTruthy();
    expect(screen.getByText('大会')).toBeTruthy();
    expect(screen.getByText('卓')).toBeTruthy();
    expect(screen.getByText('グループ1 / 大会1')).toBeTruthy();
    expect(screen.getByText('編集')).toBeTruthy();
  });

  it('項目を開くと対象ページへ遷移し、最終表示日時を更新する', async () => {
    await render(<SavedLinksPopover trigger={<View />} />);

    fireEvent.press(screen.getByText('新しい卓'));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/table/[tableKey]',
      params: { tableKey: 'newer-table', openedFromSavedLinks: 'true' },
    });
    await waitFor(() =>
      expect(mockTouch).toHaveBeenCalledWith({ type: 'table', key: 'newer-table' }),
    );
  });

  it('保存項目を削除できる', async () => {
    await render(<SavedLinksPopover trigger={<View />} />);

    await act(async () => {
      fireEvent(screen.getByText('古い大会'), 'longPress');
    });

    await waitFor(() =>
      expect(mockRemove).toHaveBeenCalledWith({ type: 'tournament', key: 'older-tournament' }),
    );
    expect(screen.queryByText('古い大会')).toBeNull();
    expect(mockClosePopover).toHaveBeenCalledTimes(1);
  });

  it('最終表示日時の更新に失敗した場合はエラーを表示する', async () => {
    const error = new Error('storage unavailable');
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    mockTouch.mockRejectedValueOnce(error);
    await render(<SavedLinksPopover trigger={<View />} />);

    fireEvent.press(screen.getByText('新しい卓'));

    await waitFor(() =>
      expect(mockAlertDialog).toHaveBeenCalledWith({
        title: '保存済みページを更新できませんでした',
        description: '保存済みページの更新に失敗しました。もう一度お試しください。',
        showCancelButton: false,
      }),
    );
    expect(consoleError).toHaveBeenCalledWith('Error updating saved link:', error);
    expect(screen.getByText('古い大会')).toBeTruthy();
    consoleError.mockRestore();
  });

  it('保存項目の削除に失敗した場合はエラーを表示する', async () => {
    const error = new Error('storage unavailable');
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    mockRemove.mockRejectedValueOnce(error);
    await render(<SavedLinksPopover trigger={<View />} />);

    await act(async () => {
      fireEvent(screen.getByText('古い大会'), 'longPress');
    });

    await waitFor(() =>
      expect(mockAlertDialog).toHaveBeenLastCalledWith({
        title: '保存済みページを更新できませんでした',
        description: '保存済みページの更新に失敗しました。もう一度お試しください。',
        showCancelButton: false,
      }),
    );
    expect(consoleError).toHaveBeenCalledWith('Error updating saved link:', error);
    consoleError.mockRestore();
  });

  it('空状態を表示する', async () => {
    mockSavedLinksState = { ...mockSavedLinksState, savedLinks: [] };
    await render(<SavedLinksPopover trigger={<View />} />);

    expect(screen.getByText('保存済みの大会・卓はありません')).toBeTruthy();
  });

  it('現在表示中の項目は遷移や更新をせずポップオーバーだけ閉じる', async () => {
    mockPathname = '/table/newer-table';
    await render(<SavedLinksPopover trigger={<View />} />);
    fireEvent.press(screen.getByText('新しい卓'));
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockTouch).not.toHaveBeenCalled();
    expect(mockClosePopover).toHaveBeenCalledTimes(1);
  });

  it('大会項目は大会ページへ遷移する', async () => {
    await render(<SavedLinksPopover trigger={<View />} />);
    fireEvent.press(screen.getByText('古い大会'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/tournament/[tournamentKey]',
      params: { tournamentKey: 'older-tournament', openedFromSavedLinks: 'true' },
    });
  });

  it('削除確認をキャンセルした場合は項目を削除しない', async () => {
    mockAlertDialog.mockResolvedValueOnce(false);
    await render(<SavedLinksPopover trigger={<View />} />);
    fireEvent(screen.getByText('古い大会'), 'longPress');
    await waitFor(() => expect(mockAlertDialog).toHaveBeenCalled());
    expect(mockRemove).not.toHaveBeenCalled();
    expect(screen.getByText('古い大会')).toBeTruthy();
  });

  it.each([
    ['読み込み中', { isLoading: true, isError: false }, '読み込み中...', true],
    [
      '読み込み失敗',
      { isLoading: false, isError: true },
      'データを取得できませんでした。通信状態を確認して再取得してください。',
      false,
    ],
  ])('%sの状態を表示する', async (_, state, expected, isAccessibilityLabel) => {
    mockSavedLinksState = { ...mockSavedLinksState, ...state };
    await render(<SavedLinksPopover trigger={<View />} />);
    expect(
      isAccessibilityLabel ? screen.getByLabelText(expected) : screen.getByText(expected),
    ).toBeTruthy();
  });
});
