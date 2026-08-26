import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

import TableScoreBoard from '@/components/TableScoreBoard';
import type { Game, Table } from '@/src/api/generated/mahjongApi.schemas';

const mockModalProps = jest.fn();
jest.mock('@/components/TableScoreInputModal', () => {
  const MockTableScoreInputModal = function MockTableScoreInputModal(props: any) {
    const { Pressable, Text, View } = jest.requireActual('react-native');
    mockModalProps(props);
    return (
      <View>
        <Text>{props.game ? `existing-${props.game.id}` : 'new-game'}</Text>
        <Pressable accessibilityLabel="confirm-score" onPress={() => props.onConfirm([{ player_id: 1, score: 10 }])} />
      </View>
    );
  };

  MockTableScoreInputModal.displayName = 'MockTableScoreInputModal';
  return MockTableScoreInputModal;
});

const players = [
  { id: 1, name: 'A', group_id: 1 },
  { id: 2, name: 'B', group_id: 1 },
  { id: 3, name: 'C', group_id: 1 },
  { id: 4, name: 'D', group_id: 1 },
];
const table: Table = {
  id: 1,
  name: '卓',
  type: 'NORMAL',
  tournament_id: 1,
  parent_tournament_link: {},
};
const games: Game[] = [
  {
    id: 9,
    table_id: 1,
    game_index: 0,
    scores: [{ player_id: 1, score: 100 }, { player_id: 2, score: -100 }],
  },
];

describe('TableScoreBoard', () => {
  beforeEach(() => jest.clearAllMocks());

  it('既存局をモーダルへ渡す', async () => {
    const ui = await render(<TableScoreBoard table={table} players={players} games={games} onUpdateGame={jest.fn()} />);
    await fireEvent.press(ui.getAllByLabelText('第1局のスコアを編集')[0]);
    expect(ui.getByText('existing-9')).toBeTruthy();
  });

  it('空の行を新規局としてモーダルへ渡す', async () => {
    const ui = await render(<TableScoreBoard table={table} players={players} games={[]} onUpdateGame={jest.fn()} />);
    await fireEvent.press(ui.getAllByLabelText('第1局のスコアを編集')[0]);
    expect(ui.getByText('new-game')).toBeTruthy();
  });

  it('保存済みゲーム行と空入力行に異なるtestIDを付ける', async () => {
    const ui = await render(
      <TableScoreBoard table={table} players={players} games={games} onUpdateGame={jest.fn()} />,
    );
    expect(ui.getByTestId('game-row-9')).toBeTruthy();

    await ui.rerender(
      <TableScoreBoard table={table} players={players} games={[]} onUpdateGame={jest.fn()} />,
    );
    expect(ui.getByTestId('empty-game-row-0')).toBeTruthy();
    expect(ui.queryByTestId('game-row-9')).toBeNull();
  });

  it('保存成功時だけモーダルを閉じ、失敗時は入力モーダルを維持する', async () => {
    const update = jest.fn().mockRejectedValueOnce(new Error('failed')).mockResolvedValueOnce(undefined);
    const ui = await render(<TableScoreBoard table={table} players={players} games={games} onUpdateGame={update} />);
    await fireEvent.press(ui.getAllByLabelText('第1局のスコアを編集')[0]);
    await fireEvent.press(ui.getByLabelText('confirm-score'));
    await waitFor(() => expect(update).toHaveBeenCalledWith(9, [{ player_id: 1, score: 10 }]));
    expect(ui.getByText('existing-9')).toBeTruthy();

    await fireEvent.press(ui.getByLabelText('confirm-score'));
    await waitFor(() => expect(ui.queryByText('existing-9')).toBeNull());
  });

  it('VIEW権限相当のdisabledでは編集できず、各プレイヤー合計を表示する', async () => {
    const ui = await render(<TableScoreBoard table={table} players={players} games={games} onUpdateGame={jest.fn()} disabled />);
    expect(ui.getAllByText('100')).toHaveLength(2);
    expect(ui.getAllByText('-100')).toHaveLength(2);
    expect(ui.getAllByLabelText('第1局のスコアを編集')[0].props.accessibilityState.disabled).toBe(true);
    await fireEvent.press(ui.getAllByLabelText('第1局のスコアを編集')[0]);
    expect(mockModalProps).not.toHaveBeenCalled();
  });
});
