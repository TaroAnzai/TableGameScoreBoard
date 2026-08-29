import { act, fireEvent, render, screen, userEvent, waitFor } from '@testing-library/react-native';
import React from 'react';

import GroupPage from '@/app/group/[groupKey]';
import { ApiError } from '@/src/api/apiError';

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockDispatch = jest.fn();
const mockAddListener = jest.fn((_event: string, _listener: (event: NavigationEvent) => void) =>
  jest.fn(),
);
const mockAlertDialog = jest.fn(() => Promise.resolve(false));
const mockGetGroupKeys = jest.fn(() => Promise.resolve(['group-key']));
const mockAddGroupKey = jest.fn((_groupKey: string) => Promise.resolve());
const mockRefetchGroup = jest.fn(() => Promise.resolve());
const mockLoadPlayers = jest.fn(() => Promise.resolve());
const mockLoadTournaments = jest.fn(() => Promise.resolve());
const mockUseGroup = jest.fn();
const mockUsePlayers = jest.fn();
const mockUseTournaments = jest.fn();
const mockCreatePlayer = jest.fn();
const mockDeletePlayer = jest.fn();
const mockCreateTournament = jest.fn();
const mockDeleteTournament = jest.fn();
const mockCreateChipTable = jest.fn();
const mockPlayerMutations = jest.fn();
const mockTournamentMutations = jest.fn();
const mockRemoveSavedLink = jest.fn(() => Promise.resolve());
const mockUpdateGroup = jest.fn();

const createApiError = (kind: 'network' | 'http', status?: number) =>
  new ApiError({
    kind,
    message: 'technical error',
    url: 'https://example.com/api/groups/group-key',
    method: 'GET',
    status,
    retryable: kind === 'network' || status === 500,
  });

type NavigationEvent = {
  data: { action: { type: string } };
  preventDefault: () => void;
};

