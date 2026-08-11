import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import TournamentPage from '@/app/tournament/[tournamentKey]';

const mockPush = jest.fn();
const loadTournament = jest.fn(() => Promise.resolve());
const loadTournamentPlayers = jest.fn(() => Promise.resolve());
const loadTables = jest.fn(() => Promise.resolve());
const loadScoreMap = jest.fn(() => Promise.resolve());
const loadGroupPlayers = jest.fn(() => Promise.resolve());
const mockUseTournament = jest.fn();
const mockUseTournamentPlayers = jest.fn();
const mockUseTables = jest.fn();
const mockUseScoreMap = jest.fn();
const mockUseGroupPlayers = jest.fn();

jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
  useLocalSearchParams: () => ({ tournamentKey: 'tournament-key', parentGroupKey: 'group-key' }),
}));
jest.mock('@/src/hooks/useTournaments', () => ({
  useGetTournament: () => mockUseTournament(),
  useGetTournamentPlayers: () => mockUseTournamentPlayers(),
  useAddTournamentPlayer: () => ({ mutateAsync: jest.fn() }),
  useDeleteTounamentsPlayer: () => ({ mutateAsync: jest.fn() }),
  useDeleteTournament: () => ({ mutate: jest.fn() }),
  useUpdateTournament: () => ({ mutate: jest.fn() }),
}));
jest.mock('@/src/hooks/useTables', () => ({
  useGetTables: () => mockUseTables(),
  useCreateTable: () => ({ mutate: jest.fn() }),
  useAddTablePlayer: () => ({ mutate: jest.fn() }),
  useDeleteChipTableWithScores: () => ({ mutateAsync: jest.fn() }),
}));
jest.mock('@/src/hooks/useScore', () => ({
  useGetTournamentScoreMap: () => mockUseScoreMap(),
}));
jest.mock('@/src/hooks/usePlayers', () => ({
  useGetPlayer: () => mockUseGroupPlayers(),
}));
jest.mock('@/components/common/AlertDialogProvider', () => ({
  useAlertDialog: () => ({ alertDialog: jest.fn() }),
}));
jest.mock(
  '@/components/page_parts/PageTitleBar',
  () =>
    ({ title, onTitleClick }: { title: string; onTitleClick?: () => void }) => {
      const { Text } = jest.requireActual('react-native');
      return (
        <>
          <Text>{title}</Text>
          {onTitleClick && (
            <Text accessibilityRole="button" onPress={onTitleClick}>
              大会名を編集
            </Text>
          )}
        </>
      );
    },
);
jest.mock('@/components/ScoreTable', () => {
  const { Text } = jest.requireActual('react-native');
  return {
    ScoreTable: ({ onClick }: { onClick: (id: number) => void }) => (
      <Text accessibilityRole="button" onPress={() => onClick(1)}>
        スコア表
      </Text>
    ),
  };
});
jest.mock('@/components/EditTournamentModal', () => () => null);
jest.mock('@/components/MultiSelectorModal', () => () => null);
jest.mock('@/components/SelectorModal', () => () => null);

const tournamentState = {
  tournament: {
    id: 1,
    name: '大会1',
    rate: 50,
    parent_group_link: { edit_link: 'group-key' },
    tournament_links: [{ access_level: 'EDIT', short_key: 'tournament-key' }],
  },
  isLoadingTournament: false,
  isErrorTournament: false,
  isFetchingTournament: false,
  loadTournament,
};
const playersState = {
  players: [{ id: 1, name: '参加者1' }],
  isLoadingPlayers: false,
  isErrorPlayers: false,
  isFetchingPlayers: false,
  loadPlayers: loadTournamentPlayers,
};
const tablesState = {
  tables: [{ id: 1, name: '卓1', type: 'NORMAL', edit_link: 'table-key' }],
  isLoadingTables: false,
  isErrorTables: false,
  isFetchingTables: false,
  loadTables,
};
const scoreMapState = {
  scoreMap: {
    players: [{ id: 1, name: '参加者1', scores: { 1: 1000 }, total: 1000 }],
    tables: [{ id: 1, name: '卓1', type: 'NORMAL' }],
  },
  isLoadingScoreMap: false,
  isErrorScoreMap: false,
  isFetchingScoreMap: false,
  loadScoreMap,
};
const groupPlayersState = {
  players: [
    { id: 1, name: '参加者1' },
    { id: 2, name: '候補者2' },
  ],
  isLoadingPlayers: false,
  isErrorPlayers: false,
  isFetchingPlayers: false,
  loadPlayers: loadGroupPlayers,
};

