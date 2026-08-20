import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import TournamentPage from '@/app/tournament/[tournamentKey]';
import { ApiError } from '@/src/api/apiError';

const mockPush = jest.fn();
const mockParams = jest.fn<{ tournamentKey: string; parentGroupKey?: string }, []>(() => ({
  tournamentKey: 'tournament-key',
  parentGroupKey: 'group-key',
}));
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
const mockAlertDialog = jest.fn(() => Promise.resolve(true));
const mockCreateTable = jest.fn();
let mockIsCreatingTable = false;

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
  useGetAvailableTournamentPlayers: () => mockUseGroupPlayers(),
  useGetTournament: () => mockUseTournament(),
  useGetTournamentPlayers: () => mockUseTournamentPlayers(),
  useAddTournamentPlayer: () => ({ mutateAsync: jest.fn() }),
  useDeleteTounamentsPlayer: () => ({ mutateAsync: jest.fn() }),
  useDeleteTournament: () => ({ mutate: jest.fn() }),
  useUpdateTournament: () => ({ mutate: jest.fn() }),
}));
jest.mock('@/src/hooks/useTables', () => ({
  useGetTables: () => mockUseTables(),
  useCreateTable: () => ({ mutate: mockCreateTable, isPending: mockIsCreatingTable }),
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
  useAlertDialog: () => ({ alertDialog: mockAlertDialog }),
}));
jest.mock('@/components/page_parts/PageTitleBar', () => {
  const MockPageTitleBar = ({
    title,
    onTitleClick,
    parentUrl,
  }: {
    title: string;
    onTitleClick?: () => void;
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
jest.mock('@/components/EditTournamentModal', () => () => null);
jest.mock('@/components/MultiSelectorModal', () => () => null);
jest.mock('@/components/SelectorModal', () => () => null);
jest.mock('@/components/SavePagePromptModal', () => ({
  SavePagePromptModal: () => null,
}));
jest.mock('@/src/hooks/useMutationFeedback', () => ({
  useMutationFeedback: () => ({ showError: jest.fn(), showSuccess: jest.fn() }),
}));
jest.mock('@/src/hooks/useSavedPage', () => ({
  useSavedPage: () => ({
    save: jest.fn(),
    isSaving: false,
    shouldPromptSave: false,
    dismissSavePrompt: jest.fn(),
  }),
}));

const tournamentState = {
  tournament: {
    id: 1,
    group_id: 10,
    name: '大会1',
    rate: 50,
    tournament_links: [{ access_level: 'EDIT', short_key: 'tournament-key' }],
  },
  isLoadingTournament: false,
  isErrorTournament: false,
  isFetchingTournament: false,
  tournamentError: undefined,
  loadTournament,
};
const playersState = {
  players: [{ id: 1, name: '参加者1' }],
  isLoadingPlayers: false,
  isErrorPlayers: false,
  isFetchingPlayers: false,
  playersError: undefined,
  loadPlayers: loadTournamentPlayers,
};
const tablesState = {
  tables: [{ id: 1, name: '卓1', type: 'NORMAL', edit_link: 'table-key' }],
  isLoadingTables: false,
  isErrorTables: false,
  isFetchingTables: false,
  tablesError: undefined,
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
  scoreMapError: undefined,
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
  playersError: undefined,
  loadPlayers: loadGroupPlayers,
};

describe('大会詳細ページ', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams.mockReturnValue({ tournamentKey: 'tournament-key', parentGroupKey: 'group-key' });
    mockIsCreatingTable = false;
    mockUseTournament.mockReturnValue(tournamentState);
    mockUseTournamentPlayers.mockReturnValue(playersState);
    mockUseTables.mockReturnValue(tablesState);
    mockUseScoreMap.mockReturnValue(scoreMapState);
    mockUseGroupPlayers.mockReturnValue(groupPlayersState);
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
    mockUseTables.mockReturnValue({
      ...tablesState,
      tables: [
        {
          ...tablesState.tables[0],
          owner_link: 'table-owner-key',
          edit_link: 'table-edit-key',
          view_link: 'table-view-key',
        },
      ],
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
    mockUseTables.mockReturnValue({ ...tablesState, tables: undefined, isLoadingTables: true });
    await render(<TournamentPage />);

    expect(screen.getByText('読み込み中...')).toBeTruthy();
  });

  it.each([
    [
      'HTTPエラー',
      {
        ...scoreMapState,
        scoreMap: undefined,
        isErrorScoreMap: true,
        scoreMapError: createApiError('http', 500),
      },
      /サーバーで問題が発生しました/,
    ],
    [
      '通信エラー',
      {
        ...scoreMapState,
        scoreMap: undefined,
        isErrorScoreMap: true,
        scoreMapError: createApiError('network'),
      },
      /通信できませんでした/,
    ],
  ])('%sではスコアセクションだけをエラー表示する', async (_, errorState, message) => {
    mockUseScoreMap.mockReturnValue(errorState);
    await render(<TournamentPage />);

    expect(screen.getByText(message)).toBeTruthy();
    expect(screen.getByText('大会1')).toBeTruthy();
  });

  it('再取得でセクションに必要なすべてのQueryを呼ぶ', async () => {
    mockUseTables.mockReturnValue({
      ...tablesState,
      isErrorTables: true,
      tablesError: createApiError('network'),
    });
    await render(<TournamentPage />);

    fireEvent.press(screen.getByText('再取得'));
    expect(loadTournament).toHaveBeenCalledTimes(1);
    expect(loadTournamentPlayers).toHaveBeenCalledTimes(1);
    expect(loadTables).toHaveBeenCalledTimes(1);
    expect(loadScoreMap).toHaveBeenCalledTimes(1);
    expect(loadGroupPlayers).toHaveBeenCalledTimes(1);
  });

  it('再取得中はボタンを無効化する', async () => {
    mockUseTables.mockReturnValue({
      ...tablesState,
      isErrorTables: true,
      isFetchingTables: true,
      tablesError: createApiError('network'),
    });
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
    expect(screen.queryByDisplayValue('50')).toBeNull();
  });

  it('追加可能な参加者がいない場合は共通ダイアログを表示する', async () => {
    mockUseGroupPlayers.mockReturnValue({
      ...groupPlayersState,
      players: [],
    });
    await render(<TournamentPage />);

    fireEvent.press(screen.getByRole('button', { name: '大会新規作成' }));
    expect(mockAlertDialog).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '参加者を追加できません',
        showCancelButton: false,
      }),
    );
  });

  it('大会が存在しない場合は専用メッセージを表示して再取得を案内しない', async () => {
    mockUseTournament.mockReturnValue({
      ...tournamentState,
      tournament: undefined,
      isErrorTournament: true,
      tournamentError: createApiError('http', 404),
    });
    await render(<TournamentPage />);

    expect(screen.getByText(/大会が見つかりませんでした/)).toBeTruthy();
    expect(screen.queryByText('再取得')).toBeNull();
  });

  it('大会本体の一時的な取得エラーでは分類したメッセージと再取得を表示する', async () => {
    mockUseTournament.mockReturnValue({
      ...tournamentState,
      tournament: undefined,
      isErrorTournament: true,
      tournamentError: createApiError('http', 500),
    });
    await render(<TournamentPage />);

    expect(screen.getByText(/サーバーで問題が発生しました/)).toBeTruthy();
    fireEvent.press(screen.getByText('再取得'));
    expect(loadTournament).toHaveBeenCalledTimes(1);
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
