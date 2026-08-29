import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import React, { type PropsWithChildren } from 'react';

import {
  useAddTournamentPlayer,
  useCreateTournament,
  useDeleteTournament,
  useDeleteTounamentsPlayer,
  useGetTournamentDashboard,
  useGetTournaments,
  useUpdateTournament,
} from '@/src/hooks/useTournaments';

const mockPostTournament = jest.fn();
const mockPutTournament = jest.fn();
const mockGetTournamentDashboard = jest.fn();
const mockGetGroupDashboard = jest.fn();
const mockDeleteTournament = jest.fn();
const mockAddPlayers = jest.fn();
const mockDeletePlayer = jest.fn();
const mockShowError = jest.fn();
const mockShowSuccess = jest.fn();

jest.mock('@/src/api/generated/mahjongApi', () => ({
  getGetApiGroupsGroupKeyTournamentsQueryKey: (groupKey: string) => [
    `/api/groups/${groupKey}/tournaments`,
  ],
  getGetApiTournamentsTournamentKeyQueryOptions: (tournamentKey: string) => ({
    queryKey: [`/api/tournaments/${tournamentKey}`],
  }),
  getGetApiTournamentsTournamentKeyScoreMapQueryOptions: (tournamentKey: string) => ({
    queryKey: [`/api/tournaments/${tournamentKey}/score_map`],
  }),
  getGetApiTournamentsTournamentKeyParticipantsQueryOptions: (tournamentKey: string) => ({
    queryKey: [`/api/tournaments/${tournamentKey}/participants`],
  }),
  postApiGroupsGroupKeyTournaments: (...args: unknown[]) => mockPostTournament(...args),
  postApiV2GroupsGroupKeyTournaments: (...args: unknown[]) => mockPostTournament(...args),
  getGetApiV2GroupsGroupKeyDashboardQueryKey: (groupKey: string) => [
    `/api/v2/groups/${groupKey}/dashboard`,
  ],
  getGetApiV2TournamentsTournamentKeyDashboardQueryKey: (tournamentKey: string) => [
    `/api/v2/tournaments/${tournamentKey}/dashboard`,
  ],
  getApiV2TournamentsTournamentKeyDashboard: (...args: unknown[]) =>
    mockGetTournamentDashboard(...args),
  getApiV2GroupsGroupKeyDashboard: (...args: unknown[]) => mockGetGroupDashboard(...args),
  putApiTournamentsTournamentKey: (...args: unknown[]) => mockPutTournament(...args),
  deleteApiTournamentsTournamentKey: (...args: unknown[]) => mockDeleteTournament(...args),
  postApiV2TournamentsTournamentKeyParticipantsbatchAdd: (...args: unknown[]) =>
    mockAddPlayers(...args),
  deleteApiV2TournamentsTournamentKeyParticipantsPlayerId: (...args: unknown[]) =>
    mockDeletePlayer(...args),
}));
jest.mock('@/src/hooks/useMutationFeedback', () => ({
  useMutationFeedback: () => ({ showError: mockShowError, showSuccess: mockShowSuccess }),
}));

const createWrapper = () => {
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

describe('useCreateTournament', () => {
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

  it('大会作成後に作成元グループの大会一覧を無効化する', async () => {
    const invalidateQueries = jest.spyOn(queryClient, 'invalidateQueries').mockResolvedValue();
    mockPostTournament.mockResolvedValue({
      tournament: { owner_link: 'new-tournament-owner-key' },
    });
    const { result, unmount } = await renderHook(() => useCreateTournament(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        groupKey: 'group-owner-key',
        tournament: { name: '大会1' },
      });
    });

    expect(mockPostTournament).toHaveBeenCalledWith('group-owner-key', { name: '大会1' });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['/api/v2/groups/group-owner-key/dashboard'],
    });
    await unmount();
  });

  it('大会作成失敗時にエラーを通知し、キャッシュを無効化しない', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const invalidateQueries = jest.spyOn(queryClient, 'invalidateQueries').mockResolvedValue();
    const error = new Error('create failed');
    mockPostTournament.mockRejectedValue(error);
    const { result, unmount } = await renderHook(() => useCreateTournament(), { wrapper });

    await act(async () => {
      await expect(
        result.current.mutateAsync({ groupKey: 'group-key', tournament: { name: '大会1' } }),
      ).rejects.toBe(error);
    });

    expect(mockShowError).toHaveBeenCalledWith(expect.objectContaining({ error }));
    expect(invalidateQueries).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalledWith('Error creating tournament:', error);
    await unmount();
    consoleError.mockRestore();
  });
});

