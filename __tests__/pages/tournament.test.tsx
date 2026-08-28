import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

import TournamentPage from '@/app/tournament/[tournamentKey]';
import { ApiError } from '@/src/api/apiError';

const mockPush = jest.fn();
const mockParams = jest.fn<{ tournamentKey: string; parentGroupKey?: string }, []>(() => ({
  tournamentKey: 'tournament-key',
  parentGroupKey: 'group-key',
}));
const loadDashboard = jest.fn(() => Promise.resolve());
const mockUseDashboard = jest.fn();
const mockAlertDialog = jest.fn(() => Promise.resolve(true));
const mockCreateTable = jest.fn();
const mockUseSavedPage = jest.fn();
let mockIsCreatingTable = false;
const mockUpdateTournament = jest.fn();
const mockAddTournamentPlayer = jest.fn();
const mockDeleteTournamentPlayer = jest.fn();

const createApiError = (kind: 'network' | 'http', status?: number) =>
  new ApiError({
    kind,
    message: 'technical error',
    url: 'https://example.com/api/tournaments/tournament-key',
    method: 'GET',
    status,
    retryable: kind === 'network' || status === 500,
  });

jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
  useLocalSearchParams: () => mockParams(),
}));
jest.mock('@/src/hooks/useTournaments', () => ({
  useGetTournamentDashboard: () => mockUseDashboard(),
  useAddTournamentPlayer: () => ({ mutateAsync: mockAddTournamentPlayer, isPending: false }),
  useDeleteTounamentsPlayer: () => ({ mutateAsync: mockDeleteTournamentPlayer, isPending: false }),
  useDeleteTournament: () => ({ mutate: jest.fn() }),
  useUpdateTournament: () => ({ mutateAsync: mockUpdateTournament, isPending: false }),
}));
jest.mock('@/src/hooks/useTables', () => ({
  useCreateTable: () => ({ mutate: mockCreateTable, isPending: mockIsCreatingTable }),
  useAddTablePlayer: () => ({ mutate: jest.fn() }),
  useDeleteChipTableWithScores: () => ({ mutateAsync: jest.fn() }),
}));
jest.mock('@/components/common/AlertDialogProvider', () => ({
  useAlertDialog: () => ({ alertDialog: mockAlertDialog }),
}));
jest.mock('@/components/page_parts/PageTitleBar', () => {
  const MockPageTitleBar = ({
    title,
    onTitleClick,
    onTitleChange,
    parentUrl,
  }: {
    title: string;
    onTitleClick?: () => void;
    onTitleChange?: (title: string) => void;
    parentUrl?: string | null;
  }) => {
    const { Pressable, Text } = jest.requireActual('react-native');
    return (
      <>
        <Text>{title}</Text>
        {parentUrl && <Pressable accessibilityLabel="親グループに戻る" />}
        {onTitleClick && (
          <Text accessibilityRole="button" onPress={onTitleClick}>
            大会名を編集
          </Text>
        )}
        {onTitleChange && (
          <Text accessibilityRole="button" onPress={() => onTitleChange('変更後の大会')}>
            大会名を直接変更
          </Text>
        )}
      </>
    );
  };
  return MockPageTitleBar;
});
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
jest.mock('@/components/EditTournamentModal', () => {
  const { Pressable } = jest.requireActual('react-native');
  return ({ onConfirm }: { onConfirm: (updates: unknown) => void }) => (
    <Pressable accessibilityLabel="大会編集を確定" onPress={() => onConfirm({ name: '編集後の大会' })} />
  );
});
jest.mock('@/components/MultiSelectorModal', () => {
  const { Pressable } = jest.requireActual('react-native');
  return ({ onConfirm }: { onConfirm: (players: unknown[]) => void }) => (
    <Pressable accessibilityLabel="大会参加者追加を確定" onPress={() => onConfirm([{ id: 2, name: '候補者2' }])} />
  );
});
jest.mock('@/components/SelectorModal', () => {
  const { Pressable } = jest.requireActual('react-native');
  return ({ items, onSelect }: { items: unknown[]; onSelect: (player: unknown) => void }) => (
    <Pressable accessibilityLabel="大会参加者削除を確定" onPress={() => onSelect(items[0])} />
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

const dashboardState = {
  dashboard: {
    tournament: {
      id: 1,
      group_id: 10,
      name: '大会1',
      rate: 50,
      tournament_links: [{ access_level: 'EDIT', short_key: 'tournament-key' }],
    },
    participants: [{ id: 1, name: '参加者1' }],
    tables: [{ id: 1, name: '卓1', type: 'NORMAL', edit_link: 'table-key' }],
    score_map: {
      players: [{ id: 1, name: '参加者1', scores: { 1: 1000 }, total: 1000 }],
      tables: [{ id: 1, name: '卓1', type: 'NORMAL' }],
    },
    available_group_players: [
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

describe('大会詳細ページ', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams.mockReturnValue({ tournamentKey: 'tournament-key', parentGroupKey: 'group-key' });
    mockIsCreatingTable = false;
    mockUseDashboard.mockReturnValue(dashboardState);
    mockUpdateTournament.mockResolvedValue(undefined);
    mockAddTournamentPlayer.mockResolvedValue(undefined);
    mockDeleteTournamentPlayer.mockResolvedValue(undefined);
  });

  it('全Query成功時にスコア表を表示して卓へ遷移する', async () => {
    await render(<TournamentPage />);

    fireEvent.press(screen.getByText('スコア表'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/table/[tableKey]',
      params: {
        tableKey: 'table-key',
        parentTournamentKey: 'tournament-key',
        parentGroupKey: 'group-key',
      },
    });
  });

  it('保存時のアクセスレベルを保存フックへ渡す', async () => {
    await render(<TournamentPage />);

    expect(mockUseSavedPage).toHaveBeenCalledWith(expect.objectContaining({ accessLevel: 'EDIT' }));
  });

  it('EDIT権限で大会名を更新できる', async () => {
    await render(<TournamentPage />);
    await fireEvent.press(screen.getByText('大会名を直接変更'));
    expect(mockUpdateTournament).toHaveBeenCalledWith({
      tournamentKey: 'tournament-key', groupKey: 'group-key',
      tournament: { name: '変更後の大会' },
    });
  });

  it('大会編集modalから更新し、失敗時もmodalを維持する', async () => {
    mockUpdateTournament.mockRejectedValue(new Error('update failed'));
    await render(<TournamentPage />);
    await fireEvent.press(screen.getByText('大会名を編集'));
    await fireEvent.press(screen.getByLabelText('大会編集を確定'));
    await waitFor(() => expect(mockUpdateTournament).toHaveBeenCalled());
    expect(screen.getByLabelText('大会編集を確定')).toBeTruthy();
  });

  it('参加者を追加できる', async () => {
    await render(<TournamentPage />);
    await fireEvent.press(screen.getByRole('button', { name: '参加者を追加' }));
    await fireEvent.press(screen.getByLabelText('大会参加者追加を確定'));
    expect(mockAddTournamentPlayer).toHaveBeenCalledWith({
      tournamentKey: 'tournament-key', players: [{ id: 2, name: '候補者2' }],
    });
  });

  it('参加者削除のCancelではAPIを呼ばず、OKでは削除する', async () => {
    mockAlertDialog.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    await render(<TournamentPage />);
    await fireEvent.press(screen.getByRole('button', { name: '参加者を削除' }));
    await fireEvent.press(screen.getByLabelText('大会参加者削除を確定'));
    expect(mockDeleteTournamentPlayer).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByLabelText('大会参加者削除を確定'));
    expect(mockDeleteTournamentPlayer).toHaveBeenCalledWith({
      tournamentKey: 'tournament-key', playerId: 1,
    });
  });

  it('グループ経由で記録用紙を作成すると親グループキーを引き継ぐ', async () => {
    await render(<TournamentPage />);

    fireEvent.press(screen.getByRole('button', { name: '記録用紙を新規作成' }));

    expect(mockCreateTable).toHaveBeenCalledWith(
      {
        tournamentKey: 'tournament-key',
        parentGroupKey: 'group-key',
        tableCreate: { name: '卓2' },
      },
      expect.objectContaining({ onSettled: expect.any(Function) }),
    );
  });

  it('直リンクの大会で記録用紙を作成すると親グループキーを付与しない', async () => {
    mockParams.mockReturnValue({ tournamentKey: 'tournament-key' });
    await render(<TournamentPage />);

    fireEvent.press(screen.getByRole('button', { name: '記録用紙を新規作成' }));

    expect(mockCreateTable).toHaveBeenCalledWith(
      {
        tournamentKey: 'tournament-key',
        tableCreate: { name: '卓2' },
      },
      expect.objectContaining({ onSettled: expect.any(Function) }),
    );
  });

  it('グループから開いた場合は親グループへの戻る操作を表示する', async () => {
    await render(<TournamentPage />);

    expect(screen.getByLabelText('親グループに戻る')).toBeTruthy();
  });

  it('共有リンクから大会を開いた場合は親グループへの戻る操作を表示しない', async () => {
    mockParams.mockReturnValue({ tournamentKey: 'tournament-key' });

    await render(<TournamentPage />);

    expect(screen.queryByLabelText('親グループに戻る')).toBeNull();
  });

  it('オーナーで卓を開くとオーナーキーを引き継ぐ', async () => {
    mockUseDashboard.mockReturnValue({
      ...dashboardState,
      dashboard: {
        ...dashboardState.dashboard,
        tables: [
          {
            ...dashboardState.dashboard.tables[0],
            owner_link: 'table-owner-key',
            edit_link: 'table-edit-key',
            view_link: 'table-view-key',
          },
        ],
      },
    });
    await render(<TournamentPage />);

    fireEvent.press(screen.getByText('スコア表'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/table/[tableKey]',
      params: {
        tableKey: 'table-owner-key',
        parentTournamentKey: 'tournament-key',
        parentGroupKey: 'group-key',
      },
    });
  });

  it('いずれかのQueryがローディング中ならローディングを表示する', async () => {
    mockUseDashboard.mockReturnValue({
      ...dashboardState,
      dashboard: undefined,
      isLoadingDashboard: true,
    });
    await render(<TournamentPage />);

    expect(screen.getByText('読み込み中...')).toBeTruthy();
  });

  it.each([
    [
      'HTTPエラー',
      {
        ...dashboardState,
        dashboard: undefined,
        isErrorDashboard: true,
        dashboardError: createApiError('http', 500),
      },
      /サーバーで問題が発生しました/,
    ],
    [
      '通信エラー',
      {
        ...dashboardState,
        dashboard: undefined,
        isErrorDashboard: true,
        dashboardError: createApiError('network'),
      },
      /通信できませんでした/,
    ],
  ])('%sではダッシュボードのエラーを表示する', async (_, errorState, message) => {
    mockUseDashboard.mockReturnValue(errorState);
    await render(<TournamentPage />);

    expect(screen.getByText(message)).toBeTruthy();
  });

  it('再取得でダッシュボードを再取得する', async () => {
    mockUseDashboard.mockReturnValue({
      ...dashboardState,
      dashboard: undefined,
      isErrorDashboard: true,
      dashboardError: createApiError('network'),
    });
    await render(<TournamentPage />);

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
    await render(<TournamentPage />);

    expect(screen.getByText('再取得中...')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: /再取得中/ }));
    expect(loadDashboard).not.toHaveBeenCalled();
  });

  it('参加者0人では空状態を表示する', async () => {
    mockUseDashboard.mockReturnValue({
      ...dashboardState,
      dashboard: { ...dashboardState.dashboard, participants: [] },
    });
    await render(<TournamentPage />);

    expect(screen.getByText('参加メンバーを＋ボタンから選択してください。')).toBeTruthy();
  });

  it('VIEW権限では大会名編集と卓作成を操作できない', async () => {
    mockUseDashboard.mockReturnValue({
      ...dashboardState,
      dashboard: {
        ...dashboardState.dashboard,
        tournament: {
          ...dashboardState.dashboard.tournament,
          tournament_links: [{ access_level: 'VIEW', short_key: 'tournament-key' }],
        },
      },
    });
    await render(<TournamentPage />);

    expect(screen.queryByText('大会名を編集')).toBeNull();
    expect(
      screen.getByRole('button', { name: '記録用紙を新規作成' }).props.accessibilityState,
    ).toEqual(expect.objectContaining({ disabled: true }));
    expect(screen.queryByDisplayValue('50')).toBeNull();
  });

  it('追加可能な参加者がいない場合は共通ダイアログを表示する', async () => {
    mockUseDashboard.mockReturnValue({
      ...dashboardState,
      dashboard: { ...dashboardState.dashboard, available_group_players: [] },
    });
    await render(<TournamentPage />);

    fireEvent.press(screen.getByRole('button', { name: '参加者を追加' }));
    expect(mockAlertDialog).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '参加者を追加できません',
        showCancelButton: false,
      }),
    );
  });

  it('大会が存在しない場合は専用メッセージを表示して再取得を案内しない', async () => {
    mockUseDashboard.mockReturnValue({
      ...dashboardState,
      dashboard: undefined,
      isErrorDashboard: true,
      dashboardError: createApiError('http', 404),
    });
    await render(<TournamentPage />);

    expect(screen.getByText(/大会が見つかりませんでした/)).toBeTruthy();
    expect(screen.queryByText('再取得')).toBeNull();
  });

  it('大会本体の一時的な取得エラーでは分類したメッセージと再取得を表示する', async () => {
    mockUseDashboard.mockReturnValue({
      ...dashboardState,
      dashboard: undefined,
      isErrorDashboard: true,
      dashboardError: createApiError('http', 500),
    });
    await render(<TournamentPage />);

    expect(screen.getByText(/サーバーで問題が発生しました/)).toBeTruthy();
    fireEvent.press(screen.getByText('再取得'));
    expect(loadDashboard).toHaveBeenCalledTimes(1);
  });

  it('卓の作成中は処理中表示にしてボタンを無効化する', async () => {
    mockIsCreatingTable = true;
    await render(<TournamentPage />);

    const button = screen.getByRole('button', { name: /記録用紙を作成中/ });
    expect(button.props.accessibilityState).toEqual(expect.objectContaining({ disabled: true }));
    fireEvent.press(button);
    expect(mockCreateTable).not.toHaveBeenCalled();
  });
});
