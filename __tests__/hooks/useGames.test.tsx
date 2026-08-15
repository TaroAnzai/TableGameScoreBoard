import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';
import React, { type PropsWithChildren } from 'react';

import { useCreateGame, useDeleteGame, useUpdateGame } from '@/src/hooks/useGames';

const mockCreateGame = jest.fn();
const mockUpdateGame = jest.fn();
const mockDeleteGame = jest.fn();

jest.mock('@/src/api/generated/mahjongApi', () => ({
  postApiTablesTableKeyGames: (...args: unknown[]) => mockCreateGame(...args),
  putApiTablesTableKeyGamesGameId: (...args: unknown[]) => mockUpdateGame(...args),
  deleteApiTablesTableKeyGamesGameId: (...args: unknown[]) => mockDeleteGame(...args),
  getGetApiTablesTableKeyGamesQueryKey: (tableKey: string) => [
    `/api/tables/${tableKey}/games`,
  ],
  getGetApiTournamentsTournamentKeyScoreMapQueryKey: (tournamentKey: string) => [
    `/api/tournaments/${tournamentKey}/score_map`,
  ],
}));
jest.mock('@/src/hooks/useMutationFeedback', () => ({
  useMutationFeedback: () => ({ showError: jest.fn(), showSuccess: jest.fn() }),
}));

describe('対局変更後のキャッシュ更新', () => {
  let queryClient: QueryClient;
  let invalidateQueries: jest.SpyInstance;
  let wrapper: React.ComponentType<PropsWithChildren>;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        mutations: { gcTime: Infinity, retry: false },
        queries: { gcTime: Infinity, retry: false },
      },
    });
    invalidateQueries = jest.spyOn(queryClient, 'invalidateQueries').mockResolvedValue();
    wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    mockCreateGame.mockResolvedValue({ id: 1 });
    mockUpdateGame.mockResolvedValue({ id: 1 });
    mockDeleteGame.mockResolvedValue(undefined);
  });

  afterEach(() => {
    queryClient.clear();
  });

  it.each([
    [
      '作成',
      useCreateGame,
      () => ({
        tableKey: 'table-key',
        tournamentKey: 'tournament-key',
        gameCreate: { scores: [] },
      }),
    ],
    [
      '更新',
      useUpdateGame,
      () => ({
        tableKey: 'table-key',
        tournamentKey: 'tournament-key',
        gameId: 1,
        gameUpdate: { scores: [] },
      }),
    ],
    [
      '削除',
      useDeleteGame,
      () => ({
        tableKey: 'table-key',
        tournamentKey: 'tournament-key',
        gameId: 1,
      }),
    ],
  ])('%s後に卓と大会成績のキャッシュを無効化する', async (_, useGameMutation, variables) => {
    const { result, unmount } = await renderHook(() => useGameMutation(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(variables() as never);
    });

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['/api/tables/table-key/games'],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['/api/tournaments/tournament-key/score_map'],
    });
    unmount();
  });
});
