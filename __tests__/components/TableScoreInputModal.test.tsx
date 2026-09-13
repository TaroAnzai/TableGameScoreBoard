import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

import TableScoreInputModal from '@/components/TableScoreInputModal';

const mockAlertDialog = jest.fn();
const mockInputFocusByTestId: Record<string, jest.Mock> = {};
let mockOnOpenChange: ((open: boolean) => void) | undefined;

jest.mock('@/components/common/AlertDialogProvider', () => ({
  useAlertDialog: () => ({ alertDialog: mockAlertDialog }),
}));

jest.mock('@/components/ui/input', () => {
  const React = jest.requireActual('react');
  const { TextInput } = jest.requireActual('react-native');
  return {
    Input: React.forwardRef(
      ({ testID, ...props }: { testID?: string }, ref: React.Ref<unknown>) => {
        const focus = jest.fn();
        if (testID) mockInputFocusByTestId[testID] = focus;
        React.useImperativeHandle(ref, () => ({ focus }));
        return <TextInput testID={testID} {...props} />;
      },
    ),
  };
});

jest.mock('@/components/ui/dialog', () => {
  const { Text, View } = jest.requireActual('react-native');
  return {
    Dialog: ({ onOpenChange, ...props }: { onOpenChange?: (open: boolean) => void }) => {
      mockOnOpenChange = onOpenChange;
      return <View {...props} />;
    },
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

const renderModal = async (
  props: Partial<React.ComponentProps<typeof TableScoreInputModal>> = {},
) => {
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
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mockInputFocusByTestId).forEach((testID) => delete mockInputFocusByTestId[testID]);
    mockOnOpenChange = undefined;
  });
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

  it('正の整数・負の整数・0を入力し、未入力のプレイヤーがいても保存できる', async () => {
    const { onConfirm, ...ui } = await renderModal();
    for (const [index, score] of ['100', '-100', '0'].entries()) {
      await fireEvent.changeText(ui.getByTestId(`score-input-${index + 1}`), score);
    }

    await fireEvent.press(ui.getByRole('button', { name: '確定' }));
    expect(onConfirm).toHaveBeenCalledWith([
      { player_id: 1, score: 100 },
      { player_id: 2, score: -100 },
      { player_id: 3, score: 0 },
    ]);
  });

  it('小数は入力へ反映せず確定できない', async () => {
    const ui = await renderModal({ tableType: 'CHIP' });
    fireEvent.changeText(ui.getByTestId('score-input-1'), '1.5');
    expect(ui.getByTestId('score-input-1').props.value).toBe('');
    expect(ui.getByRole('button', { name: '確定' })).toBeDisabled();
  });

  it('入力途中の負号は保持するが確定できない', async () => {
    const ui = await renderModal({ tableType: 'CHIP' });
    await fireEvent.changeText(ui.getByTestId('score-input-1'), '-');
    expect(ui.getByTestId('score-input-1').props.value).toBe('-');
    expect(ui.getByRole('button', { name: '確定' })).toBeDisabled();
  });

  it('次へで次のプレイヤーへ移動し、最後は完了で送信してフォーカスを戻さない', async () => {
    const ui = await renderModal();
    const firstInput = ui.getByTestId('score-input-1');
    const lastInput = ui.getByTestId('score-input-4');

    await fireEvent(firstInput, 'submitEditing');
    expect(mockInputFocusByTestId['score-input-2']).toHaveBeenCalledTimes(1);

    await fireEvent(lastInput, 'submitEditing');
    expect(mockInputFocusByTestId['score-input-1']).not.toHaveBeenCalled();
    expect(firstInput.props.returnKeyType).toBe('next');
    expect(firstInput.props.submitBehavior).toBe('submit');
    expect(lastInput.props.returnKeyType).toBe('done');
    expect(lastInput.props.submitBehavior).toBe('blurAndSubmit');
  });

  it('既存値をフォーカス時に全選択して置き換えやすくする', async () => {
    const ui = await renderModal({
      game: { id: 9, table_id: 1, game_index: 0, scores: [{ player_id: 1, score: 250 }] },
    });
    expect(ui.getByTestId('score-input-1').props.selectTextOnFocus).toBe(true);
  });

  it('保存中は入力・確定・キャンセルを無効化する', async () => {
    const ui = await renderModal({ isSaving: true });
    expect(ui.getByTestId('score-input-1').props.editable).toBe(false);
    expect(ui.getByRole('button', { name: '保存中…' }).props.accessibilityState.disabled).toBe(
      true,
    );
    expect(ui.getByRole('button', { name: 'キャンセル' }).props.accessibilityState.disabled).toBe(
      true,
    );
  });

  it('不正な文字列は入力へ反映しない', async () => {
    const ui = await renderModal();
    fireEvent.changeText(ui.getByTestId('score-input-1'), '12abc');
    expect(ui.getByTestId('score-input-1').props.value).toBe('');
  });

  it('既存スコアを初期表示し、負のIDの補完プレイヤーは入力対象にしない', async () => {
    const ui = await renderModal({
      players: [...players, { id: -1, name: '', group_id: 0 }],
      game: { id: 9, table_id: 1, game_index: 0, scores: [{ player_id: 1, score: 250 }] },
    });
    expect(ui.getByTestId('score-input-1').props.value).toBe('250');
    expect(ui.queryByTestId('score-input--1')).toBeNull();
  });

  it('CHIP卓では合計が0でなくても入力済みスコアを確定できる', async () => {
    const { onConfirm, ...ui } = await renderModal({ tableType: 'CHIP' });
    await fireEvent.changeText(ui.getByTestId('score-input-1'), '300');
    await fireEvent.press(ui.getByRole('button', { name: '確定' }));
    expect(onConfirm).toHaveBeenCalledWith([{ player_id: 1, score: 300 }]);
    expect(ui.queryByText('通常卓の合計は0にしてください')).toBeNull();
  });
  it('変更後のAndroid Backでは破棄確認を表示し、選択に応じて閉じる', async () => {
    const onClose = jest.fn();
    mockAlertDialog.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    const ui = await renderModal({ onClose });
    await fireEvent.changeText(ui.getByTestId('score-input-1'), '100');

    await act(async () => mockOnOpenChange?.(false));
    await waitFor(() => expect(mockAlertDialog).toHaveBeenCalledTimes(1));
    expect(onClose).not.toHaveBeenCalled();

    await act(async () => mockOnOpenChange?.(false));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it('未変更のAndroid Backでは確認せず閉じる', async () => {
    const onClose = jest.fn();
    await renderModal({ onClose });

    await act(async () => mockOnOpenChange?.(false));

    expect(mockAlertDialog).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
