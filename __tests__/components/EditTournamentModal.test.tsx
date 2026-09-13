import { act, fireEvent, render, screen, userEvent, waitFor } from '@testing-library/react-native';
import React from 'react';

import EditTournamentModal from '@/components/EditTournamentModal';

jest.mock('@expo/ui/community/datetime-picker', () => ({
  DateTimePicker: ({ onValueChange, onDismiss }: any) => {
    const { Pressable } = jest.requireActual('react-native');
    return (
      <>
        <Pressable
          accessibilityLabel="日付を決定"
          onPress={() => onValueChange(undefined, new Date(2026, 7, 29))}
        />
        <Pressable accessibilityLabel="日付選択を閉じる" onPress={onDismiss} />
      </>
    );
  },
}));
const mockAlertDialog = jest.fn();
let mockOnOpenChange: ((open: boolean) => void) | undefined;

jest.mock('@/components/common/AlertDialogProvider', () => ({
  useAlertDialog: () => ({ alertDialog: mockAlertDialog }),
}));
jest.mock('@/components/ui/dialog', () => {
  const ReactLib = jest.requireActual('react');
  const { Text, View } = jest.requireActual('react-native');
  const MockDialogText = ({ children }: { children?: React.ReactNode }) => <Text>{children}</Text>;
  return {
    Dialog: ({ onOpenChange, ...props }: { onOpenChange?: (open: boolean) => void }) => {
      mockOnOpenChange = onOpenChange;
      return ReactLib.createElement(View, props);
    },
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
  beforeEach(() => {
    jest.clearAllMocks();
    mockOnOpenChange = undefined;
  });
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

  it('V2レスポンスの大会開始日を初期表示して保存時にも維持する', async () => {
    const user = userEvent.setup();
    const onConfirm = jest.fn();
    const tournamentV2 = {
      id: 1,
      group_id: 1,
      name: 'V2大会',
      description: null,
      rate: 50,
      started_at: '2026-08-10T09:00:00+09:00',
      created_at: '2026-08-01T00:00:00Z',
      tournament_links: [],
    };

    await render(
      <EditTournamentModal
        open
        tournament={tournamentV2}
        onConfirm={onConfirm}
        onClose={jest.fn()}
      />,
    );

    expect(screen.getByText('2026-08-10')).toBeTruthy();
    await user.press(screen.getByRole('button', { name: '保存' }));
    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ started_at: '2026-08-10T00:00:00.000Z' }),
    );
  });

  it('日付pickerで選択したローカル日付をUTC日付として保存する', async () => {
    const onConfirm = jest.fn().mockResolvedValue(undefined);
    await render(
      <EditTournamentModal
        open
        tournament={tournament}
        onConfirm={onConfirm}
        onClose={jest.fn()}
      />,
    );
    fireEvent.press(screen.getByLabelText('開始日を選択'));
    fireEvent.press(await screen.findByLabelText('日付を決定'));
    await waitFor(() => expect(screen.getByText('2026-08-29')).toBeTruthy());
    await fireEvent.press(screen.getByRole('button', { name: '保存' }));
    await waitFor(() =>
      expect(onConfirm).toHaveBeenCalledWith(
        expect.objectContaining({ started_at: '2026-08-29T00:00:00.000Z' }),
      ),
    );
  });

  it('日付pickerをdismissすると選択せず閉じる', async () => {
    await render(
      <EditTournamentModal
        open
        tournament={tournament}
        onConfirm={jest.fn()}
        onClose={jest.fn()}
      />,
    );
    fireEvent.press(screen.getByLabelText('開始日を選択'));
    fireEvent.press(await screen.findByLabelText('日付選択を閉じる'));
    await waitFor(() => expect(screen.queryByLabelText('日付を決定')).toBeNull());
  });

  it('空白だけの大会名では保存を無効化する', async () => {
    const onConfirm = jest.fn();
    await render(
      <EditTournamentModal
        open
        tournament={tournament}
        onConfirm={onConfirm}
        onClose={jest.fn()}
      />,
    );
    fireEvent.changeText(screen.getByTestId('tournament-name-input'), '   ');
    await waitFor(() => expect(screen.getByRole('button', { name: '保存' })).toBeDisabled());
    const save = screen.getByRole('button', { name: '保存' });
    expect(save).toBeDisabled();
    fireEvent.press(save);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('外部pending中は入力・閉じる・保存を無効化して表示を切り替える', async () => {
    const onClose = jest.fn();
    await render(
      <EditTournamentModal
        open
        tournament={tournament}
        onConfirm={jest.fn()}
        onClose={onClose}
        isPending
        pendingText="大会を保存中"
      />,
    );
    expect(screen.getByText('大会を保存中')).toBeTruthy();
    expect(screen.getByTestId('tournament-name-input').props.editable).toBe(false);
    fireEvent.press(screen.getByRole('button', { name: /閉/ }));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('保存中は二重送信を防ぎ、完了後に解除する', async () => {
    let resolve!: () => void;
    const onConfirm = jest.fn(() => new Promise<void>((done) => (resolve = done)));
    await render(
      <EditTournamentModal
        open
        tournament={tournament}
        onConfirm={onConfirm}
        onClose={jest.fn()}
      />,
    );
    fireEvent.press(screen.getByRole('button', { name: '保存' }));
    await waitFor(() => expect(screen.getByText(/処理中/)).toBeTruthy());
    fireEvent.press(screen.getByRole('button', { name: /処理中/ }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    await act(async () => resolve());
  });
  it('変更後のAndroid Backでは破棄確認を表示し、選択に応じて閉じる', async () => {
    const onClose = jest.fn();
    mockAlertDialog.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    await render(
      <EditTournamentModal open tournament={tournament} onConfirm={jest.fn()} onClose={onClose} />,
    );
    await fireEvent.changeText(screen.getByTestId('tournament-description-input'), '変更後');

    await act(async () => mockOnOpenChange?.(false));
    await waitFor(() => expect(mockAlertDialog).toHaveBeenCalledTimes(1));
    expect(onClose).not.toHaveBeenCalled();

    await act(async () => mockOnOpenChange?.(false));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it('未変更のAndroid Backでは確認せず閉じる', async () => {
    const onClose = jest.fn();
    await render(
      <EditTournamentModal open tournament={tournament} onConfirm={jest.fn()} onClose={onClose} />,
    );

    await act(async () => mockOnOpenChange?.(false));

    expect(mockAlertDialog).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
