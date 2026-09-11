import { act, fireEvent, render, screen, userEvent, waitFor } from '@testing-library/react-native';
import React from 'react';

import { TextInputModal } from '@/components/TextInputModal';

const mockAlertDialog = jest.fn();
let mockOnOpenChange: ((open: boolean) => void) | undefined;

jest.mock('@/components/common/AlertDialogProvider', () => ({
  useAlertDialog: () => ({ alertDialog: mockAlertDialog }),
}));

jest.mock('@/components/ui/dialog', () => {
  const { Text, View } = jest.requireActual('react-native');
  const MockDialogText = ({ children }: { children?: React.ReactNode }) => <Text>{children}</Text>;
  return {
    Dialog: ({ onOpenChange, ...props }: { onOpenChange?: (open: boolean) => void }) => {
      mockOnOpenChange = onOpenChange;
      return <View {...props} />;
    },
    DialogContent: View,
    DialogDescription: MockDialogText,
    DialogFooter: View,
    DialogHeader: View,
    DialogTitle: MockDialogText,
  };
});

describe('TextInputModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOnOpenChange = undefined;
  });
  it('日本語IMEの変換を妨げないよう入力値をcontrolledにしない', async () => {
    const user = userEvent.setup();
    await render(
      <TextInputModal open onComfirm={jest.fn()} onClose={jest.fn()} value="初期値" title="入力" />,
    );

    const input = screen.getByTestId('primaryInput');
    expect(input.props.defaultValue).toBe('初期値');
    expect(input.props.value).toBeUndefined();

    await user.clear(input);
    await user.type(input, 'たいかい');

    // 再レンダー後もJS側からvalueを書き戻さないことを保証する。
    expect(screen.getByTestId('primaryInput').props.value).toBeUndefined();
  });

  it('空白だけの入力では確定ボタンを無効にする', async () => {
    const user = userEvent.setup();
    const onConfirm = jest.fn();
    await render(
      <TextInputModal open onComfirm={onConfirm} onClose={jest.fn()} value="" title="入力" />,
    );

    const input = screen.getByDisplayValue('');
    const confirmButton = screen.getByRole('button', { name: 'OK' });
    expect(confirmButton.props.accessibilityState).toEqual(
      expect.objectContaining({ disabled: true }),
    );

    await user.type(input, '   ');
    expect(confirmButton.props.accessibilityState).toEqual(
      expect.objectContaining({ disabled: true }),
    );
    await user.press(confirmButton);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('入力後は確定できる', async () => {
    const user = userEvent.setup();
    const onConfirm = jest.fn();
    await render(
      <TextInputModal open onComfirm={onConfirm} onClose={jest.fn()} value="" title="入力" />,
    );

    await user.type(screen.getByDisplayValue(''), '大会名');
    const confirmButton = screen.getByRole('button', { name: 'OK' });
    expect(confirmButton.props.accessibilityState).toEqual(
      expect.objectContaining({ disabled: false }),
    );
    await user.press(confirmButton);

    expect(onConfirm).toHaveBeenCalledWith('大会名', '');
  });

  it('第2入力を使用する場合は両方の入力を必須にする', async () => {
    await render(
      <TextInputModal
        open
        onComfirm={jest.fn()}
        onClose={jest.fn()}
        value="グループ名"
        twoInput
        twoValue=""
        title="入力"
      />,
    );

    expect(screen.getByRole('button', { name: 'OK' }).props.accessibilityState).toEqual(
      expect.objectContaining({ disabled: true }),
    );
  });

  it('処理中は入力内容を維持して確定・キャンセルを無効化する', async () => {
    await render(
      <TextInputModal
        open
        onComfirm={jest.fn()}
        onClose={jest.fn()}
        value="入力済み"
        title="入力"
        isPending
        pendingText="保存中..."
      />,
    );

    expect(screen.getByDisplayValue('入力済み')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'キャンセル' }).props.accessibilityState).toEqual(
      expect.objectContaining({ disabled: true }),
    );
    expect(screen.getByRole('button', { name: '保存中...' }).props.accessibilityState).toEqual(
      expect.objectContaining({ disabled: true }),
    );
  });

  it('不正なメールアドレスはエラー表示して確定しない', async () => {
    const onConfirm = jest.fn();
    await render(
      <TextInputModal
        open
        onComfirm={onConfirm}
        onClose={jest.fn()}
        value="invalid"
        title="入力"
        inputType="email"
      />,
    );
    fireEvent.press(screen.getByRole('button', { name: 'OK' }));
    await waitFor(() =>
      expect(screen.getByText('正しい形式のメールアドレスを入力してください。')).toBeTruthy(),
    );
    expect(onConfirm).not.toHaveBeenCalled();
    fireEvent.changeText(screen.getByTestId('primaryInput'), 'valid@example.com');
    await waitFor(() =>
      expect(screen.queryByText('正しい形式のメールアドレスを入力してください。')).toBeNull(),
    );
  });

  it('第2入力のメール形式も検証する', async () => {
    const onConfirm = jest.fn();
    await render(
      <TextInputModal
        open
        onComfirm={onConfirm}
        onClose={jest.fn()}
        value="グループ"
        twoInput
        twoValue="invalid"
        twoInputType="email"
        title="入力"
      />,
    );
    fireEvent.press(screen.getByRole('button', { name: 'OK' }));
    await waitFor(() =>
      expect(screen.getByText('正しい形式のメールアドレスを入力してください。')).toBeTruthy(),
    );
    expect(onConfirm).not.toHaveBeenCalled();
    fireEvent.changeText(screen.getByTestId('twoInput'), 'valid@example.com');
    await waitFor(() =>
      expect(screen.queryByText('正しい形式のメールアドレスを入力してください。')).toBeNull(),
    );
  });

  it('入力種別に応じたkeyboardとsecure設定を使う', async () => {
    await render(
      <TextInputModal
        open
        onComfirm={jest.fn()}
        onClose={jest.fn()}
        value="1"
        inputType="number"
        twoInput
        twoValue="secret"
        twoInputType="password"
        title="入力"
      />,
    );
    expect(screen.getByTestId('primaryInput').props.keyboardType).toBe('numeric');
    expect(screen.getByTestId('twoInput').props.secureTextEntry).toBe(true);
  });

  it('変更後のAndroid Backでは破棄確認を表示し、選択に応じて閉じる', async () => {
    const onClose = jest.fn();
    mockAlertDialog.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    await render(
      <TextInputModal open onComfirm={jest.fn()} onClose={onClose} value="" title="入力" />,
    );
    await fireEvent.changeText(screen.getByTestId('primaryInput'), '入力途中');

    await act(async () => mockOnOpenChange?.(false));
    await waitFor(() => expect(mockAlertDialog).toHaveBeenCalledTimes(1));
    expect(onClose).not.toHaveBeenCalled();

    await act(async () => mockOnOpenChange?.(false));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });
});