jest.mock('expo-router', () => ({
  router: {
    back: () => mockBack(),
    push: (...args: unknown[]) => mockPush(...args),
    replace: (...args: unknown[]) => mockReplace(...args),
  },
  useLocalSearchParams: () => ({ groupKey: 'group-key' }),
  useNavigation: () => ({ addListener: mockAddListener, dispatch: mockDispatch }),
}));
jest.mock('@/src/api/generated/mahjongApi', () => ({
  useGetApiGroupsGroupKey: () => mockUseGroup(),
}));
jest.mock('@/src/hooks/usePlayers', () => ({
  useGetPlayer: () => mockUsePlayers(),
  useCreatePlayer: () => mockPlayerMutations().create,
  useDeletePlayer: () => mockPlayerMutations().delete,
}));
jest.mock('@/src/hooks/useTournaments', () => ({
  useGetTournaments: () => mockUseTournaments(),
  useCreateTournament: () => mockTournamentMutations().create,
  useDeleteTournament: () => mockTournamentMutations().delete,
}));
jest.mock('@/src/hooks/useGroups', () => ({
  useGetGroupDashboard: () => mockUseGroup(),
  useUpdateGroup: () => ({ mutateAsync: mockUpdateGroup }),
}));
jest.mock('@/src/hooks/useTables', () => ({
  useCreateTable: () => ({ mutateAsync: mockCreateChipTable, isPending: false }),
}));
jest.mock('@/src/hooks/useSavedLinks', () => ({
  useSavedLinks: () => ({ remove: mockRemoveSavedLink }),
}));
jest.mock('@/src/storage/appStorage', () => ({
  appStorage: {
    getGroupKeys: () => mockGetGroupKeys(),
    addGroupKey: (groupKey: string) => mockAddGroupKey(groupKey),
  },
}));
jest.mock('@/components/common/AlertDialogProvider', () => ({
  useAlertDialog: () => ({ alertDialog: mockAlertDialog }),
}));
jest.mock('@/components/page_parts/PageTitleBar', () => {
  const { Pressable, Text, View } = jest.requireActual('react-native');
  return function MockPageTitleBar({
    title,
    onParentPress,
    onTitleChange,
  }: {
    title: string;
    onParentPress?: () => void;
    onTitleChange?: (newTitle: string) => void;
  }) {
    return (
      <View>
        <Text>{title}</Text>
        <Pressable accessibilityLabel="親ページに戻る" onPress={onParentPress} />
        {onTitleChange && (
          <Pressable accessibilityLabel="タイトルを編集" onPress={() => onTitleChange('変更後')} />
        )}
      </View>
    );
  };
});
jest.mock('@/components/SelectorModal', () => {
  const { Pressable, Text, View } = jest.requireActual('react-native');
  return function MockSelectorModal({
    open,
    items,
    onSelect,
    onClose,
    pendingText,
  }: {
    open: boolean;
    items?: { id: string | number; name: string }[];
    onSelect: (item: { id: string | number; name: string }) => void;
    pendingText?: string;
    onClose?: () => void;
  }) {
    if (!open) return null;
    return (
      <View accessibilityLabel="選択モーダル">
        {pendingText && <Text>{pendingText}</Text>}
        {items?.map((item) => (
          <Pressable
            key={item.id}
            accessibilityLabel={`${item.name}を選択`}
            onPress={() => onSelect(item)}
          />
        ))}
        <Pressable accessibilityLabel="選択モーダルを閉じる" onPress={onClose} />
      </View>
    );
  };
});
jest.mock('@/components/TextInputModal', () => {
  const { Pressable } = jest.requireActual('react-native');
  return {
    TextInputModal: ({ open, title, onComfirm, onClose }: any) =>
      open ? (
        <>
          <Pressable accessibilityLabel={`${title}を確定`} onPress={() => onComfirm('新規名称')} />
          <Pressable accessibilityLabel={`${title}を閉じる`} onPress={onClose} />
        </>
      ) : null,
  };
});
jest.mock('@/components/MahjongListItem', () => {
  const { Text } = jest.requireActual('react-native');
  return {
    MahjongListItem: ({ title, onPress }: { title: string; onPress?: () => void }) => (
      <Text accessibilityRole={onPress ? 'button' : undefined} onPress={onPress}>
        {title}
      </Text>
    ),
  };
});
jest.mock('@/components/ui/tabs', () => {
  const { Pressable, View } = jest.requireActual('react-native');
  return {
    Tabs: ({ children }: React.PropsWithChildren) => <View>{children}</View>,
    TabsList: ({ children }: React.PropsWithChildren) => <View>{children}</View>,
    TabsTrigger: ({ children }: React.PropsWithChildren) => <Pressable>{children}</Pressable>,
    TabsContent: ({ children }: React.PropsWithChildren) => <View>{children}</View>,
  };
});

const groupState = {
  data: {
    id: 1,
    name: 'テストグループ',
    group_links: [{ access_level: 'OWNER', short_key: 'group-key' }],
  },
  isLoading: false,
  isError: false,
  isFetching: false,
  error: undefined,
  refetch: mockRefetchGroup,
};
const playersState = {
  players: [{ id: 1, name: 'プレイヤー1' }],
  isLoadingPlayers: false,
  isErrorPlayers: false,
  isFetchingPlayers: false,
  playersError: undefined,
  loadPlayers: mockLoadPlayers,
};
const tournamentsState = {
  tournaments: [{ id: 1, name: '大会1', rate: 50, edit_link: 'tournament-key' }],
  isLoadingTournaments: false,
  isErrorTournaments: false,
  isFetchingTournaments: false,
  tournamentsError: undefined,
  loadTournaments: mockLoadTournaments,
};

