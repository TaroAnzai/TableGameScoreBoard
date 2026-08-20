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
  it('保存方法と保存せず続行する操作を表示する', async () => {
    await render(<SavePagePromptModal open onSave={jest.fn()} onClose={jest.fn()} />);

    expect(screen.getByText('このページを保存しますか？')).toBeTruthy();
    expect(screen.getByText(/ページタイトルを長押しして保存/)).toBeTruthy();
    expect(screen.getByRole('button', { name: '保存する' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '保存せず続行' })).toBeTruthy();
  });

  it('保存成功時にモーダルを閉じる', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const onClose = jest.fn();
    await render(<SavePagePromptModal open onSave={onSave} onClose={onClose} />);

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: '保存する' }));
    });

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it('保存失敗時はモーダルを閉じない', async () => {
    const onClose = jest.fn();
    await render(
      <SavePagePromptModal open onSave={jest.fn().mockRejectedValue(new Error('storage error'))} onClose={onClose} />,
    );

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: '保存する' }));
    });

    await waitFor(() => expect(onClose).not.toHaveBeenCalled());
  });
});
