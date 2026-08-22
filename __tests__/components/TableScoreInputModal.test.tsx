import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import TableScoreInputModal from '@/components/TableScoreInputModal';

jest.mock('@/components/ui/dialog', () => {
  const { Text, View } = jest.requireActual('react-native');
  return {
    Dialog: View,
    DialogContent: View,
    DialogFooter: View,
    DialogHeader: View,
    DialogTitle: ({ children }: { children?: React.ReactNode }) => <Text>{children}</Text>,
  };
});

const players = [
  { id: 1, name: 'A', group_id: 1 },
  { id: 2, name: 'B', group_id: 1 },
  { id: 3, name: 'C', group_id: 1 },
  { id: 4, name: 'D', group_id: 1 },
];

const renderModal = async (props: Partial<React.ComponentProps<typeof TableScoreInputModal>> = {}) => {
  const onConfirm = jest.fn();
  const ui = await render(
    <TableScoreInputModal
      open
      tableType="NORMAL"
      game={null}
      gameIndex={0}
      players={players}
      onConfirm={onConfirm}
      onClose={jest.fn()}
      {...props}
    />,
  );
  return { onConfirm, ...ui };
};

describe('TableScoreInputModal', () => {
  it('全員未入力では保存できない', async () => {
    const ui = await renderModal();
    expect(ui.getByRole('button', { name: '確定' }).props.accessibilityState.disabled).toBe(true);
  });

  it('部分入力と通常卓の合計不一致では保存できない', async () => {
    const ui = await renderModal();
    await fireEvent.changeText(ui.getByTestId('score-input-1'), '100');
    expect(ui.getByText('通常卓の合計は0にしてください')).toBeTruthy();
    expect(ui.getByRole('button', { name: '確定' }).props.accessibilityState.disabled).toBe(true);
  });

  it('全員入力かつ合計0なら小数・負数・0をそのまま保存する', async () => {
    const { onConfirm, ...ui } = await renderModal();
    for (const [index, score] of ['1.5', '-1.5', '0', '0'].entries()) {
      await fireEvent.changeText(ui.getByTestId(`score-input-${index + 1}`), score);
    }

    await fireEvent.press(ui.getByRole('button', { name: '確定' }));
    expect(onConfirm).toHaveBeenCalledWith([
      { player_id: 1, score: 1.5 },
      { player_id: 2, score: -1.5 },
      { player_id: 3, score: 0 },
      { player_id: 4, score: 0 },
    ]);
  });

  it('保存中は入力・確定・キャンセルを無効化する', async () => {
    const ui = await renderModal({ isSaving: true });
    expect(ui.getByTestId('score-input-1').props.editable).toBe(false);
    expect(ui.getByRole('button', { name: '保存中…' }).props.accessibilityState.disabled).toBe(true);
    expect(ui.getByRole('button', { name: 'キャンセル' }).props.accessibilityState.disabled).toBe(true);
  });
});