describe('useGetTournaments', () => {
  it('グループdashboardから大会一覧を返す', async () => {
    const { queryClient, wrapper } = createWrapper();
    const tournaments = [{ id: 1, name: '大会1' }];
    mockGetGroupDashboard.mockResolvedValue({ tournaments });
    const { result, unmount } = await renderHook(() => useGetTournaments('group-key'), { wrapper });

    await waitFor(() => expect(result.current.tournaments).toEqual(tournaments));
    expect(mockGetGroupDashboard).toHaveBeenCalledWith('group-key');
    await unmount();
    queryClient.clear();
  });

  it('API失敗をerrorとして返し、空キーではAPIを呼ばない', async () => {
    const error = new Error('load failed');
    const first = createWrapper();
    mockGetGroupDashboard.mockRejectedValue(error);
    const failed = await renderHook(() => useGetTournaments('group-key'), {
      wrapper: first.wrapper,
    });
    await waitFor(() => expect(failed.result.current.tournamentsError).toBe(error));

    jest.clearAllMocks();
    const second = createWrapper();
    const disabled = await renderHook(() => useGetTournaments(''), { wrapper: second.wrapper });
    expect(disabled.result.current.isFetchingTournaments).toBe(false);
    expect(mockGetGroupDashboard).not.toHaveBeenCalled();
    await failed.unmount();
    await disabled.unmount();
    first.queryClient.clear();
    second.queryClient.clear();
  });
});

describe('useGetTournamentDashboard', () => {
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
      tournament: { id: 1, name: '大会1' },
      participants: [{ id: 10, name: '参加者1' }],
      tables: [{ id: 100, name: '卓1' }],
      score_map: { players: [], tables: [] },
      available_group_players: [{ id: 20, name: '候補者1' }],
    };
    mockGetTournamentDashboard.mockResolvedValue(dashboard);

    const { result, unmount } = await renderHook(
      () => useGetTournamentDashboard('tournament-key'),
      {
        wrapper,
      },
    );

    await waitFor(() => expect(result.current.dashboard).toEqual(dashboard));

    expect(mockGetTournamentDashboard).toHaveBeenCalledWith('tournament-key');
    await unmount();
  });

  it('dashboard取得失敗を返す', async () => {
    const error = new Error('dashboard failed');
    mockGetTournamentDashboard.mockRejectedValue(error);
    const { result, unmount } = await renderHook(() => useGetTournamentDashboard('failed-key'), { wrapper });

    await waitFor(() => expect(result.current.dashboardError).toBe(error));
    expect(result.current.isErrorDashboard).toBe(true);
    await unmount();
  });
});

describe('useUpdateTournament', () => {
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

  it('大会更新後に大会本体・スコア・親グループの大会一覧を無効化する', async () => {
    const invalidateQueries = jest.spyOn(queryClient, 'invalidateQueries').mockResolvedValue();
    mockPutTournament.mockResolvedValue({ name: '変更後の大会名' });
    const { result, unmount } = await renderHook(() => useUpdateTournament(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        tournamentKey: 'tournament-owner-key',
        groupKey: 'group-owner-key',
        tournament: { name: '変更後の大会名' },
      });
    });

    expect(mockPutTournament).toHaveBeenCalledWith('tournament-owner-key', {
      name: '変更後の大会名',
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['/api/tournaments/tournament-owner-key'],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['/api/tournaments/tournament-owner-key/score_map'],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['/api/v2/groups/group-owner-key/dashboard'],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['/api/v2/tournaments/tournament-owner-key/dashboard'],
    });
    await unmount();
  });

  it('大会更新失敗時はエラーを通知し、キャッシュを無効化しない', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const invalidateQueries = jest.spyOn(queryClient, 'invalidateQueries').mockResolvedValue();
    const error = new Error('update failed');
    mockPutTournament.mockRejectedValue(error);
    const { result, unmount } = await renderHook(() => useUpdateTournament(), { wrapper });

    await act(async () => {
      await expect(
        result.current.mutateAsync({ tournamentKey: 'key', tournament: { name: '失敗' } }),
      ).rejects.toBe(error);
    });
    expect(mockShowError).toHaveBeenCalledWith(expect.objectContaining({ error }));
    expect(invalidateQueries).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalledWith('Error updating tournament:', error);
    await unmount();
    consoleError.mockRestore();
  });

  it('親グループキーがない更新では大会関連だけを無効化する', async () => {
    const invalidateQueries = jest.spyOn(queryClient, 'invalidateQueries').mockResolvedValue();
    mockPutTournament.mockResolvedValue({ name: '変更後' });
    const { result, unmount } = await renderHook(() => useUpdateTournament(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        tournamentKey: 'tournament-key',
        tournament: { name: '変更後' },
      });
    });

    expect(invalidateQueries).toHaveBeenCalledTimes(3);
    expect(invalidateQueries).not.toHaveBeenCalledWith({
      queryKey: expect.arrayContaining(['/api/v2/groups/']),
    });
    await unmount();
  });
});

