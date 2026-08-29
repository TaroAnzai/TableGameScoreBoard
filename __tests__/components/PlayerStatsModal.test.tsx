import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { PlayerStatsModal } from '@/components/PlayerStatsModal';

jest.mock('@/components/ui/dialog', () => {
  const { Text, View } = jest.requireActual('react-native');
  const DialogText = ({ children }: { children?: React.ReactNode }) => <Text>{children}</Text>;
  return {
    Dialog: View,
    DialogContent: View,
    DialogDescription: DialogText,
    DialogFooter: View,
    DialogHeader: View,
    DialogTitle: DialogText,
  };
});

describe('PlayerStatsModal', () => {
  it('データがnullならmodalを表示しない', async () => {
    await render(<PlayerStatsModal open onClose={jest.fn()} playerStats={null} />);
    expect(screen.queryByText('プレイヤー成績')).toBeNull();
  });

  it('0を含む成績を表示し、null・空文字の項目を除外して閉じる', async () => {
    const onClose = jest.fn();
    await render(
      <PlayerStatsModal
        open
        onClose={onClose}
        playerStats={
          {
            player_name: '東さん',
            tournament_count: 1,
            game_count: 0,
            total_score: 12345,
            total_balance: null,
            average_rank: '',
            rank1_rate: 0.5,
            rank1_count: 2,
            rank2_count: 1,
            rank3_count: 0,
            rank4_or_lower_count: 0,
          } as never
        }
      />,
    );

    expect(screen.getByText(/東さん/)).toBeTruthy();
    expect(screen.getByText('12,345')).toBeTruthy();
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
    expect(screen.queryByText('通算収支')).toBeNull();
    await fireEvent.press(screen.getByRole('button'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
