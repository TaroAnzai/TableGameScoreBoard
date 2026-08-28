import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import React, { type PropsWithChildren } from 'react';

import {
  useAddTablePlayer,
  useCreateTable,
  useDeleteChipTableWithScores,
  useDeleteTable,
  useDeleteTablePlayer,
  useGetTableDashboard,
  useUpdateTable,
} from '@/src/hooks/useTables';

const mockPush = jest.fn();
const mockPostTable = jest.fn();
const mockPutTable = jest.fn();
const mockDeleteTableV2 = jest.fn();
const mockGetTableDashboard = jest.fn();
const mockPostTablePlayers = jest.fn();
const mockDeleteTablePlayer = jest.fn();
const mockShowError = jest.fn();
const mockShowSuccess = jest.fn();

jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
}));
jest.mock('@/src/api/generated/mahjongApi', () => ({
  postApiTournamentsTournamentKeyTables: (...args: unknown[]) => mockPostTable(...args),
  putApiTablesTableKey: (...args: unknown[]) => mockPutTable(...args),
  deleteApiV2TablesTableKey: (...args: unknown[]) => mockDeleteTableV2(...args),
  getGetApiTablesTableKeyQueryOptions: (tableKey: string) => ({
    queryKey: [`/api/tables/${tableKey}`],
  }),
  getGetApiTournamentsTournamentKeyTablesQueryKey: (tournamentKey: string) => [
    `/api/tournaments/${tournamentKey}/tables`,
  ],
  getGetApiTournamentsTournamentKeyScoreMapQueryKey: (tournamentKey: string) => [
    `/api/tournaments/${tournamentKey}/score_map`,
  ],
  getGetApiV2TablesTableKeyDashboardQueryKey: (tableKey: string) => [
    `/api/v2/tables/${tableKey}/dashboard`,
  ],
  getApiV2TablesTableKeyDashboard: (...args: unknown[]) => mockGetTableDashboard(...args),
  getGetApiV2TournamentsTournamentKeyDashboardQueryKey: (tournamentKey: string) => [
    `/api/v2/tournaments/${tournamentKey}/dashboard`,
  ],
  getGetApiTablesTableKeyPlayersQueryKey: (tableKey: string) => [
    `/api/tables/${tableKey}/players`,
  ],
  postApiTablesTableKeyPlayers: (...args: unknown[]) => mockPostTablePlayers(...args),
  deleteApiTablesTableKeyPlayersPlayerId: (...args: unknown[]) =>
    mockDeleteTablePlayer(...args),
}));
jest.mock('@/src/hooks/useMutationFeedback', () => ({
  useMutationFeedback: () => ({ showError: mockShowError, showSuccess: mockShowSuccess }),
}));
jest.mock('@/src/hooks/useGames', () => ({
  useDeleteGame: () => ({ mutateAsync: jest.fn() }),
}));