describe('大会削除・参加者mutation', () => {
  beforeEach(() => jest.clearAllMocks());

  it('大会を削除して成功通知する', async () => {
    const { queryClient, wrapper } = createWrapper();
    mockDeleteTournament.mockResolvedValue(undefined);
    const { result, unmount } = await renderHook(() => useDeleteTournament(), { wrapper });
    await act(async () => result.current.mutateAsync({ tournamentKey: 'tournament-key' }));
    expect(mockDeleteTournament).toHaveBeenCalledWith('tournament-key');
    expect(mockShowSuccess).toHaveBeenCalled();
    await unmount();
    queryClient.clear();
  });

  it('参加者追加のpayloadを組み立て、関連queryを無効化する', async () => {
    const { queryClient, wrapper } = createWrapper();
    const invalidateQueries = jest.spyOn(queryClient, 'invalidateQueries').mockResolvedValue();
    mockAddPlayers.mockResolvedValue(undefined);
    const { result, unmount } = await renderHook(() => useAddTournamentPlayer(), { wrapper });
    await act(async () =>
      result.current.mutateAsync({ tournamentKey: 'key', players: [{ id: 7, name: '七郎' }] }),
    );
    expect(mockAddPlayers).toHaveBeenCalledWith('key', { participants: [{ player_id: 7 }] });
    expect(invalidateQueries).toHaveBeenCalledTimes(3);
    await unmount();
    queryClient.clear();
  });

  it('参加者削除成功時に関連queryを無効化する', async () => {
    const { queryClient, wrapper } = createWrapper();
    const invalidateQueries = jest.spyOn(queryClient, 'invalidateQueries').mockResolvedValue();
    mockDeletePlayer.mockResolvedValue(undefined);
    const { result, unmount } = await renderHook(() => useDeleteTounamentsPlayer(), { wrapper });
    await act(async () => result.current.mutateAsync({ tournamentKey: 'key', playerId: 7 }));
    expect(mockDeletePlayer).toHaveBeenCalledWith('key', 7);
    expect(invalidateQueries).toHaveBeenCalledTimes(3);
    await unmount();
    queryClient.clear();
  });

  it('参加者追加失敗時はキャッシュを壊さずエラーを通知する', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const { queryClient, wrapper } = createWrapper();
    const invalidateQueries = jest.spyOn(queryClient, 'invalidateQueries').mockResolvedValue();
    const error = new Error('add failed');
    mockAddPlayers.mockRejectedValue(error);
    const { result, unmount } = await renderHook(() => useAddTournamentPlayer(), { wrapper });
    await act(async () => {
      await expect(
        result.current.mutateAsync({ tournamentKey: 'key', players: [{ id: 1, name: '一郎' }] }),
      ).rejects.toBe(error);
    });
    expect(invalidateQueries).not.toHaveBeenCalled();
    expect(mockShowError).toHaveBeenCalledWith(expect.objectContaining({ error }));
    expect(consoleError).toHaveBeenCalledWith('Error adding player:', error);
    await unmount();
    queryClient.clear();
    consoleError.mockRestore();
  });

  it('参加者が未指定ならAPIを呼ばず入力エラーを通知する', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const { queryClient, wrapper } = createWrapper();
    const { result, unmount } = await renderHook(() => useAddTournamentPlayer(), { wrapper });

    await act(async () => {
      await expect(
        result.current.mutateAsync({ tournamentKey: 'key', players: null } as never),
      ).rejects.toThrow('Player ID is required');
    });

    expect(mockAddPlayers).not.toHaveBeenCalled();
    expect(mockShowError).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ message: 'Player ID is required' }) }),
    );
    await unmount();
    queryClient.clear();
    consoleError.mockRestore();
  });

  it('大会削除失敗時にエラーを通知する', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const { queryClient, wrapper } = createWrapper();
    const error = new Error('delete failed');
    mockDeleteTournament.mockRejectedValue(error);
    const { result, unmount } = await renderHook(() => useDeleteTournament(), { wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync({ tournamentKey: 'key' })).rejects.toBe(error);
    });

    expect(mockShowError).toHaveBeenCalledWith(expect.objectContaining({ error }));
    expect(consoleError).toHaveBeenCalledWith('Error deleting tournament:', error);
    await unmount();
    queryClient.clear();
    consoleError.mockRestore();
  });

  it('参加者削除失敗時に関連queryを無効化せずエラーを通知する', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const { queryClient, wrapper } = createWrapper();
    const invalidateQueries = jest.spyOn(queryClient, 'invalidateQueries').mockResolvedValue();
    const error = new Error('delete player failed');
    mockDeletePlayer.mockRejectedValue(error);
    const { result, unmount } = await renderHook(() => useDeleteTounamentsPlayer(), { wrapper });

    await act(async () => {
      await expect(
        result.current.mutateAsync({ tournamentKey: 'key', playerId: 7 }),
      ).rejects.toBe(error);
    });

    expect(invalidateQueries).not.toHaveBeenCalled();
    expect(mockShowError).toHaveBeenCalledWith(expect.objectContaining({ error }));
    expect(consoleError).toHaveBeenCalledWith('Error deleting player from tournament:', error);
    await unmount();
    queryClient.clear();
    consoleError.mockRestore();
  });
});
