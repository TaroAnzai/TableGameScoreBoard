import { fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import React from 'react';

import EditTournamentModal from '@/components/EditTournamentModal';

jest.mock('@expo/ui/community/datetime-picker', () => ({
  DateTimePicker: () => null,
}));
jest.mock('@/components/common/AlertDialogProvider', () => ({
  useAlertDialog: () => ({ alertDialog: jest.fn() }),
}));
jest.mock('@/components/ui/dialog', () => {
  const { Text, View } = jest.requireActual('react-native');
  const MockDialogText = ({ children }: { children?: React.ReactNode }) => <Text>{children}</Text>;
  return {
    Dialog: View,
    DialogContent: View,
    DialogFooter: View,
    DialogHeader: View,
    DialogTitle: MockDialogText,
  };
});

const tournament = {
  id: 1,
  group_id: 1,
  name: '初期大会名',
  description: '初期メモ',
  rate: 50,
  parent_group_link: {},
  tournament_links: [],
};

describe('EditTournamentModal', () => {
  it('日本語IMEの変換を妨げないようテキスト入力をcontrolledにしない', async () => {
    await render(
      <EditTournamentModal
        open
        tournament={tournament}
        onConfirm={jest.fn()}
        onClose={jest.fn()}
      />,
    );

    const nameInput = screen.getByTestId('tournament-name-input');
    const descriptionInput = screen.getByTestId('tournament-description-input');

    expect(nameInput.props.defaultValue).toBe('初期大会名');
    expect(nameInput.props.value).toBeUndefined();
    expect(descriptionInput.props.defaultValue).toBe('初期メモ');
    expect(descriptionInput.props.value).toBeUndefined();

    await fireEvent.changeText(nameInput, 'たいかい');

    // 空欄判定による再レンダー後もJS側から未確定文字を書き戻さない。
    expect(screen.getByTestId('tournament-name-input').props.value).toBeUndefined();
  });

  it('日本語で入力した大会名とメモを保存する', async () => {
    const user = userEvent.setup();
    const onConfirm = jest.fn();
    await render(
      <EditTournamentModal
        open
        tournament={tournament}
        onConfirm={onConfirm}
        onClose={jest.fn()}
      />,
    );

    await fireEvent.changeText(screen.getByTestId('tournament-name-input'), '麻雀大会');
    await fireEvent.changeText(screen.getByTestId('tournament-description-input'), '決勝戦のメモ');
    await user.press(screen.getByRole('button', { name: '保存' }));

    expect(onConfirm).toHaveBeenCalledWith({
      name: '麻雀大会',
      description: '決勝戦のメモ',
      started_at: null,
    });
  });
});
