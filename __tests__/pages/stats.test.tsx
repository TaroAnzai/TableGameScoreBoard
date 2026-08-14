import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import GroupPlayerStatsPage from '@/app/group/stats/[groupKey]';

const mockParams = jest.fn(() => ({ groupKey: 'group-key' }));
const loadPlayerStats = jest.fn(() => Promise.resolve());
const mockUsePlayerStats = jest.fn();

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockParams(),
  usePathname: () => '/group/stats/group-key',
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));
jest.mock('@/src/hooks/useScore', () => ({
  useGetPlayerStats: () => mockUsePlayerStats(),
}));
jest.mock('@/components/page_parts/PageTitleBar', () => {
  const { Text } = jest.requireActual('react-native');
  return ({ title }: { title: string }) => <Text>{title}</Text>;
});
jest.mock('@/components/PlayerStatsTable', () => {
  const { Text } = jest.requireActual('react-native');
  return {
    PlayerStatsTable: ({ playerStatsList }: { playerStatsList: { player_name: string }[] }) => (
      <Text>{playerStatsList.map((player) => player.player_name).join(',')}</Text>
    ),
  };
});

const defaultState = {
  playerStats: { players: [{ player_id: 1, player_name: 'プレイヤー1' }] },
  isLoadingPlayerStats: false,
  isErrorPlayerStats: false,
  isFetchingPlayerStats: false,
  loadPlayerStats,
};

describe('統計ページ', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams.mockReturnValue({ groupKey: 'group-key' });
    mockUsePlayerStats.mockReturnValue(defaultState);
  });

  it('正常取得時に統計表を表示する', async () => {
    await render(<GroupPlayerStatsPage />);
    expect(screen.getByText('プレイヤー1')).toBeTruthy();
  });

  it('初回ローディングを表示する', async () => {
    mockUsePlayerStats.mockReturnValue({
      ...defaultState,
      playerStats: undefined,
      isLoadingPlayerStats: true,
    });
    await render(<GroupPlayerStatsPage />);
    expect(screen.getByText('読み込み中...')).toBeTruthy();
  });

  it('正常取得かつ0件では空状態を表示する', async () => {
    mockUsePlayerStats.mockReturnValue({ ...defaultState, playerStats: { players: [] } });
    await render(<GroupPlayerStatsPage />);
    expect(screen.getByText('統計データがありません。')).toBeTruthy();
  });

  it.each(['HTTPエラー', '通信エラー'])(
    '%sでは無限ローディングではなくエラーを表示する',
    async () => {
      mockUsePlayerStats.mockReturnValue({
        ...defaultState,
        playerStats: undefined,
        isErrorPlayerStats: true,
      });
      await render(<GroupPlayerStatsPage />);

      expect(screen.getByText(/データを取得できませんでした/)).toBeTruthy();
      expect(screen.queryByText('読み込み中...')).toBeNull();
    },
  );

  it('エラーとローディングが同時に真でもエラーを優先して表示する', async () => {
    mockUsePlayerStats.mockReturnValue({
      ...defaultState,
      playerStats: undefined,
      isLoadingPlayerStats: true,
      isErrorPlayerStats: true,
    });
    await render(<GroupPlayerStatsPage />);

    expect(screen.getByText(/データを取得できませんでした/)).toBeTruthy();
    expect(screen.queryByText('読み込み中...')).toBeNull();
  });

  it('再取得ボタンで統計を再取得する', async () => {
    mockUsePlayerStats.mockReturnValue({ ...defaultState, isErrorPlayerStats: true });
    await render(<GroupPlayerStatsPage />);

    fireEvent.press(screen.getByText('再取得'));
    expect(loadPlayerStats).toHaveBeenCalledTimes(1);
  });

  it('再取得中はボタンを無効化する', async () => {
    mockUsePlayerStats.mockReturnValue({
      ...defaultState,
      isErrorPlayerStats: true,
      isFetchingPlayerStats: true,
    });
    await render(<GroupPlayerStatsPage />);

    fireEvent.press(screen.getByRole('button', { name: /再取得中/ }));
    expect(loadPlayerStats).not.toHaveBeenCalled();
  });

  it('グループキーがない場合は不正アクセスを表示する', async () => {
    mockParams.mockReturnValue({ groupKey: '' });
    await render(<GroupPlayerStatsPage />);
    expect(screen.getByText(/不正なアクセス/)).toBeTruthy();
  });
});