describe('大会詳細ページ', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTournament.mockReturnValue(tournamentState);
    mockUseTournamentPlayers.mockReturnValue(playersState);
    mockUseTables.mockReturnValue(tablesState);
    mockUseScoreMap.mockReturnValue(scoreMapState);
    mockUseGroupPlayers.mockReturnValue(groupPlayersState);
  });

  it('全Query成功時にスコア表を表示して卓へ遷移する', async () => {
    await render(<TournamentPage />);

    fireEvent.press(screen.getByText('スコア表'));
    expect(mockPush).toHaveBeenCalledWith('/table/table-key');
  });

  it('いずれかのQueryがローディング中ならローディングを表示する', async () => {
    mockUseTables.mockReturnValue({ ...tablesState, tables: undefined, isLoadingTables: true });
    await render(<TournamentPage />);

    expect(screen.getByText('読み込み中...')).toBeTruthy();
  });

  it.each([
    ['HTTPエラー', { ...scoreMapState, scoreMap: undefined, isErrorScoreMap: true }],
    ['通信エラー', { ...scoreMapState, scoreMap: undefined, isErrorScoreMap: true }],
  ])('%sではスコアセクションだけをエラー表示する', async (_, errorState) => {
    mockUseScoreMap.mockReturnValue(errorState);
    await render(<TournamentPage />);

    expect(screen.getByText(/データを取得できませんでした/)).toBeTruthy();
    expect(screen.getByText('大会1')).toBeTruthy();
  });

  it('再取得でセクションに必要なすべてのQueryを呼ぶ', async () => {
    mockUseTables.mockReturnValue({ ...tablesState, isErrorTables: true });
    await render(<TournamentPage />);

    fireEvent.press(screen.getByText('再取得'));
    expect(loadTournament).toHaveBeenCalledTimes(1);
    expect(loadTournamentPlayers).toHaveBeenCalledTimes(1);
    expect(loadTables).toHaveBeenCalledTimes(1);
    expect(loadScoreMap).toHaveBeenCalledTimes(1);
    expect(loadGroupPlayers).toHaveBeenCalledTimes(1);
  });

  it('再取得中はボタンを無効化する', async () => {
    mockUseTables.mockReturnValue({ ...tablesState, isErrorTables: true, isFetchingTables: true });
    await render(<TournamentPage />);

    expect(screen.getByText('再取得中...')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: /再取得中/ }));
    expect(loadTables).not.toHaveBeenCalled();
  });

  it('参加者0人では空状態を表示する', async () => {
    mockUseTournamentPlayers.mockReturnValue({ ...playersState, players: [] });
    await render(<TournamentPage />);

    expect(screen.getByText('参加メンバーを＋ボタンから選択してください。')).toBeTruthy();
  });

  it('VIEW権限では大会名編集と卓作成を操作できない', async () => {
    mockUseTournament.mockReturnValue({
      ...tournamentState,
      tournament: {
        ...tournamentState.tournament,
        tournament_links: [{ access_level: 'VIEW', short_key: 'tournament-key' }],
      },
    });
    await render(<TournamentPage />);

    expect(screen.queryByText('大会名を編集')).toBeNull();
    expect(
      screen.getByRole('button', { name: '記録用紙を新規作成' }).props.accessibilityState,
    ).toEqual(expect.objectContaining({ disabled: true }));
  });
});
