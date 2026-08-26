import { render, screen } from '@testing-library/react-native';
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
});
