import { fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import React from 'react';

import DateRangePickerModal, {
  parseDateString,
  toDateString,
} from '@/components/DateRangePickerModal';
import type { StatsDateRange } from '@/src/types/statsDateRange ';

jest.mock('react-native-calendars', () => {
  const { View } = jest.requireActual('react-native');
  return { Calendar: (props: object) => <View {...props} /> };
});

jest.mock('@/src/providers/ThemeProvider', () => ({
  useTheme: () => ({ resolvedTheme: 'light' }),
}));

jest.mock('@/components/ui/dialog', () => {
  const { Text, View } = jest.requireActual('react-native');
  return {
    Dialog: ({ children, open }: { children?: React.ReactNode; open?: boolean }) =>
      open ? <View>{children}</View> : null,
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

const selectDate = async (dateString: string) => {
  await fireEvent(screen.getByTestId('date-range-calendar'), 'onDayPress', { dateString });
};

describe('DateRangePickerModal', () => {
  it('期間指定の初期値を日本語形式で表示する', async () => {
    await renderModal({ type: 'range', startDate: '2025-01-02', endDate: '2025-03-04' });

    expect(screen.getByText('2025年1月2日')).toBeTruthy();
    expect(screen.getByText('2025年3月4日')).toBeTruthy();
  });

  it('全期間の初期値は未選択の日付欄と開始日選択状態で表示する', async () => {
    await renderModal({ type: 'all', startDate: null, endDate: null });

    expect(screen.getAllByText('未選択')).toHaveLength(2);
    expect(screen.getByTestId('date-range-selection-instruction')).toHaveTextContent(
      '開始日を選択してください',
    );
  });

  it('全期間を選択すると即時にallを返す', async () => {
    const { onConfirm } = await renderModal({
      type: 'range',
      startDate: '2025-01-01',
      endDate: '2025-01-31',
    });

    await fireEvent.press(screen.getByTestId('date-range-all'));

    expect(onConfirm).toHaveBeenCalledWith({ type: 'all', startDate: null, endDate: null });
  });

  it('日付範囲をYYYY-MM-DD形式で確定する', async () => {
    const { onConfirm } = await renderModal({ type: 'all', startDate: null, endDate: null });

    await selectDate('2025-01-02');
    await selectDate('2025-02-03');
    await fireEvent.press(screen.getByRole('button', { name: '期間を決定' }));

    expect(onConfirm).toHaveBeenCalledWith({
      type: 'range',
      startDate: '2025-01-02',
      endDate: '2025-02-03',
    });
  });

  it('キャンセル時は確定せずonCancelだけを呼ぶ', async () => {
    const user = userEvent.setup();
    const { onCancel, onConfirm } = await renderModal({
      type: 'all',
      startDate: null,
      endDate: null,
    });

    await user.press(screen.getByRole('button', { name: 'キャンセル' }));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('終了日選択中は開始日より前の日付を無効にする', async () => {
    await renderModal({ type: 'range', startDate: '2025-02-02', endDate: '2025-02-03' });

    await fireEvent.press(screen.getByTestId('date-range-end-date'));

    expect(screen.getByTestId('date-range-calendar').props.minDate).toBe('2025-02-02');
    expect(
      screen.getByTestId('date-range-calendar').props.disableAllTouchEventsForDisabledDays,
    ).toBe(true);
  });

  it('開始日を再選択すると終了日をクリアして終了日選択へ切り替える', async () => {
    await renderModal({ type: 'range', startDate: '2025-02-02', endDate: '2025-02-03' });

    await fireEvent.press(screen.getByTestId('date-range-start-date'));
    await selectDate('2025-02-10');

    expect(screen.getAllByText('未選択')).toHaveLength(1);
    expect(screen.getByTestId('date-range-selection-instruction')).toHaveTextContent(
      '終了日を選択してください',
    );
    expect(
      screen.getByRole('button', { name: '期間を決定' }).props.accessibilityState.disabled,
    ).toBe(true);
  });

  it('開始日と終了日が同じ場合も確定できる', async () => {
    const { onConfirm } = await renderModal({
      type: 'range',
      startDate: '2025-02-02',
      endDate: '2025-02-02',
    });

    await fireEvent.press(screen.getByRole('button', { name: '期間を決定' }));

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

    await fireEvent.press(screen.getByTestId('date-range-year-picker'));
    await fireEvent.press(screen.getByTestId('date-range-year-2025'));

    expect(onConfirm).toHaveBeenCalledWith({
      type: 'range',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
    });
  });

  it('年選択は現在年を先頭にしたスクロールリストを表示し、キャンセルできる', async () => {
    const currentYear = new Date().getFullYear();
    const { onCancel, onConfirm } = await renderModal({
      type: 'all',
      startDate: null,
      endDate: null,
    });

    await fireEvent.press(screen.getByTestId('date-range-year-picker'));

    expect(screen.getByTestId('date-range-year-list')).toBeTruthy();
    expect(screen.getByTestId(`date-range-year-${currentYear}`)).toBeTruthy();
    await fireEvent.press(screen.getByTestId('date-range-year-cancel'));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('期間境界をまたぐ年は選択できない', async () => {
    await renderModal(
      { type: 'all', startDate: null, endDate: null },
      { maxDate: '2025-12-30', minDate: '2025-01-01', selectableYears: [2025] },
    );

    await fireEvent.press(screen.getByTestId('date-range-year-picker'));

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
