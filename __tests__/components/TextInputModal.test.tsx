import { render, screen, userEvent } from '@testing-library/react-native';
import React from 'react';

import { TextInputModal } from '@/components/TextInputModal';

jest.mock('@/components/ui/dialog', () => {
  const { Text, View } = jest.requireActual('react-native');
  const MockDialogText = ({ children }: { children?: React.ReactNode }) => <Text>{children}</Text>;
  return {
    Dialog: View,
    DialogContent: View,
    DialogDescription: MockDialogText,
    DialogFooter: View,
    DialogHeader: View,
    DialogTitle: MockDialogText,
  };
});

describe('TextInputModal', () => {
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
});
