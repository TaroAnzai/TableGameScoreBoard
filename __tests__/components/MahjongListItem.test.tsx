import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

import { MahjongListItem } from '@/components/MahjongListItem';

describe('MahjongListItem', () => {
  it('操作可能な行は補足情報と前後要素を表示し、press・longPressを通知する', async () => {
    const onPress = jest.fn();
    const onLongPress = jest.fn();
    await render(
      <MahjongListItem
        title="大会1"
        badge="OWNER"
        accessories={['作成日', 0, <Text key="node">補足node</Text>]}
        leading={<Text>先頭</Text>}
        trailing={<Text>末尾</Text>}
        onPress={onPress}
        onLongPress={onLongPress}
        selected
        testID="item"
      />,
    );

    expect(screen.getByText('OWNER')).toBeTruthy();
    expect(screen.getByText('作成日')).toBeTruthy();
    expect(screen.getByText('0')).toBeTruthy();
    expect(screen.getByText('補足node')).toBeTruthy();
    expect(screen.getByText('先頭')).toBeTruthy();
    expect(screen.getByText('末尾')).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByTestId('item'));
      fireEvent(screen.getByTestId('item'), 'longPress');
    });
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onLongPress).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('item').props.accessibilityState.selected).toBe(true);
  });

  it('操作なし・補足なしの行はbuttonにせず、disabled表示を反映する', async () => {
    await render(<MahjongListItem title="表示のみ" disabled testID="readonly-item" />);

    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByTestId('readonly-item')).toBeTruthy();
    expect(screen.queryByText('OWNER')).toBeNull();
  });
});
