import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import React, { type PropsWithChildren } from 'react';

import { ApiError } from '@/src/api/apiError';
import { useCreateGroup, useCreateGroupRequest, useGroupQueries } from '@/src/hooks/useGroups';

const mockPostApiGroups = jest.fn();
const mockPostGroupRequest = jest.fn();
const mockAddGroupKey = jest.fn();
const mockRemoveGroupKey = jest.fn();
const mockAlertDialog = jest.fn();
const mockShowSuccess = jest.fn();
const mockShowError = jest.fn();
let mockStoredGroupKeys: string[] = [];

jest.mock('@/src/api/generated/mahjongApi', () => ({
  postApiGroups: (...args: unknown[]) => mockPostApiGroups(...args),
  postApiGroupsRequestLink: (...args: unknown[]) => mockPostGroupRequest(...args),
  getGetApiGroupsGroupKeyQueryKey: (key: string) => [`/api/groups/${key}`],
  getGetApiGroupsGroupKeyQueryOptions: (key: string) => ({
    queryKey: [`/api/groups/${key}`],
    queryFn: async () => {
      throw { status: 404 };
    },
  }),
}));
jest.mock('@/components/common/AlertDialogProvider', () => ({
  useAlertDialog: () => ({ alertDialog: mockAlertDialog }),
}));
jest.mock('@/src/hooks/useMutationFeedback', () => ({
  useMutationFeedback: () => ({ showError: mockShowError, showSuccess: mockShowSuccess }),
}));
jest.mock('@/src/storage/appStorage', () => ({
  appStorage: {
    addGroupKey: (...args: unknown[]) => mockAddGroupKey(...args),
    getGroupKeys: () => Promise.resolve(mockStoredGroupKeys),
    getPendingGroups: () => Promise.resolve([]),
    removeGroupKey: (key: string) => {
      mockStoredGroupKeys = mockStoredGroupKeys.filter((storedKey) => storedKey !== key);
      return mockRemoveGroupKey(key);
    },
  },
}));
jest.mock('@/src/utils/groupSync', () => ({
  syncPendingGroups: () => Promise.resolve(false),
}));

describe('useCreateGroup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('グループキーの保存完了後に作成処理を完了する', async () => {
    let resolveStorage: () => void = () => undefined;
    const storagePromise = new Promise<void>((resolve) => {
      resolveStorage = resolve;
    });
    mockPostApiGroups.mockResolvedValue({ name: 'テストグループ', owner_link: 'owner-key' });
    mockAddGroupKey.mockReturnValue(storagePromise);
    const onAfterCreate = jest.fn();
    const queryClient = new QueryClient({
      defaultOptions: {
        mutations: { gcTime: Infinity, retry: false },
        queries: { gcTime: Infinity, retry: false },
      },
    });
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result, unmount } = await renderHook(() => useCreateGroup(onAfterCreate), { wrapper });
    const mutateAsync = result.current.mutateAsync;
    unmount();

    let mutationCompleted = false;
    const mutationPromise = mutateAsync({ token: 'token' }).then((value) => {
      mutationCompleted = true;
      return value;
    });

    await waitFor(() => expect(mockAddGroupKey).toHaveBeenCalledWith('owner-key'));
    expect(mutationCompleted).toBe(false);
    expect(onAfterCreate).not.toHaveBeenCalled();

    resolveStorage();
    await mutationPromise;

    expect(mutationCompleted).toBe(true);
    expect(onAfterCreate).toHaveBeenCalledTimes(1);
    queryClient.clear();
  });
});

describe('useCreateGroupRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('422ではAPI本文を表示せずメールアドレス用の案内を表示する', async () => {
    mockPostGroupRequest.mockRejectedValue(
      new ApiError({
        kind: 'http',
        message: 'HTTP 422 Unprocessable Entity',
        url: 'https://example.com/api/groups/request-link',
        method: 'POST',
        status: 422,
        retryable: false,
        body: { message: 'internal validation detail' },
      }),
    );
    const queryClient = new QueryClient({
      defaultOptions: {
        mutations: { gcTime: Infinity, retry: false },
        queries: { gcTime: Infinity, retry: false },
      },
    });
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result, unmount } = await renderHook(() => useCreateGroupRequest(), { wrapper });

    await expect(
      result.current.mutateAsync({
        name: 'テストグループ',
        email: 'invalid@example.com',
        timezone: 'Asia/Tokyo',
        recaptcha_token: '',
      }),
    ).rejects.toBeInstanceOf(ApiError);

    expect(mockShowError).toHaveBeenCalledWith({
      title: 'グループ作成時にエラーが発生しました',
      fallback: '不明なエラー',
      message: '不正なメールアドレスです。',
    });
    expect(JSON.stringify(mockShowError.mock.calls)).not.toContain('internal validation detail');

    unmount();
    queryClient.clear();
  });
});

describe('useGroupQueries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStoredGroupKeys = ['missing-owner-key', 'missing-view-key'];
    mockRemoveGroupKey.mockResolvedValue(undefined);
    mockAlertDialog.mockResolvedValue(true);
  });

  it('404になったキーをすべて削除してから1つのダイアログにまとめて表示する', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { gcTime: Infinity, retry: false } },
    });
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { unmount } = await renderHook(() => useGroupQueries(), { wrapper });

    await waitFor(() => expect(mockRemoveGroupKey).toHaveBeenCalledTimes(2), { timeout: 4_000 });
    await waitFor(() => expect(mockAlertDialog).toHaveBeenCalledTimes(1));
    expect(mockRemoveGroupKey).toHaveBeenNthCalledWith(1, 'missing-owner-key');
    expect(mockRemoveGroupKey).toHaveBeenNthCalledWith(2, 'missing-view-key');
    expect(mockAlertDialog).toHaveBeenCalledWith({
      title: 'グループ取得エラー',
      description:
        'サーバーから、以下のキーのデータが削除されているためアプリからグループ取得キーを削除しました。',
      text1: '- missing-owner-key\n- missing-view-key',
      showCancelButton: false,
    });

    unmount();
    queryClient.clear();
  });
});
