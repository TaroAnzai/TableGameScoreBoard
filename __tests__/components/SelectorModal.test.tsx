import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

import SelectorModal from '@/components/SelectorModal';

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

const items = [
  { id: 41, name: '項目A' },
  { id: 73, name: '項目B' },
];

describe('SelectorModal', () => {
  it('任意のID取得関数が指定された場合は項目IDをtestIDに使う', async () => {
    await render(
      <SelectorModal
        title="選択"
        open
        items={items}
        getItemTestId={(item) => item.id}
        onSelect={jest.fn()}
        onClose={jest.fn()}
      />,
    );

    expect(screen.getByTestId('select-41')).toBeTruthy();
    expect(screen.getByTestId('select-73')).toBeTruthy();
  });

  it('ID取得関数が省略された場合は従来どおりindexを使う', async () => {
    await render(
      <SelectorModal
        title="選択"
        open
        items={items}
        onSelect={jest.fn()}
        onClose={jest.fn()}
      />,
    );

    expect(screen.getByTestId('select-0')).toBeTruthy();
    expect(screen.getByTestId('select-1')).toBeTruthy();
  });

  it('項目を選択するとその項目をcallbackへ渡す', async () => {
    const onSelect = jest.fn().mockResolvedValue(undefined);
    await render(
      <SelectorModal title="選択" open items={items} onSelect={onSelect} onClose={jest.fn()} />,
    );

    await act(async () => fireEvent.press(screen.getByTestId('select-1')));

    await waitFor(() => expect(onSelect).toHaveBeenCalledWith(items[1]));
  });

  it('選択処理中は連打と閉じる操作を無効化し、処理表示を出す', async () => {
    let resolveSelect!: () => void;
    const onSelect = jest.fn(
      () => new Promise<void>((resolve) => {
        resolveSelect = resolve;
      }),
    );
    const onClose = jest.fn();
    await render(
      <SelectorModal
        title="選択"
        open
        items={items}
        onSelect={onSelect}
        onClose={onClose}
        pendingText="選択を保存中"
      />,
    );

    fireEvent.press(screen.getByTestId('select-0'));
    await waitFor(() => expect(screen.getByTestId('select-1')).toBeDisabled());
    fireEvent.press(screen.getByTestId('select-1'));
    fireEvent.press(screen.getByTestId('select-close'));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText('選択を保存中')).toBeTruthy();
    await act(async () => resolveSelect());
  });

  it.each([undefined, []])('項目がない場合は空メッセージを表示する', async (emptyItems) => {
    await render(
      <SelectorModal
        title="選択"
        open
        items={emptyItems}
        emptyMessage="選択肢がありません"
        onSelect={jest.fn()}
        onClose={jest.fn()}
      />,
    );

    expect(screen.getByText('選択肢がありません')).toBeTruthy();
  });

  it('補足項目はnullでない場合だけ表示する', async () => {
    const detailedItems = [
      { id: 1, name: '表示あり', detail: 0 },
      { id: 2, name: '表示なし', detail: null },
    ];
    await render(
      <SelectorModal
        title="選択"
        open
        items={detailedItems}
        plusDisplayItem="detail"
        onSelect={jest.fn()}
        onClose={jest.fn()}
      />,
    );

    expect(screen.getByText('0')).toBeTruthy();
  });

  it('外部pending中は項目を選択できない', async () => {
    const onSelect = jest.fn();
    await render(
      <SelectorModal
        title="選択"
        open
        items={items}
        isPending
        onSelect={onSelect}
        onClose={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByTestId('select-0'));
    expect(onSelect).not.toHaveBeenCalled();
  });
});
