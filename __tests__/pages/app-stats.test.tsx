import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import StatsPage from '@/app/stats';

const mockUseGroupQueries = jest.fn();
const mockGroupStats = jest.fn();

jest.mock('@/src/hooks/useGroups', () => ({
  useGroupQueries: () => mockUseGroupQueries(),
}));

jest.mock('@/components/GroupStats', () => {
  const { Text } = jest.requireActual('react-native');
  return ({ groupKey, startDate, endDate }: { groupKey: string; startDate?: string; endDate?: string }) => {
    mockGroupStats({ endDate, groupKey, startDate });
    return <Text>{`${groupKey}:${startDate ?? 'undefined'}:${endDate ?? 'undefined'}`}</Text>;
  };
});

jest.mock('@/components/DateRangePickerModal', () => {
  const { Pressable, Text, View } = jest.requireActual('react-native');
  return {
    DateRangePickerModal: ({
      initialValue,
      onCancel,
      onConfirm,
    }: {
      initialValue: { type: string };
      onCancel: () => void;
      onConfirm: (value: {
        type: 'all';
        startDate: null;
        endDate: null;
      } | {
        type: 'range';
        startDate: '2025-01-01';
        endDate: '2025-12-31';
      }) => void;
    }) => (
      <View testID="date-range-picker-modal">
        <Text>{`initial:${initialValue.type}`}</Text>
        <Pressable
          accessibilityLabel="期間指定を確定"
          onPress={() =>
            onConfirm({ type: 'range', startDate: '2025-01-01', endDate: '2025-12-31' })
          }
        />
        <Pressable
          accessibilityLabel="全期間を確定"
          onPress={() => onConfirm({ type: 'all', startDate: null, endDate: null })}
        />
        <Pressable accessibilityLabel="期間選択をキャンセル" onPress={onCancel} />
      </View>
    ),
  };
});

jest.mock('@/components/SelectorModal', () => {
  const { Pressable, Text, View } = jest.requireActual('react-native');
  return ({
    items,
    onSelect,
    open,
  }: {
    items: { id: number; name: string }[];
    onSelect: (item: { id: number; name: string }) => void;
    open: boolean;
  }) =>
    open ? (
      <View>
        {items.map((item) => (
          <Pressable key={item.id} accessibilityLabel={`${item.name}を選択`} onPress={() => onSelect(item)}>
            <Text>{item.name}</Text>
          </Pressable>
        ))}
      </View>
    ) : null;
});

jest.mock('@/components/page_parts/PageTitleBar', () => {
  const { Text } = jest.requireActual('react-native');
  return ({ title }: { title: string }) => <Text>{title}</Text>;
});

const groups = [
  {
    group_links: [{ short_key: 'group-one' }],
    id: 1,
    name: 'グループ1',
  },
  {
    group_links: [{ short_key: 'group-two' }],
    id: 2,
    name: 'グループ2',
  },
];

describe('成績画面の期間選択', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGroupQueries.mockReturnValue({ groups });
  });

  it('初期状態では全期間を表示し、日付を送信しない', async () => {
    await render(<StatsPage />);

    expect(screen.getByText('全期間')).toBeTruthy();
    expect(mockGroupStats).toHaveBeenLastCalledWith({
      endDate: undefined,
      groupKey: 'group-one',
      startDate: undefined,
    });
  });

  it('期間行を押すとDateRangePickerModalを表示する', async () => {
    await render(<StatsPage />);

    await fireEvent.press(screen.getByTestId('stats-date-range-selector'));

    expect(screen.getByTestId('date-range-picker-modal')).toBeTruthy();
    expect(screen.getByText('initial:all')).toBeTruthy();
  });

  it('期間を確定すると表示と成績取得条件を更新する', async () => {
    await render(<StatsPage />);

    await fireEvent.press(screen.getByTestId('stats-date-range-selector'));
    await fireEvent.press(screen.getByLabelText('期間指定を確定'));

    expect(screen.getByText('2025-01-01 ～ 2025-12-31')).toBeTruthy();
    expect(mockGroupStats).toHaveBeenLastCalledWith({
      endDate: '2025-12-31',
      groupKey: 'group-one',
      startDate: '2025-01-01',
    });
  });

  it('キャンセル時は確定済みの表示を変更しない', async () => {
    await render(<StatsPage />);

    await fireEvent.press(screen.getByTestId('stats-date-range-selector'));
    await fireEvent.press(screen.getByLabelText('期間選択をキャンセル'));

    expect(screen.getByText('全期間')).toBeTruthy();
    expect(screen.queryByTestId('date-range-picker-modal')).toBeNull();
  });

  it('全期間を確定すると全期間表示とundefinedの日付条件へ戻す', async () => {
    await render(<StatsPage />);

    await fireEvent.press(screen.getByTestId('stats-date-range-selector'));
    await fireEvent.press(screen.getByLabelText('期間指定を確定'));
    await fireEvent.press(screen.getByTestId('stats-date-range-selector'));
    await fireEvent.press(screen.getByLabelText('全期間を確定'));

    expect(screen.getByText('全期間')).toBeTruthy();
    expect(mockGroupStats).toHaveBeenLastCalledWith({
      endDate: undefined,
      groupKey: 'group-one',
      startDate: undefined,
    });
  });

  it('グループを変更しても確定済みの期間を維持する', async () => {
    await render(<StatsPage />);

    await fireEvent.press(screen.getByTestId('stats-date-range-selector'));
    await fireEvent.press(screen.getByLabelText('期間指定を確定'));
    await fireEvent.press(screen.getByLabelText('グループを選択'));
    await fireEvent.press(screen.getByLabelText('グループ2を選択'));

    expect(screen.getByText('2025-01-01 ～ 2025-12-31')).toBeTruthy();
    expect(mockGroupStats).toHaveBeenLastCalledWith({
      endDate: '2025-12-31',
      groupKey: 'group-two',
      startDate: '2025-01-01',
    });
  });
});
