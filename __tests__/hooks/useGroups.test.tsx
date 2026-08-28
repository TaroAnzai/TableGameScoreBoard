import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import React, { type PropsWithChildren } from 'react';

import { ApiError } from '@/src/api/apiError';
import {
  getKeyType,
  useCreateGroup,
  useCreateGroupRequest,
  useGetGroupDashboard,
  useGroupQueries,
  useUpdateGroup,
} from '@/src/hooks/useGroups';

const mockPostApiGroups = jest.fn();
const mockPostGroupRequest = jest.fn();
const mockBatchGetGroups = jest.fn();
const mockAddGroupKey = jest.fn();
const mockAddPendingGroupKey = jest.fn();
const mockRemoveGroupKey = jest.fn();
const mockAlertDialog = jest.fn();
const mockShowSuccess = jest.fn();
const mockShowError = jest.fn();
const mockGetGroupDashboard = jest.fn();
const mockPutGroup = jest.fn();
const mockSetPendingGroups = jest.fn();
const mockToastShow = jest.fn();
let mockStoredGroupKeys: string[] = [];
let mockStoredPendingGroups: { token: string; groupName: string; email: string; expiresAt: Date }[] = [];

jest.mock('@/src/api/generated/mahjongApi', () => ({
  postApiGroups: (...args: unknown[]) => mockPostApiGroups(...args),
  postApiGroupsRequestLink: (...args: unknown[]) => mockPostGroupRequest(...args),
  postApiV2GroupsbatchGet: (...args: unknown[]) => mockBatchGetGroups(...args),
  getApiV2GroupsGroupKeyDashboard: (...args: unknown[]) => mockGetGroupDashboard(...args),
  getGetApiV2GroupsGroupKeyDashboardQueryKey: (key: string) => [
    `/api/v2/groups/${key}/dashboard`,
  ],
  putApiGroupsGroupKey: (...args: unknown[]) => mockPutGroup(...args),
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
    addPendingGroupKey: (...args: unknown[]) => mockAddPendingGroupKey(...args),
    getGroupKeys: () => Promise.resolve(mockStoredGroupKeys),
    getPendingGroups: () => Promise.resolve(mockStoredPendingGroups),
    setPendingGroups: (...args: unknown[]) => mockSetPendingGroups(...args),
    removeGroupKey: (key: string) => {
      mockStoredGroupKeys = mockStoredGroupKeys.filter((storedKey) => storedKey !== key);
      return mockRemoveGroupKey(key);
    },
  },
}));
jest.mock('react-native-toast-message', () => ({
  show: (...args: unknown[]) => mockToastShow(...args),
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

  it('作成失敗時はエラーを通知し、設定により通知を抑止できる', async () => {
    const error = new Error('create failed');
    mockPostApiGroups.mockRejectedValue(error);
    const queryClient = new QueryClient({
      defaultOptions: { mutations: { gcTime: Infinity, retry: false } },
    });
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const shown = await renderHook(() => useCreateGroup(undefined, true), { wrapper });
    await act(async () => {
      await expect(shown.result.current.mutateAsync({ token: 'token' })).rejects.toBe(error);
    });
    expect(mockShowError).toHaveBeenCalledWith(expect.objectContaining({ error }));
    await shown.unmount();

    mockShowError.mockClear();
    const hidden = await renderHook(() => useCreateGroup(undefined, false), { wrapper });
    await act(async () => {
      await expect(hidden.result.current.mutateAsync({ token: 'token' })).rejects.toBe(error);
    });
    expect(mockShowError).not.toHaveBeenCalled();
    await hidden.unmount();
    queryClient.clear();
  });
});

describe('グループ取得・更新と権限判定', () => {
  it('dashboard取得成功・失敗を返す', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { gcTime: Infinity, retry: false } },
    });
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    mockGetGroupDashboard.mockResolvedValueOnce({ group: { id: 1, name: 'グループ1' } });
    const success = await renderHook(() => useGetGroupDashboard('group-key'), { wrapper });
    await waitFor(() => expect(success.result.current.data).toEqual({ id: 1, name: 'グループ1' }));
    await success.unmount();

    const error = new Error('load failed');
    mockGetGroupDashboard.mockRejectedValueOnce(error);
    const failed = await renderHook(() => useGetGroupDashboard('failed-key'), { wrapper });
    await waitFor(() => expect(failed.result.current.error).toBe(error));
    await failed.unmount();
    queryClient.clear();
  });

  it('グループ更新成功時にcallbackを呼び、失敗時は通知する', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { mutations: { gcTime: Infinity, retry: false } },
    });
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const onAfterUpdate = jest.fn();
    mockPutGroup.mockResolvedValueOnce({ id: 1, name: '更新後' });
    const success = await renderHook(() => useUpdateGroup(onAfterUpdate), { wrapper });
    await act(async () =>
      success.result.current.mutateAsync({ groupKey: 'key', groupUpdate: { name: '更新後' } }),
    );
    expect(mockPutGroup).toHaveBeenCalledWith('key', { name: '更新後' });
    expect(onAfterUpdate).toHaveBeenCalled();
    await success.unmount();

    const error = new Error('update failed');
    mockPutGroup.mockRejectedValueOnce(error);
    const failed = await renderHook(() => useUpdateGroup(), { wrapper });
    await act(async () => {
      await expect(
        failed.result.current.mutateAsync({ groupKey: 'key', groupUpdate: { name: '失敗' } }),
      ).rejects.toBe(error);
    });
    expect(mockShowError).toHaveBeenCalledWith(expect.objectContaining({ error }));
    await failed.unmount();
    queryClient.clear();
  });

  it.each([
    [{ owner_link: 'owner' }, 'OWNER'],
    [{ edit_link: 'edit' }, 'EDIT'],
    [{ view_link: 'view' }, 'VIEW'],
    [{}, ''],
  ])('リンクから権限を判定する', (group, expected) => {
    expect(getKeyType(group as never)).toBe(expected);
  });
});

