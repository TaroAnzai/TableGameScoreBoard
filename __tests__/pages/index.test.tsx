import { fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import React from 'react';

import Index from '@/app/index';

const mockPush = jest.fn();
const mockRefetch = jest.fn(() => Promise.resolve());
const mockRefresh = jest.fn(() => Promise.resolve());
const mockCreateGroup = jest.fn();
const mockUseGroupQueries = jest.fn();

jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
  useFocusEffect: jest.fn(),
}));
jest.mock('@/src/hooks/useGroups', () => ({
  useGroupQueries: () => mockUseGroupQueries(),
  useCreateGroupRequest: () => ({ mutate: mockCreateGroup }),
}));
jest.mock('@/components/common/AlertDialogProvider', () => ({
  useAlertDialog: () => ({ alertDialog: jest.fn() }),
}));
jest.mock('@/components/SelectorModal', () => () => null);
jest.mock('@/components/TextInputModal', () => ({ TextInputModal: () => null }));
jest.mock('@/components/MahjongListItem', () => {
  const { Text } = jest.requireActual('react-native');
  return {
    MahjongListItem: ({ title, onPress }: { title: string; onPress?: () => void }) => (
      <Text accessibilityRole={onPress ? 'button' : undefined} onPress={onPress}>
        {title}
      </Text>
    ),
  };
});
jest.mock('@/src/storage/appStorage', () => ({
  appStorage: { removeGroupKey: jest.fn() },
}));

const defaultState = {
  groups: [
    {
      id: 1,
      name: 'テストグループ',
      edit_link: 'group-edit-key',
      group_links: [{ access_level: 'EDIT', short_key: 'group-edit-key' }],
    },
  ],
  pendingGroups: [],
  isLoading: false,
  isFetching: false,
  isError: false,
  isRefreshing: false,
  refetch: mockRefetch,
  refresh: mockRefresh,
};

describe('ホームページ', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGroupQueries.mockReturnValue(defaultState);
  });

  it('正常取得したグループを表示して詳細へ遷移する', async () => {
    await render(<Index />);

    fireEvent.press(screen.getByText('テストグループ'));
    expect(mockPush).toHaveBeenCalledWith('/group/group-edit-key');
  });

  it('初回ローディングを表示する', async () => {
    mockUseGroupQueries.mockReturnValue({ ...defaultState, groups: [], isLoading: true });
    await render(<Index />);

    expect(screen.getByText('読み込み中...')).toBeTruthy();
    expect(screen.queryByText('テストグループ')).toBeNull();
  });

  it('取得成功かつ0件なら空状態を表示する', async () => {
    mockUseGroupQueries.mockReturnValue({ ...defaultState, groups: [] });
    await render(<Index />);

    expect(screen.getByText(/新しいグループを作成.*ボタン/)).toBeTruthy();
  });

  it.each(['HTTPエラーレスポンス', '通信エラー'])(
    '%sでは登録グループ欄だけをエラー表示にする',
    async () => {
      mockUseGroupQueries.mockReturnValue({ ...defaultState, groups: [], isError: true });
      await render(<Index />);

      expect(screen.getByText(/データを取得できませんでした/)).toBeTruthy();
      expect(screen.getByText('麻雀大会 集計')).toBeTruthy();
      expect(screen.getByText('新しいグループを作成')).toBeTruthy();
    },
  );

  it('再取得ボタンを連打しても再取得を1回だけ開始する', async () => {
    let resolveRefetch: (() => void) | undefined;
    mockRefetch.mockImplementationOnce(
      () => new Promise<void>((resolve) => (resolveRefetch = resolve)),
    );
    mockUseGroupQueries.mockReturnValue({ ...defaultState, groups: [], isError: true });
    await render(<Index />);

    const user = userEvent.setup();
    const retry = screen.getByText('再取得');
    await user.press(retry);
    await user.press(retry);
    await user.press(retry);
    expect(mockRefetch).toHaveBeenCalledTimes(1);
    resolveRefetch?.();
  });

  it('再取得中は再取得ボタンを無効化する', async () => {
    mockUseGroupQueries.mockReturnValue({
      ...defaultState,
      groups: [],
      isError: true,
      isFetching: true,
    });
    await render(<Index />);

    expect(screen.getByText('再取得中...')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: /再取得中/ }));
    expect(mockRefetch).not.toHaveBeenCalled();
  });
});
