import { fireEvent, render, screen, userEvent, waitFor } from '@testing-library/react-native';
import React from 'react';

import Index from '@/app/index';
import { ApiError } from '@/src/api/apiError';

const mockPush = jest.fn();
const mockRefetch = jest.fn(() => Promise.resolve());
const mockRefresh = jest.fn(() => Promise.resolve());
const mockCreateGroup = jest.fn();
const mockUseCreateGroupRequest = jest.fn();
const mockUseGroupQueries = jest.fn();

const createApiError = (kind: 'network' | 'http', status?: number) =>
  new ApiError({
    kind,
    message: 'technical error',
    url: 'https://example.com/api/groups/key',
    method: 'GET',
    status,
    retryable: kind === 'network' || status === 500,
  });

jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
  useFocusEffect: jest.fn(),
}));
jest.mock('@/src/hooks/useGroups', () => ({
  useGroupQueries: () => mockUseGroupQueries(),
  useCreateGroupRequest: () => mockUseCreateGroupRequest(),
}));
jest.mock('@/components/common/AlertDialogProvider', () => ({
  useAlertDialog: () => ({ alertDialog: jest.fn() }),
}));
jest.mock('@/components/SelectorModal', () => () => null);
jest.mock('@/components/TextInputModal', () => {
  const { ActivityIndicator, Pressable, Text, View } = jest.requireActual('react-native');
  return {
    TextInputModal: ({
      open,
      isPending,
      pendingText,
      onComfirm,
    }: {
      open: boolean;
      isPending?: boolean;
      pendingText?: string;
      onComfirm: (name: string, email?: string) => void;
    }) =>
      open ? (
        <View>
          <Pressable
            accessibilityLabel="グループ作成を決定"
            disabled={isPending}
            onPress={() => onComfirm('新規グループ', 'test@example.com')}
          >
            {isPending && <ActivityIndicator accessibilityLabel="グループ作成中" />}
            <Text>{isPending ? pendingText : 'OK'}</Text>
          </Pressable>
        </View>
      ) : null,
  };
});
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
  error: undefined,
  isRefreshing: false,
  refetch: mockRefetch,
  refresh: mockRefresh,
};

describe('ホームページ', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGroupQueries.mockReturnValue(defaultState);
    mockUseCreateGroupRequest.mockReturnValue({
      mutateAsync: mockCreateGroup,
      isPending: false,
    });
    mockCreateGroup.mockResolvedValue(undefined);
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

  it.each([
    ['HTTPエラーレスポンス', createApiError('http', 500), /サーバーで問題が発生しました/],
    ['通信エラー', createApiError('network'), /通信できませんでした/],
  ])('%sでは登録グループ欄だけをエラー表示にする', async (_, error, message) => {
    mockUseGroupQueries.mockReturnValue({ ...defaultState, groups: [], isError: true, error });
    await render(<Index />);

    expect(screen.getByText(message)).toBeTruthy();
    expect(screen.getByText('麻雀大会 集計')).toBeTruthy();
    expect(screen.getByText('新しいグループを作成')).toBeTruthy();
  });

  it('再取得ボタンを連打しても再取得を1回だけ開始する', async () => {
    let resolveRefetch: (() => void) | undefined;
    mockRefetch.mockImplementationOnce(
      () => new Promise<void>((resolve) => (resolveRefetch = resolve)),
    );
    mockUseGroupQueries.mockReturnValue({
      ...defaultState,
      groups: [],
      isError: true,
      error: createApiError('network'),
    });
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
      error: createApiError('network'),
      isFetching: true,
    });
    await render(<Index />);

    expect(screen.getByText('再取得中...')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: /再取得中/ }));
    expect(mockRefetch).not.toHaveBeenCalled();
  });

  it('グループ作成APIが成功するまで作成モーダルを閉じない', async () => {
    let resolveCreate: (() => void) | undefined;
    mockCreateGroup.mockImplementationOnce(
      () => new Promise<void>((resolve) => (resolveCreate = resolve)),
    );
    await render(<Index />);

    const user = userEvent.setup();
    await user.press(screen.getByText('新しいグループを作成'));
    await user.press(screen.getByLabelText('グループ作成を決定'));

    expect(screen.getByLabelText('グループ作成を決定')).toBeTruthy();
    resolveCreate?.();
    await waitFor(() => expect(screen.queryByLabelText('グループ作成を決定')).toBeNull());
  });

  it('グループ作成中は決定ボタンを無効化してスピナーを表示する', async () => {
    mockUseCreateGroupRequest.mockReturnValue({
      mutateAsync: mockCreateGroup,
      isPending: true,
    });
    await render(<Index />);

    const user = userEvent.setup();
    await user.press(screen.getByText('新しいグループを作成'));

    expect(screen.getByText('作成中...')).toBeTruthy();
    expect(screen.getByLabelText('グループ作成中')).toBeTruthy();
    expect(screen.getByLabelText('グループ作成を決定')).toBeDisabled();
  });

  it('保留中グループに説明と更新ボタンを表示する', async () => {
    mockUseGroupQueries.mockReturnValue({
      ...defaultState,
      pendingGroups: [
        {
          token: 'pending-token',
          groupName: '申請中グループ',
          expiresAt: new Date('2030-01-01T00:00:00Z'),
        },
      ],
    });
    await render(<Index />);

    expect(
      screen.getByText(/グループ作成用メール内のリンクが開かれるのを待っています/),
    ).toBeTruthy();
    fireEvent.press(screen.getByText('申請状況を更新'));
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });
});