describe('useCreateTable', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { gcTime: Infinity, retry: false },
      queries: { gcTime: Infinity, retry: false },
    },
  });
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    queryClient.clear();
  });

  it('作成後に記録用紙一覧とスコアボードを更新して親大会キーを引き継いで遷移する', async () => {
    const invalidateQueries = jest.spyOn(queryClient, 'invalidateQueries').mockResolvedValue();
    mockPostTable.mockResolvedValue({ owner_link: 'new-table-owner-key' });
    const { result, unmount } = await renderHook(() => useCreateTable(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        tournamentKey: 'tournament-owner-key',
        parentGroupKey: 'group-owner-key',
        tableCreate: { name: '卓1' },
      });
    });

    expect(mockPostTable).toHaveBeenCalledWith('tournament-owner-key', { name: '卓1' });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['/api/tournaments/tournament-owner-key/tables'],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['/api/tournaments/tournament-owner-key/score_map'],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['/api/v2/tournaments/tournament-owner-key/dashboard'],
    });
    expect(invalidateQueries).toHaveBeenCalledTimes(3);
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/table/[tableKey]',
      params: {
        tableKey: 'new-table-owner-key',
        parentTournamentKey: 'tournament-owner-key',
        parentGroupKey: 'group-owner-key',
      },
    });
    unmount();
  });

  it('直リンクの大会で作成した記録用紙には親グループキーを付与しない', async () => {
    mockPostTable.mockResolvedValue({ owner_link: 'new-table-owner-key' });
    const { result, unmount } = await renderHook(() => useCreateTable(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        tournamentKey: 'direct-tournament-key',
        tableCreate: { name: '卓1' },
      });
    });

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/table/[tableKey]',
      params: {
        tableKey: 'new-table-owner-key',
        parentTournamentKey: 'direct-tournament-key',
      },
    });
    unmount();
  });

  it('自動作成するチップ卓では記録用紙へ遷移しない', async () => {
    mockPostTable.mockResolvedValue({ owner_link: 'chip-table-owner-key' });
    const { result, unmount } = await renderHook(
      () => useCreateTable({ navigateOnSuccess: false }),
      { wrapper },
    );

    await act(async () => {
      await result.current.mutateAsync({
        tournamentKey: 'tournament-owner-key',
        tableCreate: { name: 'チップ', type: 'CHIP' },
      });
    });

    expect(mockPostTable).toHaveBeenCalledWith('tournament-owner-key', {
      name: 'チップ',
      type: 'CHIP',
    });
    expect(mockPush).not.toHaveBeenCalled();
    unmount();
  });

  it('APIがリンクのない異常レスポンスを返した場合は遷移しない', async () => {
    mockPostTable.mockResolvedValue({ id: 1, name: '卓1' });
    const { result, unmount } = await renderHook(() => useCreateTable(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({
        tournamentKey: 'tournament-key',
        tableCreate: { name: '卓1' },
      });
    });
    expect(mockPush).not.toHaveBeenCalled();
    await unmount();
  });

  it('卓作成失敗時はエラー通知しqueryを無効化しない', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const invalidateQueries = jest.spyOn(queryClient, 'invalidateQueries').mockResolvedValue();
    const error = new Error('create failed');
    mockPostTable.mockRejectedValue(error);
    const { result, unmount } = await renderHook(() => useCreateTable(), { wrapper });
    await act(async () => {
      await expect(
        result.current.mutateAsync({ tournamentKey: 'key', tableCreate: { name: '卓1' } }),
      ).rejects.toBe(error);
    });
    expect(mockShowError).toHaveBeenCalledWith(expect.objectContaining({ error }));
    expect(invalidateQueries).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
    await unmount();
    consoleError.mockRestore();
  });
});

describe('useGetTableDashboard', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { gcTime: Infinity, retry: false } },
  });
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
  });

  afterAll(() => {
    queryClient.clear();
  });

  it('V2 dashboard 全体を取得して返す', async () => {
    const dashboard = {
      table: { id: 1, name: '卓1', type: 'NORMAL' },
      table_players: [{ id: 10, name: '参加者1' }],
      games: [{ id: 100, scores: [] }],
      available_tournament_players: [{ id: 20, name: '候補者1' }],
    };
    mockGetTableDashboard.mockResolvedValue(dashboard);

    const { result, unmount } = await renderHook(() => useGetTableDashboard('table-key'), {
      wrapper,
    });

    await waitFor(() => expect(result.current.dashboard).toEqual(dashboard));

    expect(mockGetTableDashboard).toHaveBeenCalledWith('table-key');
    unmount();
  });

  it('dashboard取得失敗を返し、空キーではAPIを呼ばない', async () => {
    const error = new Error('load failed');
    mockGetTableDashboard.mockRejectedValue(error);
    const failed = await renderHook(() => useGetTableDashboard('failed-key'), { wrapper });
    await waitFor(() => expect(failed.result.current.dashboardError).toBe(error));
    expect(failed.result.current.isErrorDashboard).toBe(true);
    await failed.unmount();

    jest.clearAllMocks();
    const disabled = await renderHook(() => useGetTableDashboard(''), { wrapper });
    expect(disabled.result.current.isFetchingDashboard).toBe(false);
    expect(mockGetTableDashboard).not.toHaveBeenCalled();
    await disabled.unmount();
  });
});

