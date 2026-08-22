import { fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import React from 'react';

import DateRangePickerModal, {
  parseDateString,
  toDateString,
} from '@/components/DateRangePickerModal';
import type { StatsDateRange } from '@/src/types/statsDateRange ';

jest.mock('@expo/ui/community/datetime-picker', () => {
  const { View } = jest.requireActual('react-native');
  return { DateTimePicker: (props: object) => <View {...props} /> };
});

jest.mock('@/components/ui/dialog', () => {
  const { Text, View } = jest.requireActual('react-native');
  return {
    Dialog: View,
    DialogContent: View,
    DialogFooter: View,
    DialogHeader: View,
    DialogTitle: ({ children }: { children?: React.ReactNode }) => <Text>{children}</Text>,
  };
});

const renderModal = async (initialValue: StatsDateRange, overrides = {}) => {
  const onConfirm = jest.fn();
  const onCancel = jest.fn();

  await render(
    <DateRangePickerModal
      initialValue={initialValue}
      open
      onCancel={onCancel}
      onConfirm={onConfirm}
      {...overrides}
    />,
  );

  return { onCancel, onConfirm };
};

const selectDate = async (field: 'start' | 'end', date: Date) => {
  await fireEvent.press(screen.getByTestId(`date-range-${field}-date`));
  await fireEvent(screen.getByTestId('date-range-native-picker'), 'onValueChange', {}, date);
};

describe('DateRangePickerModal', () => {
  it('期間指定の初期値を日本語形式で表示する', async () => {
    await renderModal({ type: 'range', startDate: '2025-01-02', endDate: '2025-03-04' });

    expect(screen.getByText('2025年1月2日')).toBeTruthy();
    expect(screen.getByText('2025年3月4日')).toBeTruthy();
  });

  it('全期間の初期値を選択状態かつ未選択の日付欄で表示する', async () => {
    await renderModal({ type: 'all', startDate: null, endDate: null });

    expect(screen.getByTestId('date-range-all').props.accessibilityState.selected).toBe(true);
    expect(screen.getAllByText('未選択')).toHaveLength(2);
  });

  it('全期間を選択して確定するとallを返す', async () => {
    const user = userEvent.setup();
    const { onConfirm } = await renderModal({ type: 'range', startDate: '2025-01-01', endDate: '2025-01-31' });

    await user.press(screen.getByTestId('date-range-all'));
    await user.press(screen.getByRole('button', { name: 'OK' }));

    expect(onConfirm).toHaveBeenCalledWith({ type: 'all', startDate: null, endDate: null });
  });

  it('日付範囲をYYYY-MM-DD形式で確定する', async () => {
    const user = userEvent.setup();
    const { onConfirm } = await renderModal({ type: 'all', startDate: null, endDate: null });

    await selectDate('start', new Date(2025, 0, 2));
    await selectDate('end', new Date(2025, 1, 3));
    await user.press(screen.getByRole('button', { name: 'OK' }));

    expect(onConfirm).toHaveBeenCalledWith({
      type: 'range',
      startDate: '2025-01-02',
      endDate: '2025-02-03',
    });
  });

  it('キャンセル時は確定せずonCancelだけを呼ぶ', async () => {
    const user = userEvent.setup();
    const { onCancel, onConfirm } = await renderModal({ type: 'all', startDate: null, endDate: null });

    await user.press(screen.getByRole('button', { name: 'キャンセル' }));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('終了日を開始日より前にするとエラーを表示し確定できない', async () => {
    const { onConfirm } = await renderModal({ type: 'range', startDate: '2025-02-02', endDate: '2025-02-03' });

    await selectDate('end', new Date(2025, 1, 1));
    await fireEvent.press(screen.getByRole('button', { name: 'OK' }));

    expect(screen.getByRole('alert')).toHaveTextContent('開始日は終了日以前の日付を選択してください。');
    expect(screen.getByRole('button', { name: 'OK' }).props.accessibilityState.disabled).toBe(true);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('開始日と終了日が同じ場合も確定できる', async () => {
    const { onConfirm } = await renderModal({ type: 'range', startDate: '2025-02-02', endDate: '2025-02-02' });

    await fireEvent.press(screen.getByRole('button', { name: 'OK' }));

    expect(onConfirm).toHaveBeenCalledWith({
      type: 'range',
      startDate: '2025-02-02',
      endDate: '2025-02-02',
    });
  });

  it('年を選択するとその年の開始日と終了日を設定する', async () => {
    const { onConfirm } = await renderModal(
      { type: 'all', startDate: null, endDate: null },
      { selectableYears: [2025] },
    );

    await fireEvent.press(screen.getByTestId('date-range-year-2025'));
    await fireEvent.press(screen.getByRole('button', { name: 'OK' }));

    expect(onConfirm).toHaveBeenCalledWith({
      type: 'range',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
    });
  });

  it('期間境界をまたぐ年は選択できない', async () => {
    await renderModal(
      { type: 'all', startDate: null, endDate: null },
      { maxDate: '2025-12-30', minDate: '2025-01-01', selectableYears: [2025] },
    );

    const yearButton = screen.getByTestId('date-range-year-2025');
    expect(yearButton.props.accessibilityState.disabled).toBe(true);
  });

  it('日付ピッカーのDate変換でUTCの日付解釈に依存しない', () => {
    const date = parseDateString('2025-01-01');

    expect(date).not.toBeNull();
    expect(date?.getFullYear()).toBe(2025);
    expect(date?.getMonth()).toBe(0);
    expect(date?.getDate()).toBe(1);
    expect(toDateString(new Date(2025, 0, 1))).toBe('2025-01-01');
  });
});
