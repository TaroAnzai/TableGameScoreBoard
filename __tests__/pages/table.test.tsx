import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import TablePage from '@/app/table/[tableKey]';

const mockPush = jest.fn();
const mockParams = jest.fn(
  (): { tableKey: string; parentTournamentKey?: string; parentGroupKey?: string } => ({
    tableKey: 'table-key',
  }),
);
const loadTable = jest.fn(() => Promise.resolve());
const loadTablePlayers = jest.fn(() => Promise.resolve());
const loadGames = jest.fn(() => Promise.resolve());
const loadTournamentPlayers = jest.fn(() => Promise.resolve());
const mockUseTable = jest.fn();
const mockUseTablePlayers = jest.fn();
const mockUseGames = jest.fn();
const mockUseTournamentPlayers = jest.fn();
const mockUseDeleteTable = jest.fn();

jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
  useLocalSearchParams: () => mockParams(),
}));
jest.mock('@/src/hooks/useTables', () => ({
  useGetTable: () => mockUseTable(),
  useGetTablePlayer: () => mockUseTablePlayers(),
  useUpdateTable: () => ({ mutate: jest.fn() }),
  useDeleteTable: () => mockUseDeleteTable(),
  useAddTablePlayer: () => ({ mutate: jest.fn() }),
  useDeleteTablePlayer: () => ({ mutate: jest.fn() }),
}));
jest.mock('@/src/hooks/useGames', () => ({
  useGetTableGames: () => mockUseGames(),
  useCreateGame: () => ({ mutate: jest.fn() }),
  useUpdateGame: () => ({ mutate: jest.fn() }),
  useDeleteGame: () => ({ mutate: jest.fn() }),
}));
jest.mock('@/src/hooks/useTournaments', () => ({
  useGetTournamentPlayers: () => mockUseTournamentPlayers(),
}));
jest.mock('@/components/common/AlertDialogProvider', () => ({
  useAlertDialog: () => ({ alertDialog: jest.fn() }),
}));
jest.mock('@/components/page_parts/PageTitleBar', () => {
  const { Pressable, Text, View } = jest.requireActual('react-native');
  return ({ title, onParentPress }: { title: string; onParentPress?: () => void }) => (
    <View>
      <Text>{title}</Text>
      <Pressable accessibilityLabel="親大会に戻る" onPress={onParentPress} />
    </View>
  );
});
jest.mock('@/components/TableScoreBoard', () => {
  const { Text } = jest.requireActual('react-native');
  return () => <Text>記録表本体</Text>;
});
jest.mock('@/components/MultiSelectorModal', () => () => null);
jest.mock('@/components/SelectorModal', () => () => null);

const tableState = {
  table: {
    id: 1,
    name: '卓1',
    type: 'NORMAL',
    parent_tournament_link: { edit_link: 'tournament-key' },
    table_links: [{ access_level: 'EDIT', short_key: 'table-key' }],
  },
  isLoadingTable: false,
  isErrorTable: false,
  isFetchingTable: false,
  loadTable,
};
const tablePlayersState = {
  players: [{ id: 1, name: '参加者1' }],
  isLoadingPlayers: false,
  isErrorPlayers: false,
  isFetchingPlayers: false,
  loadPlayers: loadTablePlayers,
};
const gamesState = {
  games: [{ id: 1, scores: [] }],
  isLoadingGames: false,
  isErrorGames: false,
  isFetchingGames: false,
  loadGames,
};
const tournamentPlayersState = {
  players: [
    { id: 1, name: '参加者1' },
    { id: 2, name: '候補者2' },
  ],
  isLoadingPlayers: false,
  isErrorPlayers: false,
  isFetchingPlayers: false,
  loadPlayers: loadTournamentPlayers,
};