describe('useUpdateTable', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { gcTime: Infinity, retry: false },
      queries: { gcTime: Infinity, retry: false },
    },
  });
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    queryClient.clear();
  });

  it('テーブル名更新後に全表示用キャッシュを即時更新してから無効化する', async () => {
    const invalidateQueries = jest.spyOn(queryClient, 'invalidateQueries').mockResolvedValue();
    const updatedTable = {
      id: 1,
      tournament_id: 10,
      name: '変更後の卓名',
      type: 'NORMAL',
      parent_tournament_link: {},
    };
    queryClient.setQueryData(['/api/tables/table-owner-key'], {
      ...updatedTable,
      name: '変更前の卓名',
    });
    queryClient.setQueryData(
      ['/api/tournaments/tournament-owner-key/tables'],
      [
        { ...updatedTable, name: '変更前の卓名' },
        { ...updatedTable, id: 2, name: '別の卓名' },
      ],
    );
    queryClient.setQueryData(['/api/tournaments/tournament-owner-key/score_map'], {
      tournament_id: 10,
      tables: [
        { id: 1, name: '変更前の卓名', type: 'NORMAL' },
        { id: 2, name: '別の卓名', type: 'NORMAL' },
      ],
      players: [],
    });
    mockPutTable.mockResolvedValue(updatedTable);
    const { result, unmount } = await renderHook(() => useUpdateTable(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        tableKey: 'table-owner-key',
        tournamentKey: 'tournament-owner-key',
        tableUpdate: { name: '変更後の卓名' },
      });
    });

    expect(mockPutTable).toHaveBeenCalledWith('table-owner-key', { name: '変更後の卓名' });
    expect(queryClient.getQueryData(['/api/tables/table-owner-key'])).toEqual(updatedTable);
    expect(queryClient.getQueryData(['/api/tournaments/tournament-owner-key/tables'])).toEqual([
      updatedTable,
      { ...updatedTable, id: 2, name: '別の卓名' },
    ]);
    expect(queryClient.getQueryData(['/api/tournaments/tournament-owner-key/score_map'])).toEqual({
      tournament_id: 10,
      tables: [
        { id: 1, name: '変更後の卓名', type: 'NORMAL' },
        { id: 2, name: '別の卓名', type: 'NORMAL' },
      ],
      players: [],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['/api/tables/table-owner-key'],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['/api/tournaments/tournament-owner-key/tables'],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['/api/tournaments/tournament-owner-key/score_map'],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['/api/v2/tables/table-owner-key/dashboard'],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['/api/v2/tournaments/tournament-owner-key/dashboard'],
    });
    expect(invalidateQueries).toHaveBeenCalledTimes(5);
    unmount();
  });

  it('親大会なしの更新では卓キャッシュだけを更新する', async () => {
    const invalidateQueries = jest.spyOn(queryClient, 'invalidateQueries').mockResolvedValue();
    const updated = { id: 1, name: '更新後', type: 'NORMAL' };
    mockPutTable.mockResolvedValue(updated);
    const { result, unmount } = await renderHook(() => useUpdateTable(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ tableKey: 'key', tableUpdate: { name: '更新後' } });
    });
    expect(queryClient.getQueryData(['/api/tables/key'])).toEqual(updated);
    expect(invalidateQueries).toHaveBeenCalledTimes(2);
    await unmount();
  });

  it('卓更新失敗時はキャッシュを変更せずエラー通知する', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const invalidateQueries = jest.spyOn(queryClient, 'invalidateQueries').mockResolvedValue();
    const error = new Error('update failed');
    queryClient.setQueryData(['/api/tables/key'], { id: 1, name: '更新前' });
    mockPutTable.mockRejectedValue(error);
    const { result, unmount } = await renderHook(() => useUpdateTable(), { wrapper });
    await act(async () => {
      await expect(
        result.current.mutateAsync({ tableKey: 'key', tableUpdate: { name: '更新後' } }),
      ).rejects.toBe(error);
    });
    expect(queryClient.getQueryData(['/api/tables/key'])).toEqual({ id: 1, name: '更新前' });
    expect(invalidateQueries).not.toHaveBeenCalled();
    expect(mockShowError).toHaveBeenCalledWith(expect.objectContaining({ error }));
    await unmount();
    consoleError.mockRestore();
  });
});

