import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import GroupPlayerStatsPage from '@/app/group/stats/[groupKey]';
import { ApiError } from '@/src/api/apiError';

const mockParams = jest.fn(() => ({ groupKey: 'group-key' }));
const loadPlayerStats = jest.fn(() => Promise.resolve());
const mockUsePlayerStats = jest.fn();

const createApiError = (kind: 'network' | 'http', status?: number) =>
  new ApiError({
    kind,
    message: 'technical error',
    url: 'https://example.com/api/groups/group-key/player-stats',
    method: 'GET',
    status,
    retryable: kind === 'network' || status === 500,
  });

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
  const MockPageTitleBar = ({ title }: { title: string }) => <Text>{title}</Text>;
  return MockPageTitleBar;
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
  playerStatsError: undefined,
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

  it.each([
    ['HTTPエラー', createApiError('http', 500), /サーバーで問題が発生しました/],
    ['通信エラー', createApiError('network'), /通信できませんでした/],
  ])('%sでは無限ローディングではなくエラーを表示する', async (_, error, message) => {
    mockUsePlayerStats.mockReturnValue({
      ...defaultState,
      playerStats: undefined,
      isErrorPlayerStats: true,
      playerStatsError: error,
    });
    await render(<GroupPlayerStatsPage />);

    expect(screen.getByText(message)).toBeTruthy();
    expect(screen.queryByText('読み込み中...')).toBeNull();
  });

  it('エラーとローディングが同時に真でもエラーを優先して表示する', async () => {
    mockUsePlayerStats.mockReturnValue({
      ...defaultState,
      playerStats: undefined,
      isLoadingPlayerStats: true,
      isErrorPlayerStats: true,
      playerStatsError: createApiError('network'),
    });
    await render(<GroupPlayerStatsPage />);

    expect(screen.getByText(/通信できませんでした/)).toBeTruthy();
    expect(screen.queryByText('読み込み中...')).toBeNull();
  });

  it('再取得ボタンで統計を再取得する', async () => {
    mockUsePlayerStats.mockReturnValue({
      ...defaultState,
      isErrorPlayerStats: true,
      playerStatsError: createApiError('network'),
    });
    await render(<GroupPlayerStatsPage />);

    fireEvent.press(screen.getByText('再取得'));
    expect(loadPlayerStats).toHaveBeenCalledTimes(1);
  });

  it('再取得中はボタンを無効化する', async () => {
    mockUsePlayerStats.mockReturnValue({
      ...defaultState,
      isErrorPlayerStats: true,
      isFetchingPlayerStats: true,
      playerStatsError: createApiError('network'),
    });
    await render(<GroupPlayerStatsPage />);

    fireEvent.press(screen.getByRole('button', { name: /再取得中/ }));
    expect(loadPlayerStats).not.toHaveBeenCalled();
  });

  it('グループが存在しない場合は専用メッセージを表示して再取得を案内しない', async () => {
    mockUsePlayerStats.mockReturnValue({
      ...defaultState,
      playerStats: undefined,
      isErrorPlayerStats: true,
      playerStatsError: createApiError('http', 404),
    });
    await render(<GroupPlayerStatsPage />);

    expect(screen.getByText(/グループが見つかりませんでした/)).toBeTruthy();
    expect(screen.queryByText('再取得')).toBeNull();
  });

  it('グループキーがない場合は不正アクセスを表示する', async () => {
    mockParams.mockReturnValue({ groupKey: '' });
    await render(<GroupPlayerStatsPage />);
    expect(screen.getByText(/不正なアクセス/)).toBeTruthy();
  });
});
