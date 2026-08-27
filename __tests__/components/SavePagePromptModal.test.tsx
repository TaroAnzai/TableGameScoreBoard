import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

import { SavePagePromptModal } from '@/components/SavePagePromptModal';

jest.mock('@/components/ui/dialog', () => {
  const { Text, View } = jest.requireActual('react-native');
  const MockText = ({ children }: { children?: React.ReactNode }) => <Text>{children}</Text>;

  return {
    Dialog: View,
    DialogContent: View,
    DialogDescription: MockText,
    DialogFooter: View,
    DialogHeader: View,
    DialogTitle: MockText,
  };
});

describe('SavePagePromptModal', () => {
  const defaultProps = {
    open: true,
    onSave: jest.fn(),
    onContinueWithoutSaving: jest.fn(),
    onCancel: jest.fn(),
  };

  it('保存、保存せず続行、キャンセルの操作を表示する', async () => {
    await render(<SavePagePromptModal {...defaultProps} />);

    expect(screen.getByText('このページを保存しますか？')).toBeTruthy();
    expect(screen.getByText(/ページタイトルを長押しして保存/)).toBeTruthy();
    expect(screen.getByRole('button', { name: '保存する' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '保存せず続行' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'キャンセル' })).toBeTruthy();
  });

  it('保存操作では保存ハンドラーを実行する', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    await render(<SavePagePromptModal {...defaultProps} onSave={onSave} />);

    fireEvent.press(screen.getByRole('button', { name: '保存する' }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
  });

  it('保存せず続行とキャンセルを別々のハンドラーへ通知する', async () => {
    const onContinueWithoutSaving = jest.fn();
    const onCancel = jest.fn();
    await render(
      <SavePagePromptModal
        {...defaultProps}
        onContinueWithoutSaving={onContinueWithoutSaving}
        onCancel={onCancel}
      />,
    );

    fireEvent.press(screen.getByRole('button', { name: '保存せず続行' }));
    expect(onContinueWithoutSaving).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();

    fireEvent.press(screen.getByRole('button', { name: 'キャンセル' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
