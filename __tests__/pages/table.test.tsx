import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

import TablePage from '@/app/table/[tableKey]';
import { ApiError } from '@/src/api/apiError';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockDismissTo = jest.fn();
const mockAlertDialog = jest.fn(() => Promise.resolve(true));
const mockRemoveSavedLink = jest.fn(() => Promise.resolve());
const mockParams = jest.fn(
  (): { tableKey: string; parentTournamentKey?: string; parentGroupKey?: string } => ({
    tableKey: 'table-key',
    parentTournamentKey: 'tournament-key',
  }),
);
const loadDashboard = jest.fn(() => Promise.resolve());
const mockUseDashboard = jest.fn();
const mockUseDeleteTable = jest.fn();
const mockUpdateTable = jest.fn();
const mockUseSavedPage = jest.fn();
const mockAddTablePlayer = jest.fn();
const mockDeleteTablePlayer = jest.fn();
const mockCreateGame = jest.fn();
const mockUpdateGame = jest.fn();
const mockDeleteGame = jest.fn();

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
  router: {
    push: (...args: unknown[]) => mockPush(...args),
    replace: (...args: unknown[]) => mockReplace(...args),
    dismissTo: (...args: unknown[]) => mockDismissTo(...args),
  },
  useLocalSearchParams: () => mockParams(),
}));
jest.mock('@/src/hooks/useTables', () => ({
  useGetTableDashboard: () => mockUseDashboard(),
  useUpdateTable: () => ({ mutateAsync: mockUpdateTable }),
  useDeleteTable: () => mockUseDeleteTable(),
  useAddTablePlayer: () => ({ mutateAsync: mockAddTablePlayer, isPending: false }),
  useDeleteTablePlayer: () => ({ mutateAsync: mockDeleteTablePlayer, isPending: false }),
}));
jest.mock('@/src/hooks/useGames', () => ({
  useCreateGame: () => ({ mutateAsync: mockCreateGame }),
  useUpdateGame: () => ({ mutateAsync: mockUpdateGame }),
  useDeleteGame: () => ({ mutateAsync: mockDeleteGame, isPending: false }),
}));
jest.mock('@/components/common/AlertDialogProvider', () => ({
  useAlertDialog: () => ({ alertDialog: mockAlertDialog }),
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
  const { Pressable, Text, View } = jest.requireActual('react-native');
  const MockTableScoreBoard = ({
    players,
    games,
    disabled,
    onUpdateGame,
  }: {
    players: { name: string }[];
    games: { id: number }[];
    disabled: boolean;
    onUpdateGame: (
      id: number | null,
      scores: { player_id: number; score: number }[],
    ) => Promise<void>;
  }) => (
    <View>
      <Text>記録表本体</Text>
      <Text>{players[0]?.name}</Text>
      <Text>ゲーム数:{games.length}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="新規ゲームを確定"
        disabled={disabled}
        onPress={() => void onUpdateGame(null, [{ player_id: 1, score: 25000 }]).catch(() => undefined)}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="既存ゲームを確定"
        disabled={disabled}
        onPress={() => void onUpdateGame(1, [{ player_id: 1, score: 26000 }]).catch(() => undefined)}
      />
    </View>
  );
  return MockTableScoreBoard;
});
jest.mock('@/components/MultiSelectorModal', () => {
  const { Pressable } = jest.requireActual('react-native');
  return ({ onConfirm }: { onConfirm: (items: unknown[]) => Promise<void> }) => (
    <Pressable accessibilityLabel="参加者選択を確定" onPress={() => onConfirm([{ id: 2, name: '候補者2' }])} />
  );
});
jest.mock('@/components/SelectorModal', () => {
  const { Pressable } = jest.requireActual('react-native');
  return ({ title, items, onSelect }: { title: string; items: unknown[]; onSelect: (item: unknown) => Promise<void> }) => (
    <Pressable accessibilityLabel={`${title}を確定`} onPress={() => onSelect(items[0])} />
  );
});
jest.mock('@/components/SavePagePromptModal', () => ({
  SavePagePromptModal: () => null,
}));
jest.mock('@/src/hooks/useMutationFeedback', () => ({
  useMutationFeedback: () => ({ showError: jest.fn(), showSuccess: jest.fn() }),
}));
jest.mock('@/src/hooks/useBackFallback', () => ({
  useBackFallback: () => jest.fn(),
}));
jest.mock('@/src/hooks/useSavedPage', () => ({
  useSavedPage: (...args: unknown[]) => {
    mockUseSavedPage(...args);
    return {
      save: jest.fn(),
      isSaving: false,
      shouldPromptSave: false,
      savePromptMode: undefined,
      continueWithoutSaving: jest.fn(),
      completeSavePrompt: jest.fn(),
      cancelSavePrompt: jest.fn(),
    };
  },
}));
jest.mock('@/src/hooks/useSavedLinks', () => ({
  useSavedLinks: () => ({ remove: mockRemoveSavedLink }),
}));

const dashboardState = {
  dashboard: {
    table: {
      id: 1,
      tournament_id: 10,
      name: '卓1',
      type: 'NORMAL',
      table_links: [{ access_level: 'EDIT', short_key: 'table-key' }],
    },
    table_players: [{ id: 1, name: '参加者1' }],
    games: [{ id: 1, scores: [] }],
    available_tournament_players: [
      { id: 1, name: '参加者1' },
      { id: 2, name: '候補者2' },
    ],
  },
  isLoadingDashboard: false,
  isErrorDashboard: false,
  isFetchingDashboard: false,
  dashboardError: undefined,
  loadDashboard,
};

describe('卓詳細ページ', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams.mockReturnValue({
      tableKey: 'table-key',
      parentTournamentKey: 'tournament-key',
    });
    mockUseDashboard.mockReturnValue(dashboardState);
    mockUseDeleteTable.mockReturnValue({ mutateAsync: jest.fn(), isPending: false });
    mockUpdateTable.mockResolvedValue(undefined);
    mockAddTablePlayer.mockResolvedValue(undefined);
    mockDeleteTablePlayer.mockResolvedValue(undefined);
    mockCreateGame.mockResolvedValue(undefined);
    mockUpdateGame.mockResolvedValue(undefined);
    mockDeleteGame.mockResolvedValue(undefined);
  });

  it('全Query成功時に記録表を表示する', async () => {
    await render(<TablePage />);
    expect(screen.getByText('記録表本体')).toBeTruthy();
    expect(screen.getByText('参加者1')).toBeTruthy();
    expect(screen.getByText('ゲーム数:1')).toBeTruthy();
  });

  it('EDIT権限で新規・既存ゲームの確定処理を実行する', async () => {
    await render(<TablePage />);
    await fireEvent.press(screen.getByLabelText('新規ゲームを確定'));
    await fireEvent.press(screen.getByLabelText('既存ゲームを確定'));

    expect(mockCreateGame).toHaveBeenCalledWith({
      tableKey: 'table-key', tournamentKey: 'tournament-key',
      gameCreate: { scores: [{ player_id: 1, score: 25000 }] },
    });
    expect(mockUpdateGame).toHaveBeenCalledWith({
      tableKey: 'table-key', tournamentKey: 'tournament-key', gameId: 1,
      gameUpdate: { scores: [{ player_id: 1, score: 26000 }] },
    });
  });

  it('確定API失敗時はrejectされても画面を維持する', async () => {
    mockCreateGame.mockRejectedValue(new Error('save failed'));
    await render(<TablePage />);
    await fireEvent.press(screen.getByLabelText('新規ゲームを確定'));
    await waitFor(() => expect(mockCreateGame).toHaveBeenCalled());
    expect(screen.getByText('記録表本体')).toBeTruthy();
  });

  it('保存時のアクセスレベルを保存フックへ渡す', async () => {
    await render(<TablePage />);

    expect(mockUseSavedPage).toHaveBeenCalledWith(expect.objectContaining({ accessLevel: 'EDIT' }));
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
    mockUseDashboard.mockReturnValue({
      ...dashboardState,
      dashboard: {
        ...dashboardState.dashboard,
        table: { ...dashboardState.dashboard.table, name: '変更後の卓名' },
      },
    });
    await render(<TablePage />);

    expect(screen.getByText('変更後の卓名')).toBeTruthy();
    expect(screen.getByText('変更後の卓名 記録表')).toBeTruthy();
  });

  it('いずれかがローディング中ならローディングを表示する', async () => {
    mockUseDashboard.mockReturnValue({
      ...dashboardState,
      dashboard: undefined,
      isLoadingDashboard: true,
    });
    await render(<TablePage />);
    expect(screen.getAllByText('読み込み中...')).not.toHaveLength(0);
  });

  it.each([
    ['HTTPエラー', createApiError('http', 500), /サーバーで問題が発生しました/],
    ['通信エラー', createApiError('network'), /通信できませんでした/],
  ])('%sではダッシュボードのエラーを表示する', async (_, error, message) => {
    mockUseDashboard.mockReturnValue({
      ...dashboardState,
      dashboard: undefined,
      isErrorDashboard: true,
      dashboardError: error,
    });
    await render(<TablePage />);

    expect(screen.getByText(message)).toBeTruthy();
  });

  it('再取得でダッシュボードを再取得する', async () => {
    mockUseDashboard.mockReturnValue({
      ...dashboardState,
      dashboard: undefined,
      isErrorDashboard: true,
      dashboardError: createApiError('network'),
    });
    await render(<TablePage />);

    fireEvent.press(screen.getByText('再取得'));
    expect(loadDashboard).toHaveBeenCalledTimes(1);
  });

  it('再取得中はボタンを無効化する', async () => {
    mockUseDashboard.mockReturnValue({
      ...dashboardState,
      dashboard: undefined,
      isErrorDashboard: true,
      isFetchingDashboard: true,
      dashboardError: createApiError('network'),
    });
    await render(<TablePage />);

    expect(screen.getByText('再取得中...')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: /再取得中/ }));
    expect(loadDashboard).not.toHaveBeenCalled();
  });

  it('卓が存在しない場合は専用メッセージを表示して再取得を案内しない', async () => {
    mockUseDashboard.mockReturnValue({
      ...dashboardState,
      dashboard: undefined,
      isErrorDashboard: true,
      dashboardError: createApiError('http', 404),
    });
    await render(<TablePage />);

    expect(screen.getByText('卓が見つかりませんでした')).toBeTruthy();
    expect(screen.queryByText('再取得')).toBeNull();
  });

  it('VIEW権限では編集操作を無効化する', async () => {
    mockUseDashboard.mockReturnValue({
      ...dashboardState,
      dashboard: {
        ...dashboardState.dashboard,
        table: {
          ...dashboardState.dashboard.table,
          table_links: [{ access_level: 'VIEW', short_key: 'table-key' }],
        },
      },
    });
    await render(<TablePage />);

    expect(screen.queryByLabelText('プレイヤーを追加')).toBeNull();
    expect(
      screen.getByRole('button', { name: '対局データを削除' }).props.accessibilityState,
    ).toEqual(expect.objectContaining({ disabled: true }));
    fireEvent.press(screen.getByLabelText('新規ゲームを確定'));
    expect(mockCreateGame).not.toHaveBeenCalled();
  });

  it('参加者を追加・削除できる', async () => {
    await render(<TablePage />);
    await fireEvent.press(screen.getByLabelText('参加者を追加'));
    await act(async () => {
      fireEvent.press(screen.getByLabelText('参加者選択を確定'));
      await mockAddTablePlayer.mock.results[0].value;
    });
    expect(mockAddTablePlayer).toHaveBeenCalledWith({
      tableKey: 'table-key', tablePlayersItem: [{ player_id: 2 }],
    });

    await fireEvent.press(screen.getByLabelText('参加者を削除'));
    await act(async () => {
      fireEvent.press(screen.getByLabelText('削除する参加者を選択を確定'));
      await mockDeleteTablePlayer.mock.results[0].value;
    });
    expect(mockDeleteTablePlayer).toHaveBeenCalledWith({
      tableKey: 'table-key', playerId: 1,
    });
  });

  it('チップ卓ではゲーム・卓削除ボタンを表示しない', async () => {
    mockUseDashboard.mockReturnValue({
      ...dashboardState,
      dashboard: {
        ...dashboardState.dashboard,
        table: { ...dashboardState.dashboard.table, type: 'CHIP' },
      },
    });
    await render(<TablePage />);

    expect(screen.queryByText('対局を削除')).toBeNull();
    expect(screen.queryByText('卓を削除')).toBeNull();
  });

  it('卓削除成功後にSaved Linkを削除して親大会へ置き換える', async () => {
    const deleteTable = jest.fn().mockResolvedValue(undefined);
    mockUseDeleteTable.mockReturnValue({ mutateAsync: deleteTable, isPending: false });
    await render(<TablePage />);

    fireEvent.press(screen.getByText('記録表削除'));

    await waitFor(() => {
      expect(deleteTable).toHaveBeenCalledWith({
        tableKey: 'table-key',
        tournamentKey: 'tournament-key',
      });
      expect(mockRemoveSavedLink).toHaveBeenCalledWith({ type: 'table', key: 'table-key' });
      expect(mockDismissTo).toHaveBeenCalledWith({
        pathname: '/tournament/[tournamentKey]',
        params: { tournamentKey: 'tournament-key' },
      });
    });
  });

  it('卓削除をキャンセルした場合はAPIも遷移も実行しない', async () => {
    const deleteTable = jest.fn();
    mockAlertDialog.mockResolvedValueOnce(false);
    mockUseDeleteTable.mockReturnValue({ mutateAsync: deleteTable, isPending: false });
    await render(<TablePage />);
    fireEvent.press(screen.getByText('記録表削除'));
    await waitFor(() => expect(mockAlertDialog).toHaveBeenCalled());
    expect(deleteTable).not.toHaveBeenCalled();
    expect(mockDismissTo).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('卓削除API失敗時は遷移せず画面を維持する', async () => {
    const deleteTable = jest.fn().mockRejectedValue(new Error('delete failed'));
    mockUseDeleteTable.mockReturnValue({ mutateAsync: deleteTable, isPending: false });
    await render(<TablePage />);
    fireEvent.press(screen.getByText('記録表削除'));
    await waitFor(() => expect(deleteTable).toHaveBeenCalled());
    expect(mockDismissTo).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
    expect(screen.getByText('記録表本体')).toBeTruthy();
  });

  it('親大会キーがない卓を削除した場合はホームへ置き換える', async () => {
    mockParams.mockReturnValue({ tableKey: 'table-key' });
    mockUseDeleteTable.mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue(undefined),
      isPending: false,
    });
    await render(<TablePage />);

    fireEvent.press(screen.getByText('記録表削除'));

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/'));
  });

  it('大会から開いた場合は親大会への戻る操作を表示する', async () => {
    mockParams.mockReturnValue({
      tableKey: 'table-owner-key',
      parentTournamentKey: 'tournament-owner-key',
      parentGroupKey: 'group-owner-key',
    });
    mockUseDashboard.mockReturnValue(dashboardState);
    await render(<TablePage />);

    expect(screen.getByLabelText('親大会に戻る')).toBeTruthy();
  });

  it('共有リンクから卓を開いた場合は親大会への戻る操作を表示しない', async () => {
    mockParams.mockReturnValue({ tableKey: 'table-key' });
    await render(<TablePage />);

    expect(screen.queryByLabelText('親大会に戻る')).toBeNull();
  });
});
