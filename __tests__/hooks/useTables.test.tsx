import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';
import React, { type PropsWithChildren } from 'react';

import { useCreateTable, useUpdateTable } from '@/src/hooks/useTables';

const mockPush = jest.fn();
const mockPostTable = jest.fn();
const mockPutTable = jest.fn();

jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
}));
jest.mock('@/src/api/generated/mahjongApi', () => ({
  postApiTournamentsTournamentKeyTables: (...args: unknown[]) => mockPostTable(...args),
  putApiTablesTableKey: (...args: unknown[]) => mockPutTable(...args),
  getGetApiTablesTableKeyQueryOptions: (tableKey: string) => ({
    queryKey: [`/api/tables/${tableKey}`],
  }),
  getGetApiTournamentsTournamentKeyTablesQueryKey: (tournamentKey: string) => [
    `/api/tournaments/${tournamentKey}/tables`,
  ],
  getGetApiTournamentsTournamentKeyScoreMapQueryKey: (tournamentKey: string) => [
    `/api/tournaments/${tournamentKey}/score_map`,
  ],
}));
jest.mock('@/src/hooks/useMutationFeedback', () => ({
  useMutationFeedback: () => ({ showError: jest.fn(), showSuccess: jest.fn() }),
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
    expect(invalidateQueries).toHaveBeenCalledTimes(2);
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/table/[tableKey]',
      params: {
        tableKey: 'new-table-owner-key',
        parentTournamentKey: 'tournament-owner-key',
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

  it('テーブル名更新後にテーブル詳細・記録用紙一覧・大会スコアボードを無効化する', async () => {
    const invalidateQueries = jest.spyOn(queryClient, 'invalidateQueries').mockResolvedValue();
    mockPutTable.mockResolvedValue({ name: '変更後の卓名' });
    const { result, unmount } = await renderHook(() => useUpdateTable(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        tableKey: 'table-owner-key',
        tournamentKey: 'tournament-owner-key',
        tableUpdate: { name: '変更後の卓名' },
      });
    });

    expect(mockPutTable).toHaveBeenCalledWith('table-owner-key', { name: '変更後の卓名' });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['/api/tables/table-owner-key'],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['/api/tournaments/tournament-owner-key/tables'],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['/api/tournaments/tournament-owner-key/score_map'],
    });
    expect(invalidateQueries).toHaveBeenCalledTimes(3);
    unmount();
  });
});
