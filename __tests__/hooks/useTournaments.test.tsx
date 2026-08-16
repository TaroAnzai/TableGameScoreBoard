import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';
import React, { type PropsWithChildren } from 'react';

import { useCreateTournament, useUpdateTournament } from '@/src/hooks/useTournaments';

const mockPostTournament = jest.fn();
const mockPutTournament = jest.fn();

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
  postApiGroupsGroupKeyTournaments: (...args: unknown[]) => mockPostTournament(...args),
  postApiV2GroupsGroupKeyTournaments: (...args: unknown[]) => mockPostTournament(...args),
  getGetApiV2GroupsGroupKeyDashboardQueryKey: (groupKey: string) => [
    `/api/v2/groups/${groupKey}/dashboard`,
  ],
  getGetApiV2TournamentsTournamentKeyDashboardQueryKey: (tournamentKey: string) => [
    `/api/v2/tournaments/${tournamentKey}/dashboard`,
  ],
  putApiTournamentsTournamentKey: (...args: unknown[]) => mockPutTournament(...args),
}));
jest.mock('@/src/hooks/useMutationFeedback', () => ({
  useMutationFeedback: () => ({ showError: jest.fn(), showSuccess: jest.fn() }),
}));

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
    unmount();
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
    unmount();
  });
});