describe('useCreateGroupRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('申請情報としてメールアドレスをストレージへ保存する', async () => {
    mockPostGroupRequest.mockResolvedValue({
      token: 'pending-token',
      expires_at: '2030-01-01T00:00:00Z',
    });
    mockAddPendingGroupKey.mockResolvedValue(undefined);
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

    await result.current.mutateAsync({
      name: '申請中グループ',
      email: 'pending@example.com',
      timezone: 'Asia/Tokyo',
      recaptcha_token: '',
    });

    expect(mockAddPendingGroupKey).toHaveBeenCalledWith({
      token: 'pending-token',
      groupName: '申請中グループ',
      email: 'pending@example.com',
      expiresAt: new Date('2030-01-01T00:00:00Z'),
    });

    unmount();
    queryClient.clear();
  });

  it('端末保存に失敗してもAPI成功として完了し、保存だけを再試行できる', async () => {
    const response = {
      token: 'pending-token',
      expires_at: '2030-01-01T00:00:00Z',
    };
    mockPostGroupRequest.mockResolvedValue(response);
    mockAddPendingGroupKey.mockRejectedValueOnce(new Error('storage unavailable'));
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
    const request = {
      name: '申請中グループ',
      email: 'pending@example.com',
      timezone: 'Asia/Tokyo',
      recaptcha_token: '',
    };

    let mutationResult: typeof response | undefined;
    await act(async () => {
      mutationResult = await result.current.mutateAsync(request);
    });

    expect(mutationResult).toEqual(response);
    expect(mockShowError).not.toHaveBeenCalled();
    expect(mockAlertDialog).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '申請情報を端末に保存できませんでした',
        showCancelButton: false,
      }),
    );
    expect(result.current.pendingGroupStorageRetry).toEqual({
      token: 'pending-token',
      groupName: '申請中グループ',
      email: 'pending@example.com',
      expiresAt: new Date('2030-01-01T00:00:00Z'),
    });

    mockAddPendingGroupKey.mockResolvedValueOnce(undefined);
    await act(async () => {
      await result.current.retryPendingGroupStorage();
    });

    expect(mockPostGroupRequest).toHaveBeenCalledTimes(1);
    expect(mockAddPendingGroupKey).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(result.current.pendingGroupStorageRetry).toBeNull());

    unmount();
    queryClient.clear();
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
    mockBatchGetGroups.mockResolvedValue({
      results: [
        { client_id: '0', status: 'not_found' },
        { client_id: '1', status: 'not_found' },
      ],
    });
    mockStoredPendingGroups = [];
    mockSetPendingGroups.mockResolvedValue(undefined);
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

  it('Group Keyの削除に失敗してもエラーを処理する', async () => {
    const error = new Error('secure storage unavailable');
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    mockRemoveGroupKey.mockRejectedValueOnce(error);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { gcTime: Infinity, retry: false } },
    });
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { unmount } = await renderHook(() => useGroupQueries(), { wrapper });

    await waitFor(() =>
      expect(mockShowError).toHaveBeenCalledWith({
        title: 'グループ取得エラー',
        error,
        fallback: '不明なエラー',
      }),
    );
    expect(consoleError).toHaveBeenCalledWith('Error removing invalid group keys:', error);

    unmount();
    queryClient.clear();
    consoleError.mockRestore();
  });

  it('ダイアログ表示に失敗してもエラーを処理する', async () => {
    const error = new Error('dialog unavailable');
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    mockAlertDialog.mockRejectedValueOnce(error);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { gcTime: Infinity, retry: false } },
    });
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { unmount } = await renderHook(() => useGroupQueries(), { wrapper });

    await waitFor(() =>
      expect(mockShowError).toHaveBeenCalledWith({
        title: 'グループ取得エラー',
        error,
        fallback: '不明なエラー',
      }),
    );
    expect(consoleError).toHaveBeenCalledWith('Error showing invalid group keys dialog:', error);

    unmount();
    queryClient.clear();
    consoleError.mockRestore();
  });

  it('期限切れpending groupを除外してストレージを更新する', async () => {
    mockStoredGroupKeys = [];
    const valid = {
      token: 'valid', groupName: '有効', email: 'valid@example.com', expiresAt: new Date('2099-01-01'),
    };
    const expired = {
      token: 'expired', groupName: '期限切れ', email: 'old@example.com', expiresAt: new Date('2020-01-01'),
    };
    mockStoredPendingGroups = [valid, expired];
    const queryClient = new QueryClient({
      defaultOptions: { queries: { gcTime: Infinity, retry: false } },
    });
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result, unmount } = await renderHook(() => useGroupQueries(), { wrapper });
    await waitFor(() => expect(result.current.pendingGroups).toEqual([valid]));
    expect(mockSetPendingGroups).toHaveBeenCalledWith([valid]);
    expect(mockToastShow).toHaveBeenCalledWith(expect.objectContaining({ text2: '期限切れ' }));
    await unmount();
    queryClient.clear();
  });

  it('refreshはstorageとbatch queryを無効化し、完了後にrefresh状態を戻す', async () => {
    mockStoredGroupKeys = [];
    const queryClient = new QueryClient({
      defaultOptions: { queries: { gcTime: Infinity, retry: false } },
    });
    const invalidateQueries = jest.spyOn(queryClient, 'invalidateQueries').mockResolvedValue();
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result, unmount } = await renderHook(() => useGroupQueries(), { wrapper });
    await act(async () => result.current.refresh());
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['groupKeysAndPendingGroups'] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['groupsBatch'] });
    expect(result.current.isRefreshing).toBe(false);
    await unmount();
    queryClient.clear();
  });
});