describe('useDeleteTable', () => {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { gcTime: Infinity, retry: false } },
  });
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
  });

  afterAll(() => {
    queryClient.clear();
  });

  it('V2カスケード削除後に卓キャッシュを除去して親大会キャッシュを更新する', async () => {
    const invalidateQueries = jest.spyOn(queryClient, 'invalidateQueries').mockResolvedValue();
    const removeQueries = jest.spyOn(queryClient, 'removeQueries');
    mockDeleteTableV2.mockResolvedValue({ deleted_game_count: 2 });
    const { result, unmount } = await renderHook(() => useDeleteTable(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        tableKey: 'table-owner-key',
        tournamentKey: 'tournament-owner-key',
      });
    });

    expect(mockDeleteTableV2).toHaveBeenCalledWith('table-owner-key');
    expect(removeQueries).toHaveBeenCalledWith({
      queryKey: ['/api/v2/tables/table-owner-key/dashboard'],
      exact: true,
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['/api/tournaments/tournament-owner-key/tables'],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['/api/tournaments/tournament-owner-key/score_map'],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['/api/v2/tournaments/tournament-owner-key/dashboard'],
    });
    expect(invalidateQueries).toHaveBeenCalledTimes(3);
    unmount();
  });

  it('直リンクからの削除では存在しない親大会キャッシュを更新しない', async () => {
    const invalidateQueries = jest.spyOn(queryClient, 'invalidateQueries').mockResolvedValue();
    const removeQueries = jest.spyOn(queryClient, 'removeQueries');
    mockDeleteTableV2.mockResolvedValue({ deleted_game_count: 0 });
    const { result, unmount } = await renderHook(() => useDeleteTable(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ tableKey: 'direct-table-key' });
    });

    expect(removeQueries).toHaveBeenCalledWith({
      queryKey: ['/api/v2/tables/direct-table-key/dashboard'],
      exact: true,
    });
    expect(invalidateQueries).not.toHaveBeenCalled();
    unmount();
  });

  it('卓削除失敗時はキャッシュを除去せずエラー通知する', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const removeQueries = jest.spyOn(queryClient, 'removeQueries');
    const invalidateQueries = jest.spyOn(queryClient, 'invalidateQueries').mockResolvedValue();
    const error = new Error('delete failed');
    mockDeleteTableV2.mockRejectedValue(error);
    const { result, unmount } = await renderHook(() => useDeleteTable(), { wrapper });
    await act(async () => {
      await expect(
        result.current.mutateAsync({ tableKey: 'key', tournamentKey: 'tournament-key' }),
      ).rejects.toBe(error);
    });
    expect(removeQueries).not.toHaveBeenCalled();
    expect(invalidateQueries).not.toHaveBeenCalled();
    expect(mockShowError).toHaveBeenCalledWith(expect.objectContaining({ error }));
    await unmount();
    consoleError.mockRestore();
  });
});

describe('卓参加者とチップ卓削除', () => {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { gcTime: Infinity, retry: false } },
  });
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
  });

  it('参加者追加・削除成功時に参加者とdashboardを無効化する', async () => {
    const invalidateQueries = jest.spyOn(queryClient, 'invalidateQueries').mockResolvedValue();
    mockPostTablePlayers.mockResolvedValue(undefined);
    mockDeleteTablePlayer.mockResolvedValue(undefined);
    const added = await renderHook(() => useAddTablePlayer(), { wrapper });
    await act(async () =>
      added.result.current.mutateAsync({ tableKey: 'key', tablePlayersItem: [{ player_id: 7 }] }),
    );
    expect(mockPostTablePlayers).toHaveBeenCalledWith('key', {
      players: [{ player_id: 7 }],
    });
    expect(invalidateQueries).toHaveBeenCalledTimes(2);
    await added.unmount();

    invalidateQueries.mockClear();
    const deleted = await renderHook(() => useDeleteTablePlayer(), { wrapper });
    await act(async () =>
      deleted.result.current.mutateAsync({ tableKey: 'key', playerId: 7 }),
    );
    expect(mockDeleteTablePlayer).toHaveBeenCalledWith('key', 7);
    expect(invalidateQueries).toHaveBeenCalledTimes(2);
    await deleted.unmount();
  });

  it('参加者追加失敗時はinvalidateせずエラー通知する', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const invalidateQueries = jest.spyOn(queryClient, 'invalidateQueries').mockResolvedValue();
    const error = new Error('add player failed');
    mockPostTablePlayers.mockRejectedValue(error);
    const { result, unmount } = await renderHook(() => useAddTablePlayer(), { wrapper });
    await act(async () => {
      await expect(
        result.current.mutateAsync({ tableKey: 'key', tablePlayersItem: [{ player_id: 1 }] }),
      ).rejects.toBe(error);
    });
    expect(invalidateQueries).not.toHaveBeenCalled();
    expect(mockShowError).toHaveBeenCalledWith(expect.objectContaining({ error }));
    await unmount();
    consoleError.mockRestore();
  });

  it('チップ卓削除adapterは文字列キーを削除payloadへ変換する', async () => {
    mockDeleteTableV2.mockResolvedValue({ deleted_game_count: 1 });
    const { result, unmount } = await renderHook(() => useDeleteChipTableWithScores(), { wrapper });
    await act(async () => result.current.mutateAsync('chip-key'));
    expect(mockDeleteTableV2).toHaveBeenCalledWith('chip-key');
    await unmount();
  });
});
