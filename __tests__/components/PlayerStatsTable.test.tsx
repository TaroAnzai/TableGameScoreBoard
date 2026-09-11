import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

import { PlayerStatsTable } from '@/components/PlayerStatsTable';

jest.mock('@/components/PlayerStatsModal', () => {
  const { Pressable, Text } = jest.requireActual('react-native');
  return {
    PlayerStatsModal: ({
      open,
      playerStats,
      onClose,
    }: {
      open: boolean;
      playerStats: { player_name: string };
      onClose: () => void;
    }) =>
      open ? (
        <>
          <Text>{playerStats.player_name}さんの成績</Text>
          <Pressable accessibilityLabel="詳細を閉じる" onPress={onClose} />
        </>
      ) : null,
  };
});

describe('PlayerStatsTable', () => {
  const player = {
    player_id: 1,
    player_name: 'プレイヤー1',
    tournament_count: 3,
    total_score: 12000,
    total_balance: 500,
  };

  it('横スクロール案内と数値列の単位を表示する', async () => {
    await render(<PlayerStatsTable playerStatsList={[player]} />);

    expect(screen.getByText('← 横にスクロールできます →')).toBeTruthy();
    expect(screen.getByText('参加回数（大会）')).toBeTruthy();
    expect(screen.getByText('合計得点（点）')).toBeTruthy();
    expect(screen.getByText('収支\n（チップ・換算含む）')).toBeTruthy();
  });

  it('行全体からプレイヤー詳細を開ける', async () => {
    await render(<PlayerStatsTable playerStatsList={[player]} />);

    await fireEvent.press(screen.getByRole('button', { name: 'プレイヤー1さんの詳細を表示' }));
    expect(screen.getByText('プレイヤー1さんの成績')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('詳細を閉じる'));
    await waitFor(() => expect(screen.queryByText('プレイヤー1さんの成績')).toBeNull());
  });

  it('集計値が欠損している場合は0として表示する', async () => {
    await render(
      <PlayerStatsTable
        playerStatsList={[
          {
            ...player,
            tournament_count: undefined,
            total_score: undefined,
            total_balance: undefined,
          },
        ]}
      />,
    );
    expect(screen.getAllByText('0')).toHaveLength(3);
  });
});