describe('グループ詳細ページ', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGroup.mockReturnValue(groupState);
    mockUsePlayers.mockReturnValue(playersState);
    mockUseTournaments.mockReturnValue(tournamentsState);
    mockPlayerMutations.mockReturnValue({
      create: { mutateAsync: mockCreatePlayer, isPending: false },
      delete: { mutateAsync: mockDeletePlayer, isPending: false },
    });
    mockTournamentMutations.mockReturnValue({
      create: { mutateAsync: mockCreateTournament, isPending: false },
      delete: { mutateAsync: mockDeleteTournament, isPending: false },
    });
    mockCreatePlayer.mockResolvedValue(undefined);
    mockDeletePlayer.mockResolvedValue(undefined);
    mockCreateTournament.mockResolvedValue({ tournament: { edit_link: 'new-tournament-key' } });
    mockDeleteTournament.mockResolvedValue(undefined);
    mockCreateChipTable.mockResolvedValue(undefined);
    mockUpdateGroup.mockResolvedValue(undefined);
    mockGetGroupKeys.mockResolvedValue(['group-key']);
    mockAlertDialog.mockResolvedValue(false);
  });

  it('正常時は大会とメンバーを表示し、大会へ遷移できる', async () => {
    await render(<GroupPage />);

    expect(screen.getByText('プレイヤー1')).toBeTruthy();
    fireEvent.press(screen.getByText('大会1'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/tournament/[tournamentKey]',
      params: { tournamentKey: 'tournament-key', parentGroupKey: 'group-key' },
    });
  });

  it('オーナーで大会を開くとオーナーキーを引き継ぐ', async () => {
    mockUseTournaments.mockReturnValue({
      ...tournamentsState,
      tournaments: [
        {
          ...tournamentsState.tournaments[0],
          owner_link: 'tournament-owner-key',
          edit_link: 'tournament-edit-key',
          view_link: 'tournament-view-key',
        },
      ],
    });
    await render(<GroupPage />);

    fireEvent.press(screen.getByText('大会1'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/tournament/[tournamentKey]',
      params: { tournamentKey: 'tournament-owner-key', parentGroupKey: 'group-key' },
    });
  });

  it('ローディング中は対象セクションにローディングを表示する', async () => {
    mockUseTournaments.mockReturnValue({
      ...tournamentsState,
      tournaments: undefined,
      isLoadingTournaments: true,
    });
    await render(<GroupPage />);

    expect(screen.getByText('読み込み中...')).toBeTruthy();
    expect(screen.getByText('プレイヤー1')).toBeTruthy();
  });

  it.each([
    ['HTTPエラー', createApiError('http', 500), /サーバーで問題が発生しました/],
    ['通信エラー', createApiError('network'), /通信できませんでした/],
  ])('%sで大会取得に失敗すると大会セクションだけエラーにする', async (_, error, message) => {
    mockUseTournaments.mockReturnValue({
      ...tournamentsState,
      tournaments: undefined,
      isErrorTournaments: true,
      tournamentsError: error,
    });
    await render(<GroupPage />);

    expect(screen.getAllByText(message)).toHaveLength(1);
    expect(screen.getByText('プレイヤー1')).toBeTruthy();
  });

  it('グループ本体取得失敗では両セクションをエラーにする', async () => {
    mockUseGroup.mockReturnValue({
      ...groupState,
      data: undefined,
      isError: true,
      error: createApiError('network'),
    });
    await render(<GroupPage />);

    expect(screen.getAllByText(/通信できませんでした/)).toHaveLength(2);
  });

  it('グループが存在しない場合は専用メッセージを表示して再取得を案内しない', async () => {
    mockUseGroup.mockReturnValue({
      ...groupState,
      data: undefined,
      isError: true,
      error: createApiError('http', 404),
    });
    await render(<GroupPage />);

    expect(screen.getAllByText(/グループが見つかりませんでした/)).toHaveLength(2);
    expect(screen.queryByText('再取得')).toBeNull();
  });

  it('グループが存在しない場合は取得エラーをタイトルに表示して操作を無効化する', async () => {
    mockGetGroupKeys.mockResolvedValue([]);
    mockUseGroup.mockReturnValue({
      ...groupState,
      data: undefined,
      isError: true,
      error: createApiError('http', 404),
    });
    await render(<GroupPage />);

    expect(screen.getByText('グループ取得エラー')).toBeTruthy();
    expect(await screen.findByText('アプリに登録')).toBeDisabled();
    expect(screen.getByText('成績')).toBeDisabled();
  });

  it('グループが存在しない場合は離脱警告なしでホームへ戻れる', async () => {
    mockGetGroupKeys.mockResolvedValue([]);
    mockUseGroup.mockReturnValue({
      ...groupState,
      data: undefined,
      isError: true,
      error: createApiError('http', 404),
    });
    await render(<GroupPage />);

    fireEvent.press(screen.getByLabelText('親ページに戻る'));

    expect(mockAlertDialog).not.toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith('/');
  });

  it('大会セクションの再取得でグループと大会を取得する', async () => {
    mockUseTournaments.mockReturnValue({
      ...tournamentsState,
      isErrorTournaments: true,
      tournamentsError: createApiError('network'),
    });
    await render(<GroupPage />);

    fireEvent.press(screen.getByText('再取得'));
    expect(mockRefetchGroup).toHaveBeenCalledTimes(1);
    expect(mockLoadTournaments).toHaveBeenCalledTimes(1);
    expect(mockLoadPlayers).not.toHaveBeenCalled();
  });

  it('正常取得かつ0件ではそれぞれの空状態を表示する', async () => {
    mockUsePlayers.mockReturnValue({ ...playersState, players: [] });
    mockUseTournaments.mockReturnValue({ ...tournamentsState, tournaments: [] });
    await render(<GroupPage />);

    expect(screen.getByText('大会を＋ボタンから作成してください。')).toBeTruthy();
    expect(screen.getByText('メンバーを＋ボタンから追加してください。')).toBeTruthy();
  });

  it('VIEW権限では作成・削除操作を表示しない', async () => {
    mockUseGroup.mockReturnValue({
      ...groupState,
      data: {
        ...groupState.data,
        group_links: [{ access_level: 'VIEW', short_key: 'group-key' }],
      },
    });
    await render(<GroupPage />);

    expect(screen.queryByLabelText('大会新規作成')).toBeNull();
    expect(screen.queryByLabelText('グループメンバー追加')).toBeNull();
  });

  it('EDIT権限ではタイトル編集と大会削除を表示しない', async () => {
    mockUseGroup.mockReturnValue({
      ...groupState,
      data: {
        ...groupState.data,
        group_links: [{ access_level: 'EDIT', short_key: 'group-key' }],
      },
    });
    await render(<GroupPage />);

    expect(screen.queryByLabelText('タイトルを編集')).toBeNull();
    expect(screen.queryByLabelText('大会削除')).toBeNull();
    expect(screen.getByLabelText('大会新規作成')).toBeTruthy();
  });

  it('OWNER権限ではタイトル編集と大会削除を表示する', async () => {
    await render(<GroupPage />);

    expect(screen.getByLabelText('タイトルを編集')).toBeTruthy();
    expect(screen.getByLabelText('大会削除')).toBeTruthy();
  });

  it('作成・削除処理中は対応する操作ボタンを無効化する', async () => {
    mockPlayerMutations.mockReturnValue({
      create: { mutateAsync: mockCreatePlayer, isPending: true },
      delete: { mutateAsync: mockDeletePlayer, isPending: true },
    });
    mockTournamentMutations.mockReturnValue({
      create: { mutateAsync: mockCreateTournament, isPending: true },
      delete: { mutateAsync: mockDeleteTournament, isPending: true },
    });
    await render(<GroupPage />);

    expect(screen.getByLabelText('大会新規作成')).toBeDisabled();
    expect(screen.getByLabelText('大会削除')).toBeDisabled();
    expect(screen.getByLabelText('グループメンバー追加')).toBeDisabled();
    expect(screen.getByLabelText('削除するメンバーを選択')).toBeDisabled();
  });

  it('大会削除成功時に対応するSaved Linkを削除する', async () => {
    mockAlertDialog.mockResolvedValue(true);
    await render(<GroupPage />);

    const user = userEvent.setup();
    await user.press(screen.getByLabelText('大会削除'));
    await user.press(screen.getByLabelText('大会1を選択'));

    await waitFor(() => {
      expect(mockDeleteTournament).toHaveBeenCalledWith({ tournamentKey: 'tournament-key' });
      expect(mockRemoveSavedLink).toHaveBeenCalledWith({
        type: 'tournament',
        key: 'tournament-key',
      });
      expect(mockLoadTournaments).toHaveBeenCalledTimes(1);
    });
  });

  it('メンバー削除APIが成功するまで選択モーダルを閉じない', async () => {
    let resolveDelete: (() => void) | undefined;
    mockDeletePlayer.mockImplementationOnce(
      () => new Promise<void>((resolve) => (resolveDelete = resolve)),
    );
    await render(<GroupPage />);

    const user = userEvent.setup();
    await user.press(screen.getByLabelText('削除するメンバーを選択'));
    await user.press(screen.getByLabelText('プレイヤー1を選択'));

    expect(screen.getByLabelText('選択モーダル')).toBeTruthy();
    resolveDelete?.();
    await waitFor(() => expect(screen.queryByLabelText('選択モーダル')).toBeNull());
  });

  it('未登録のまま画面を離れる場合は警告し、キャンセルすると画面に留まる', async () => {
    mockGetGroupKeys.mockResolvedValue([]);
    await render(<GroupPage />);
    expect(await screen.findByText('アプリに登録')).toBeTruthy();

    const listener = mockAddListener.mock.calls.find(([event]) => event === 'beforeRemove')?.[1];
    const navigationEvent: NavigationEvent = {
      data: { action: { type: 'GO_BACK' } },
      preventDefault: jest.fn(),
    };
    expect(listener).toBeDefined();
    listener?.(navigationEvent);

    expect(navigationEvent.preventDefault).toHaveBeenCalledTimes(1);
    expect(mockAlertDialog).toHaveBeenCalledWith({
      title: 'グループが未登録です',
      description:
        'このグループはアプリに登録されていません。このまま画面を離れますか？\n再度開くには招待URLが必要です。',
      confirmText: '登録せずに離れる',
      cancelText: 'この画面に戻る',
      showCancelButton: true,
    });
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('未登録のまま統計画面へ進もうとした場合も警告する', async () => {
    mockGetGroupKeys.mockResolvedValue([]);
    await render(<GroupPage />);
    expect(await screen.findByText('アプリに登録')).toBeTruthy();

    fireEvent.press(screen.getByText('成績'));

    await waitFor(() => expect(mockAlertDialog).toHaveBeenCalledTimes(1));
    expect(mockPush).not.toHaveBeenCalledWith('/group/stats/group-key');
  });

  it('未登録のまま左上のホームボタンを押した場合も警告する', async () => {
    mockGetGroupKeys.mockResolvedValue([]);
    await render(<GroupPage />);
    expect(await screen.findByText('アプリに登録')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('親ページに戻る'));

    await waitFor(() => expect(mockAlertDialog).toHaveBeenCalledTimes(1));
    expect(mockReplace).not.toHaveBeenCalledWith('/');
    expect(mockBack).not.toHaveBeenCalled();
  });

  it('未登録警告で離れることを選ぶと統計画面へ遷移する', async () => {
    mockGetGroupKeys.mockResolvedValue([]);
    mockAlertDialog.mockResolvedValue(true);
    await render(<GroupPage />);
    expect(await screen.findByText('アプリに登録')).toBeTruthy();

    fireEvent.press(screen.getByText('成績'));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/group/stats/group-key'));
  });

  it('未登録警告で離れることを選ぶと元の画面遷移を実行する', async () => {
    mockGetGroupKeys.mockResolvedValue([]);
    mockAlertDialog.mockResolvedValue(true);
    await render(<GroupPage />);
    expect(await screen.findByText('アプリに登録')).toBeTruthy();

    const listener = mockAddListener.mock.calls.find(([event]) => event === 'beforeRemove')?.[1];
    const action = { type: 'GO_BACK' };
    listener?.({ data: { action }, preventDefault: jest.fn() });

    await screen.findByText('アプリに登録');
    expect(mockDispatch).toHaveBeenCalledWith(action);
  });

  it('OWNERはグループタイトルを更新できる', async () => {
    await render(<GroupPage />);
    await act(async () => {
      fireEvent.press(screen.getByLabelText('タイトルを編集'));
      await Promise.resolve();
    });
    expect(mockUpdateGroup).toHaveBeenCalledWith({
      groupKey: 'group-key',
      groupUpdate: { name: '変更後' },
    });
  });

  it('未登録グループを確認後に保存してホームへ進む', async () => {
    mockGetGroupKeys.mockResolvedValue([]);
    mockAlertDialog.mockResolvedValue(true);
    await render(<GroupPage />);
    await fireEvent.press(await screen.findByText('アプリに登録'));
    await waitFor(() => expect(mockAddGroupKey).toHaveBeenCalledWith('group-key'));
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('未登録グループの保存をキャンセルする', async () => {
    mockGetGroupKeys.mockResolvedValue([]);
    await render(<GroupPage />);
    fireEvent.press(await screen.findByText('アプリに登録'));
    await waitFor(() => expect(mockAlertDialog).toHaveBeenCalled());
    expect(mockAddGroupKey).not.toHaveBeenCalled();
  });

  it('メンバーを作成し、成功後に入力modalを閉じる', async () => {
    await render(<GroupPage />);
    fireEvent.press(screen.getByLabelText('グループメンバー追加'));
    await waitFor(() => expect(screen.getByLabelText('グループメンバー追加を確定')).toBeTruthy());
    await fireEvent.press(screen.getByLabelText('グループメンバー追加を確定'));
    await waitFor(() =>
      expect(mockCreatePlayer).toHaveBeenCalledWith({
        groupKey: 'group-key',
        player: { name: '新規名称' },
      }),
    );
    await waitFor(() => expect(screen.queryByLabelText('グループメンバー追加を確定')).toBeNull());
  });

  it('メンバー作成失敗時は入力modalを維持する', async () => {
    mockCreatePlayer.mockRejectedValueOnce(new Error('create failed'));
    await render(<GroupPage />);
    fireEvent.press(screen.getByLabelText('グループメンバー追加'));
    await waitFor(() => expect(screen.getByLabelText('グループメンバー追加を確定')).toBeTruthy());
    fireEvent.press(screen.getByLabelText('グループメンバー追加を確定'));
    await waitFor(() => expect(mockCreatePlayer).toHaveBeenCalled());
    expect(screen.getByLabelText('グループメンバー追加を確定')).toBeTruthy();
  });

  it('大会をチップ卓付きで作成して詳細へ進む', async () => {
    await render(<GroupPage />);
    fireEvent.press(screen.getByLabelText('大会新規作成'));
    await waitFor(() => expect(screen.getByLabelText('大会新規作成を確定')).toBeTruthy());
    await fireEvent.press(screen.getByLabelText('大会新規作成を確定'));
    await waitFor(() => expect(mockCreateTournament).toHaveBeenCalled());
    expect(mockCreateTournament).toHaveBeenCalledWith({
      groupKey: 'group-key',
      tournament: {
        name: '新規名称',
        initial_tables: [{ client_id: 'chip', name: 'チップ', type: 'CHIP' }],
      },
    });
    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/tournament/[tournamentKey]',
        params: { tournamentKey: 'new-tournament-key', parentGroupKey: 'group-key' },
      }),
    );
  });

  it('大会作成失敗時は入力modalを維持する', async () => {
    mockCreateTournament.mockRejectedValueOnce(new Error('create failed'));
    await render(<GroupPage />);
    fireEvent.press(screen.getByLabelText('大会新規作成'));
    await waitFor(() => expect(screen.getByLabelText('大会新規作成を確定')).toBeTruthy());
    fireEvent.press(screen.getByLabelText('大会新規作成を確定'));
    await waitFor(() => expect(mockCreateTournament).toHaveBeenCalled());
    expect(screen.getByLabelText('大会新規作成を確定')).toBeTruthy();
  });

  it('削除確認キャンセル・API失敗では大会selectorを維持する', async () => {
    await render(<GroupPage />);
    fireEvent.press(screen.getByLabelText('大会削除'));
    await waitFor(() => expect(screen.getByLabelText('大会1を選択')).toBeTruthy());
    fireEvent.press(screen.getByLabelText('大会1を選択'));
    await waitFor(() => expect(mockAlertDialog).toHaveBeenCalled());
    expect(mockDeleteTournament).not.toHaveBeenCalled();

    mockAlertDialog.mockResolvedValueOnce(true);
    mockDeleteTournament.mockRejectedValueOnce(new Error('delete failed'));
    fireEvent.press(screen.getByLabelText('大会1を選択'));
    await waitFor(() => expect(mockDeleteTournament).toHaveBeenCalled());
    expect(screen.getByLabelText('選択モーダル')).toBeTruthy();
  });
});
