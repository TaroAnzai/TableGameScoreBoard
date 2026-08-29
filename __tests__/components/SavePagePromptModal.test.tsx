import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
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
    mode: 'initial' as const,
    onSave: jest.fn(),
    onContinueWithoutSaving: jest.fn(),
    onCancel: jest.fn(),
  };

  it('初回表示では保存と保存せず続行のみを表示する', async () => {
    await render(<SavePagePromptModal {...defaultProps} />);

    expect(screen.getByText('このページを保存しますか？')).toBeTruthy();
    expect(screen.getByText(/ページタイトルを長押しして保存/)).toBeTruthy();
    expect(screen.getByRole('button', { name: '保存する' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '保存せず続行' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'キャンセル' })).toBeNull();
  });

  it('保存操作では保存ハンドラーを実行する', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);

    await render(<SavePagePromptModal {...defaultProps} onSave={onSave} />);

    await fireEvent.press(screen.getByRole('button', { name: '保存する' }));

    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('保存せず続行とキャンセルを別々のハンドラーへ通知する', async () => {
    const onContinueWithoutSaving = jest.fn();
    const onCancel = jest.fn();

    await render(
      <SavePagePromptModal
        {...defaultProps}
        mode="navigation"
        onContinueWithoutSaving={onContinueWithoutSaving}
        onCancel={onCancel}
      />,
    );

    await fireEvent.press(screen.getByRole('button', { name: '保存せず続行' }));

    expect(onContinueWithoutSaving).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByRole('button', { name: 'キャンセル' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('保存中は二重送信と他の操作を無効化する', async () => {
    let resolve!: () => void;
    const onSave = jest.fn(() => new Promise<void>((done) => (resolve = done)));
    await render(<SavePagePromptModal {...defaultProps} mode="navigation" onSave={onSave} />);

    fireEvent.press(screen.getByRole('button', { name: '保存する' }));
    await waitFor(() => expect(screen.getByRole('button', { name: '保存する' })).toBeDisabled());
    expect(screen.getByText('保存中...')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: '保存する' }));
    fireEvent.press(screen.getByRole('button', { name: '保存せず続行' }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(defaultProps.onContinueWithoutSaving).not.toHaveBeenCalled();
    await act(async () => resolve());
  });

  it('保存失敗を内部で処理して再試行可能に戻す', async () => {
    const onSave = jest.fn().mockRejectedValue(new Error('storage failed'));
    await render(<SavePagePromptModal {...defaultProps} onSave={onSave} />);
    fireEvent.press(screen.getByRole('button', { name: '保存する' }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByRole('button', { name: '保存する' })).not.toBeDisabled());
  });

  it('外部保存中は保存中表示にして全操作を無効化する', async () => {
    await render(<SavePagePromptModal {...defaultProps} mode="navigation" isSaving />);
    expect(screen.getByRole('button', { name: '保存する' })).toBeDisabled();
    expect(screen.getByText('保存中...')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'キャンセル' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '保存せず続行' })).toBeDisabled();
  });
});
