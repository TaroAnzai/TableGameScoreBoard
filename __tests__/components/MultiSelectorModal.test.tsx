import { act, render, screen, userEvent, waitFor } from '@testing-library/react-native';
import React from 'react';

import MultiSelectorModal from '@/components/MultiSelectorModal';

jest.mock('@/components/ui/dialog', () => {
  const { Text, View } = jest.requireActual('react-native');
  const MockDialogTitle = ({ children }: { children?: React.ReactNode }) => <Text>{children}</Text>;
  return {
    Dialog: View,
    DialogContent: View,
    DialogFooter: View,
    DialogHeader: View,
    DialogTitle: MockDialogTitle,
  };
});

const items = [
  { id: 1, name: 'プレイヤー1' },
  { id: 2, name: 'プレイヤー2' },
];

describe('MultiSelectorModal', () => {
  it('開き直すたびに渡された初期選択と同期する', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const { rerender } = await render(
      <MultiSelectorModal
        title="選択"
        open
        items={items}
        initialSelectedIds={[1]}
        onConfirm={jest.fn()}
        onClose={onClose}
      />,
    );

    expect(screen.getByRole('checkbox', { name: 'プレイヤー1' }).props.accessibilityState).toEqual(
      expect.objectContaining({ checked: true }),
    );
    await user.press(screen.getByRole('checkbox', { name: 'プレイヤー2' }));
    await user.press(screen.getByText('キャンセル'));
    expect(onClose).toHaveBeenCalledTimes(1);

    await rerender(
      <MultiSelectorModal
        title="選択"
        open={false}
        items={items}
        initialSelectedIds={[2]}
        onConfirm={jest.fn()}
        onClose={onClose}
      />,
    );
    await rerender(
      <MultiSelectorModal
        title="選択"
        open
        items={items}
        initialSelectedIds={[2]}
        onConfirm={jest.fn()}
        onClose={onClose}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByRole('checkbox', { name: 'プレイヤー1' }).props.accessibilityState,
      ).toEqual(expect.objectContaining({ checked: false }));
      expect(
        screen.getByRole('checkbox', { name: 'プレイヤー2' }).props.accessibilityState,
      ).toEqual(expect.objectContaining({ checked: true }));
    });
  });

  it('確定時は現在選択されている項目だけを返す', async () => {
    const user = userEvent.setup();
    const onConfirm = jest.fn();
    await render(
      <MultiSelectorModal
        title="選択"
        open
        items={items}
        initialSelectedIds={[1]}
        onConfirm={onConfirm}
        onClose={jest.fn()}
      />,
    );

    await user.press(screen.getByRole('checkbox', { name: 'プレイヤー2' }));
    await user.press(screen.getByText('OK'));

    expect(onConfirm).toHaveBeenCalledWith(items);
  });

  it('処理中は選択・確定・キャンセルを無効化して進行状況を表示する', async () => {
    await render(
      <MultiSelectorModal
        title="選択"
        open
        items={items}
        initialSelectedIds={[1]}
        onConfirm={jest.fn()}
        onClose={jest.fn()}
        isPending
        pendingText="追加中..."
      />,
    );

    expect(screen.getAllByText('追加中...').length).toBeGreaterThan(0);
    expect(screen.getByRole('checkbox', { name: 'プレイヤー1' }).props.accessibilityState).toEqual(
      expect.objectContaining({ disabled: true }),
    );
    expect(screen.getByRole('button', { name: 'キャンセル' }).props.accessibilityState).toEqual(
      expect.objectContaining({ disabled: true }),
    );
    expect(screen.getByRole('button', { name: '追加中...' }).props.accessibilityState).toEqual(
      expect.objectContaining({ disabled: true }),
    );
  });

  it('未選択では確定できず、空一覧では指定したメッセージを表示する', async () => {
    const { rerender } = await render(
      <MultiSelectorModal
        title="選択"
        open
        items={items}
        onConfirm={jest.fn()}
        onClose={jest.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'OK' })).toBeDisabled();

    await rerender(
      <MultiSelectorModal
        title="選択"
        open
        items={[]}
        emptyMessage="候補なし"
        onConfirm={jest.fn()}
        onClose={jest.fn()}
      />,
    );
    expect(screen.getByText('候補なし')).toBeTruthy();
  });

  it('非同期の確定処理中は二重送信を防ぎ、完了後に操作可能へ戻る', async () => {
    let resolve!: () => void;
    const onConfirm = jest.fn(() => new Promise<void>((done) => (resolve = done)));
    const user = userEvent.setup();
    await render(
      <MultiSelectorModal
        title="選択"
        open
        items={items}
        initialSelectedIds={[1]}
        onConfirm={onConfirm}
        onClose={jest.fn()}
      />,
    );

    await user.press(screen.getByText('OK'));
    await waitFor(() => expect(screen.getByRole('button', { name: '処理中...' })).toBeDisabled());
    await user.press(screen.getByRole('button', { name: '処理中...' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    await act(async () => resolve());
    await waitFor(() => expect(screen.getByRole('button', { name: 'OK' })).not.toBeDisabled());
  });
});
