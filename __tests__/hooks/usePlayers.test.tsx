import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import React, { type PropsWithChildren } from 'react';

import { useCreatePlayer, useDeletePlayer, useGetPlayer } from '@/src/hooks/usePlayers';

const mockGetDashboard = jest.fn();
const mockCreatePlayer = jest.fn();
const mockDeletePlayer = jest.fn();
const mockShowError = jest.fn();
const mockShowSuccess = jest.fn();

jest.mock('@/src/api/generated/mahjongApi', () => ({
  getApiV2GroupsGroupKeyDashboard: (...args: unknown[]) => mockGetDashboard(...args),
  getGetApiV2GroupsGroupKeyDashboardQueryKey: (groupKey: string) => ['group-dashboard', groupKey],
  postApiGroupsGroupKeyPlayers: (...args: unknown[]) => mockCreatePlayer(...args),
  deleteApiGroupsGroupKeyPlayersPlayerId: (...args: unknown[]) => mockDeletePlayer(...args),
}));

jest.mock('@/src/hooks/useMutationFeedback', () => ({
  useMutationFeedback: () => ({ showError: mockShowError, showSuccess: mockShowSuccess }),
}));

const createHarness = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { gcTime: Infinity, retry: false },
      queries: { gcTime: Infinity, retry: false },
    },
  });
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
};

describe('usePlayers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDashboard.mockResolvedValue({ players: [{ id: 1, name: '東' }] });
    mockCreatePlayer.mockResolvedValue({ id: 2, name: '南' });
    mockDeletePlayer.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('グループdashboardからプレイヤーだけを取得し、空キーでは取得しない', async () => {
    const enabled = createHarness();
    const loaded = await renderHook(() => useGetPlayer('group-key'), { wrapper: enabled.wrapper });

    await waitFor(() => expect(loaded.result.current.players).toEqual([{ id: 1, name: '東' }]));
    expect(mockGetDashboard).toHaveBeenCalledWith('group-key');
    await loaded.unmount();
    enabled.queryClient.clear();

    const disabled = createHarness();
    const skipped = await renderHook(() => useGetPlayer(''), { wrapper: disabled.wrapper });
    expect(skipped.result.current.isFetchingPlayers).toBe(false);
    expect(mockGetDashboard).toHaveBeenCalledTimes(1);
    await skipped.unmount();
    disabled.queryClient.clear();
  });

  it('取得失敗時にエラー状態と再取得関数を返す', async () => {
    mockGetDashboard.mockRejectedValueOnce(new Error('dashboard failed'));
    const { queryClient, wrapper } = createHarness();
    const { result, unmount } = await renderHook(() => useGetPlayer('failed-key'), { wrapper });

    await waitFor(() => expect(result.current.isErrorPlayers).toBe(true));
    expect(result.current.playersError).toEqual(new Error('dashboard failed'));
    expect(result.current.loadPlayers).toEqual(expect.any(Function));
    await unmount();
    queryClient.clear();
  });

  it('プレイヤー作成成功時にAPI、成功通知、完了callbackを実行する', async () => {
    const onAfterCreate = jest.fn();
    const { queryClient, wrapper } = createHarness();
    const { result, unmount } = await renderHook(() => useCreatePlayer(onAfterCreate), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ groupKey: 'group-key', player: { name: '南' } });
    });

    expect(mockCreatePlayer).toHaveBeenCalledWith('group-key', { name: '南' });
    expect(mockShowSuccess).toHaveBeenCalledWith('メンバーを作成しました');
    expect(onAfterCreate).toHaveBeenCalledTimes(1);
    await unmount();
    queryClient.clear();
  });

  it.each([
    ['作成', useCreatePlayer, mockCreatePlayer, { groupKey: 'group-key', player: { name: '南' } }],
    ['削除', useDeletePlayer, mockDeletePlayer, { groupKey: 'group-key', playerId: 2 }],
  ])('%s失敗時に利用者向けエラーを表示する', async (_, hook, api, variables) => {
    const error = new Error('api failed');
    api.mockRejectedValueOnce(error);
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    const { queryClient, wrapper } = createHarness();
    const { result, unmount } = await renderHook(() => hook(), { wrapper });

    await expect(
      act(async () => {
        await result.current.mutateAsync(variables as never);
      }),
    ).rejects.toThrow('api failed');

    await waitFor(() =>
      expect(mockShowError).toHaveBeenCalledWith(
        expect.objectContaining({
          error,
          fallback: '処理を完了できませんでした。もう一度お試しください。',
        }),
      ),
    );
    expect(consoleError).toHaveBeenCalledWith(expect.any(String), error);
    await unmount();
    queryClient.clear();
  });

  it('プレイヤー削除成功時に完了通知とcallbackを実行する', async () => {
    const onAfterDelete = jest.fn();
    const { queryClient, wrapper } = createHarness();
    const { result, unmount } = await renderHook(() => useDeletePlayer(onAfterDelete), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ groupKey: 'group-key', playerId: 2 });
    });

    expect(mockDeletePlayer).toHaveBeenCalledWith('group-key', 2);
    expect(mockShowSuccess).toHaveBeenCalledWith('メンバーを削除しました');
    expect(onAfterDelete).toHaveBeenCalledTimes(1);
    await unmount();
    queryClient.clear();
  });
});