describe('卓詳細ページ', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams.mockReturnValue({ tableKey: 'table-key' });
    mockUseTable.mockReturnValue(tableState);
    mockUseTablePlayers.mockReturnValue(tablePlayersState);
    mockUseGames.mockReturnValue(gamesState);
    mockUseTournamentPlayers.mockReturnValue(tournamentPlayersState);
    mockUseDeleteTable.mockReturnValue({ mutate: jest.fn(), isSuccess: false });
  });

  it('全Query成功時に記録表を表示する', async () => {
    await render(<TablePage />);
    expect(screen.getByText('記録表本体')).toBeTruthy();
  });

  it('いずれかがローディング中ならローディングを表示する', async () => {
    mockUseGames.mockReturnValue({ ...gamesState, games: undefined, isLoadingGames: true });
    await render(<TablePage />);
    expect(screen.getByText('読み込み中...')).toBeTruthy();
  });

  it.each(['HTTPエラー', '通信エラー'])('%sでは記録表セクションだけをエラー表示する', async () => {
    mockUseGames.mockReturnValue({ ...gamesState, games: undefined, isErrorGames: true });
    await render(<TablePage />);

    expect(screen.getByText(/データを取得できませんでした/)).toBeTruthy();
    expect(screen.getByText('卓1')).toBeTruthy();
  });

  it('再取得で関連するすべてのQueryを呼ぶ', async () => {
    mockUseTablePlayers.mockReturnValue({ ...tablePlayersState, isErrorPlayers: true });
    await render(<TablePage />);

    fireEvent.press(screen.getByText('再取得'));
    expect(loadTable).toHaveBeenCalledTimes(1);
    expect(loadTablePlayers).toHaveBeenCalledTimes(1);
    expect(loadGames).toHaveBeenCalledTimes(1);
    expect(loadTournamentPlayers).toHaveBeenCalledTimes(1);
  });

  it('再取得中はボタンを無効化する', async () => {
    mockUseGames.mockReturnValue({ ...gamesState, isErrorGames: true, isFetchingGames: true });
    await render(<TablePage />);

    expect(screen.getByText('再取得中...')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: /再取得中/ }));
    expect(loadGames).not.toHaveBeenCalled();
  });

  it('VIEW権限では編集操作を無効化する', async () => {
    mockUseTable.mockReturnValue({
      ...tableState,
      table: {
        ...tableState.table,
        table_links: [{ access_level: 'VIEW', short_key: 'table-key' }],
      },
    });
    await render(<TablePage />);

    expect(screen.queryByLabelText('プレイヤーを追加')).toBeNull();
    expect(
      screen.getByRole('button', { name: '対局データを削除' }).props.accessibilityState,
    ).toEqual(expect.objectContaining({ disabled: true }));
  });

  it('チップ卓ではゲーム・卓削除ボタンを表示しない', async () => {
    mockUseTable.mockReturnValue({ ...tableState, table: { ...tableState.table, type: 'CHIP' } });
    await render(<TablePage />);

    expect(screen.queryByText('対局を削除')).toBeNull();
    expect(screen.queryByText('卓を削除')).toBeNull();
  });

  it('卓削除成功後に大会へ遷移する', async () => {
    mockUseDeleteTable.mockReturnValue({ mutate: jest.fn(), isSuccess: true });
    await render(<TablePage />);

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/tournament/[tournamentKey]',
      params: { tournamentKey: 'tournament-key' },
    });
  });

  it('親大会へ戻るときはオーナーキーを優先する', async () => {
    mockUseTable.mockReturnValue({
      ...tableState,
      table: {
        ...tableState.table,
        parent_tournament_link: {
          owner_link: 'tournament-owner-key',
          edit_link: 'tournament-edit-key',
          view_link: 'tournament-view-key',
        },
      },
    });
    mockUseDeleteTable.mockReturnValue({ mutate: jest.fn(), isSuccess: true });
    await render(<TablePage />);

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/tournament/[tournamentKey]',
      params: { tournamentKey: 'tournament-owner-key' },
    });
  });

  it('大会から渡されたキーを卓から大会へ戻る際にも引き継ぐ', async () => {
    mockParams.mockReturnValue({
      tableKey: 'table-owner-key',
      parentTournamentKey: 'tournament-owner-key',
      parentGroupKey: 'group-owner-key',
    });
    mockUseTable.mockReturnValue({
      ...tableState,
      table: {
        ...tableState.table,
        parent_tournament_link: { edit_link: 'different-tournament-edit-key' },
      },
    });
    await render(<TablePage />);

    fireEvent.press(screen.getByLabelText('親大会に戻る'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/tournament/[tournamentKey]',
      params: {
        tournamentKey: 'tournament-owner-key',
        parentGroupKey: 'group-owner-key',
      },
    });
  });
});
