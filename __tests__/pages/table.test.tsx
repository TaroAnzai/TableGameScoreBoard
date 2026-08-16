import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import TablePage from '@/app/table/[tableKey]';
import { ApiError } from '@/src/api/apiError';

const mockPush = jest.fn();
const mockParams = jest.fn(
  (): { tableKey: string; parentTournamentKey?: string; parentGroupKey?: string } => ({
    tableKey: 'table-key',
    parentTournamentKey: 'tournament-key',
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
const mockUpdateTable = jest.fn();

const createApiError = (kind: 'network' | 'http', status?: number) =>
  new ApiError({
    kind,
    message: 'technical error',
    url: 'https://example.com/api/tables/table-key',
    method: 'GET',
    status,
    retryable: kind === 'network' || status === 500,
  });

jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
  useLocalSearchParams: () => mockParams(),
}));
jest.mock('@/src/hooks/useTables', () => ({
  useGetAvailableTablePlayers: () => mockUseTournamentPlayers(),
  useGetTable: () => mockUseTable(),
  useGetTablePlayer: () => mockUseTablePlayers(),
  useUpdateTable: () => ({ mutateAsync: mockUpdateTable }),
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
  const MockPageTitleBar = ({
    title,
    parentUrl,
    onTitleChange,
  }: {
    title: string;
    parentUrl?: string | null;
    onTitleChange?: (title: string) => void;
  }) => (
    <View>
      <Text>{title}</Text>
      {onTitleChange && (
        <Pressable
          accessibilityLabel="テーブル名を変更"
          onPress={() => onTitleChange('変更後の卓名')}
        />
      )}
      {parentUrl && <Pressable accessibilityLabel="親大会に戻る" />}
    </View>
  );
  return MockPageTitleBar;
});
jest.mock('@/components/TableScoreBoard', () => {
  const { Text } = jest.requireActual('react-native');
  const MockTableScoreBoard = () => <Text>記録表本体</Text>;
  return MockTableScoreBoard;
});
jest.mock('@/components/MultiSelectorModal', () => () => null);
jest.mock('@/components/SelectorModal', () => () => null);

const tableState = {
  table: {
    id: 1,
    tournament_id: 10,
    name: '卓1',
    type: 'NORMAL',
    table_links: [{ access_level: 'EDIT', short_key: 'table-key' }],
  },
  isLoadingTable: false,
  isErrorTable: false,
  isFetchingTable: false,
  tableError: undefined,
  loadTable,
};
const tablePlayersState = {
  players: [{ id: 1, name: '参加者1' }],
  isLoadingPlayers: false,
  isErrorPlayers: false,
  isFetchingPlayers: false,
  playersError: undefined,
  loadPlayers: loadTablePlayers,
};
const gamesState = {
  games: [{ id: 1, scores: [] }],
  isLoadingGames: false,
  isErrorGames: false,
  isFetchingGames: false,
  gamesError: undefined,
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
  playersError: undefined,
  loadPlayers: loadTournamentPlayers,
};

describe('卓詳細ページ', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams.mockReturnValue({
      tableKey: 'table-key',
      parentTournamentKey: 'tournament-key',
    });
    mockUseTable.mockReturnValue(tableState);
    mockUseTablePlayers.mockReturnValue(tablePlayersState);
    mockUseGames.mockReturnValue(gamesState);
    mockUseTournamentPlayers.mockReturnValue(tournamentPlayersState);
    mockUseDeleteTable.mockReturnValue({ mutate: jest.fn(), isSuccess: false });
    mockUpdateTable.mockResolvedValue(undefined);
  });

  it('全Query成功時に記録表を表示する', async () => {
    await render(<TablePage />);
    expect(screen.getByText('記録表本体')).toBeTruthy();
  });

  it('テーブル名変更時に親大会キーを更新処理へ渡す', async () => {
    await render(<TablePage />);

    await fireEvent.press(screen.getByLabelText('テーブル名を変更'));

    expect(mockUpdateTable).toHaveBeenCalledWith({
      tableKey: 'table-key',
      tournamentKey: 'tournament-key',
      tableUpdate: { name: '変更後の卓名' },
    });
  });

  it('更新されたテーブル名をページタイトルと記録表セクションタイトルへ反映する', async () => {
    mockUseTable.mockReturnValue({
      ...tableState,
      table: { ...tableState.table, name: '変更後の卓名' },
    });
    await render(<TablePage />);

    expect(screen.getByText('変更後の卓名')).toBeTruthy();
    expect(screen.getByText('変更後の卓名 記録表')).toBeTruthy();
  });

  it('いずれかがローディング中ならローディングを表示する', async () => {
    mockUseGames.mockReturnValue({ ...gamesState, games: undefined, isLoadingGames: true });
    await render(<TablePage />);
    expect(screen.getByText('読み込み中...')).toBeTruthy();
  });

  it.each([
    ['HTTPエラー', createApiError('http', 500), /サーバーで問題が発生しました/],
    ['通信エラー', createApiError('network'), /通信できませんでした/],
  ])('%sでは記録表セクションだけをエラー表示する', async (_, error, message) => {
    mockUseGames.mockReturnValue({
      ...gamesState,
      games: undefined,
      isErrorGames: true,
      gamesError: error,
    });
    await render(<TablePage />);

    expect(screen.getByText(message)).toBeTruthy();
    expect(screen.getByText('卓1')).toBeTruthy();
  });

  it('再取得で関連するすべてのQueryを呼ぶ', async () => {
    mockUseTablePlayers.mockReturnValue({
      ...tablePlayersState,
      isErrorPlayers: true,
      playersError: createApiError('network'),
    });
    await render(<TablePage />);

    fireEvent.press(screen.getByText('再取得'));
    expect(loadTable).toHaveBeenCalledTimes(1);
    expect(loadTablePlayers).toHaveBeenCalledTimes(1);
    expect(loadGames).toHaveBeenCalledTimes(1);
    expect(loadTournamentPlayers).toHaveBeenCalledTimes(1);
  });

  it('再取得中はボタンを無効化する', async () => {
    mockUseGames.mockReturnValue({
      ...gamesState,
      isErrorGames: true,
      isFetchingGames: true,
      gamesError: createApiError('network'),
    });
    await render(<TablePage />);

    expect(screen.getByText('再取得中...')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: /再取得中/ }));
    expect(loadGames).not.toHaveBeenCalled();
  });

  it('卓が存在しない場合は専用メッセージを表示して再取得を案内しない', async () => {
    mockUseTable.mockReturnValue({
      ...tableState,
      table: undefined,
      isErrorTable: true,
      tableError: createApiError('http', 404),
    });
    await render(<TablePage />);

    expect(screen.getByText('卓が見つかりませんでした')).toBeTruthy();
    expect(screen.queryByText('再取得')).toBeNull();
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

  it('親大会へ戻るときは親から渡されたキーを使用する', async () => {
    mockParams.mockReturnValue({
      tableKey: 'table-key',
      parentTournamentKey: 'tournament-parent-key',
    });
    mockUseDeleteTable.mockReturnValue({ mutate: jest.fn(), isSuccess: true });
    await render(<TablePage />);

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/tournament/[tournamentKey]',
      params: { tournamentKey: 'tournament-parent-key' },
    });
  });

  it('大会から開いた場合は親大会への戻る操作を表示する', async () => {
    mockParams.mockReturnValue({
      tableKey: 'table-owner-key',
      parentTournamentKey: 'tournament-owner-key',
      parentGroupKey: 'group-owner-key',
    });
    mockUseTable.mockReturnValue({
      ...tableState,
      table: { ...tableState.table },
    });
    await render(<TablePage />);

    expect(screen.getByLabelText('親大会に戻る')).toBeTruthy();
  });

  it('共有リンクから卓を開いた場合は親大会への戻る操作を表示しない', async () => {
    mockParams.mockReturnValue({ tableKey: 'table-key' });
    await render(<TablePage />);

    expect(screen.queryByLabelText('親大会に戻る')).toBeNull();
  });
});
