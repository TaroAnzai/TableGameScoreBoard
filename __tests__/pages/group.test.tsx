import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import GroupPage from '@/app/group/[groupKey]';

const mockPush = jest.fn();
const mockRefetchGroup = jest.fn(() => Promise.resolve());
const mockLoadPlayers = jest.fn(() => Promise.resolve());
const mockLoadTournaments = jest.fn(() => Promise.resolve());
const mockUseGroup = jest.fn();
const mockUsePlayers = jest.fn();
const mockUseTournaments = jest.fn();

jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
  useLocalSearchParams: () => ({ groupKey: 'group-key' }),
}));
jest.mock('@/src/api/generated/mahjongApi', () => ({
  useGetApiGroupsGroupKey: () => mockUseGroup(),
}));
jest.mock('@/src/hooks/usePlayers', () => ({
  useGetPlayer: () => mockUsePlayers(),
  useCreatePlayer: () => ({ mutate: jest.fn() }),
  useDeletePlayer: () => ({ mutate: jest.fn() }),
}));
jest.mock('@/src/hooks/useTournaments', () => ({
  useGetTournaments: () => mockUseTournaments(),
  useCreateTournament: () => ({ mutateAsync: jest.fn() }),
  useDeleteTournament: () => ({ mutateAsync: jest.fn() }),
}));
jest.mock('@/src/hooks/useGroups', () => ({
  useUpdateGroup: () => ({ mutate: jest.fn() }),
}));
jest.mock('@/src/hooks/useTables', () => ({
  useCreateTable: () => ({ mutateAsync: jest.fn() }),
}));
jest.mock('@/src/storage/appStorage', () => ({
  appStorage: {
    getGroupKeys: jest.fn(() => Promise.resolve(['group-key'])),
    addGroupKey: jest.fn(),
  },
}));
jest.mock('@/components/common/AlertDialogProvider', () => ({
  useAlertDialog: () => ({ alertDialog: jest.fn() }),
}));
jest.mock('@/components/page_parts/PageTitleBar', () => {
  const { Text } = jest.requireActual('react-native');
  return ({ title }: { title: string }) => <Text>{title}</Text>;
});
jest.mock('@/components/SelectorModal', () => () => null);
jest.mock('@/components/TextInputModal', () => ({ TextInputModal: () => null }));
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
    group_links: [{ access_level: 'EDIT', short_key: 'group-key' }],
  },
  isLoading: false,
  isError: false,
  isFetching: false,
  refetch: mockRefetchGroup,
};
const playersState = {
  players: [{ id: 1, name: 'プレイヤー1' }],
  isLoadingPlayers: false,
  isErrorPlayers: false,
  isFetchingPlayers: false,
  loadPlayers: mockLoadPlayers,
};
const tournamentsState = {
  tournaments: [{ id: 1, name: '大会1', rate: 50, edit_link: 'tournament-key' }],
  isLoadingTournaments: false,
  isErrorTournaments: false,
  isFetchingTournaments: false,
  loadTournaments: mockLoadTournaments,
};

describe('グループ詳細ページ', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGroup.mockReturnValue(groupState);
    mockUsePlayers.mockReturnValue(playersState);
    mockUseTournaments.mockReturnValue(tournamentsState);
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

  it.each(['HTTPエラー', '通信エラー'])(
    '%sで大会取得に失敗すると大会セクションだけエラーにする',
    async () => {
      mockUseTournaments.mockReturnValue({
        ...tournamentsState,
        tournaments: undefined,
        isErrorTournaments: true,
      });
      await render(<GroupPage />);

      expect(screen.getAllByText(/データを取得できませんでした/)).toHaveLength(1);
      expect(screen.getByText('プレイヤー1')).toBeTruthy();
    },
  );

  it('グループ本体取得失敗では両セクションをエラーにする', async () => {
    mockUseGroup.mockReturnValue({ ...groupState, data: undefined, isError: true });
    await render(<GroupPage />);

    expect(screen.getAllByText(/データを取得できませんでした/)).toHaveLength(2);
  });

  it('大会セクションの再取得でグループと大会を取得する', async () => {
    mockUseTournaments.mockReturnValue({ ...tournamentsState, isErrorTournaments: true });
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
});
