import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { Calendar } from 'react-native-calendars';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Text } from '@/components/ui/text';
import { radius, themes } from '@/src/lib/theme';
import { useTheme } from '@/src/providers/ThemeProvider';
import type { DateString, StatsDateRange } from '@/src/types/statsDateRange ';

type DateRangePickerModalProps = {
  open: boolean;
  initialValue: StatsDateRange;
  minDate?: DateString;
  maxDate?: DateString;
  selectableYears?: number[];
  onConfirm: (value: StatsDateRange) => void;
  onCancel: () => void;
};

type SelectionMode = 'start' | 'end';
type CalendarColors = Pick<
  (typeof themes)[keyof typeof themes],
  'primary' | 'onPrimary' | 'primaryContainer' | 'onPrimaryContainer'
>;

const dateStringPattern = /^(\d{4,})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export const toDateString = (date: Date): DateString => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}` as DateString;
};

export const parseDateString = (value: DateString): Date | null => {
  const match = dateStringPattern.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? date
    : null;
};

const formatJapaneseDate = (value: DateString) => {
  const match = dateStringPattern.exec(value);
  return match ? `${match[1]}年${Number(match[2])}月${Number(match[3])}日` : value;
};

const isInDateBounds = (value: DateString, minDate?: DateString, maxDate?: DateString) =>
  Boolean(parseDateString(value)) &&
  (!minDate || value >= minDate) &&
  (!maxDate || value <= maxDate);

const getPeriodMarkings = (
  startDate: DateString | null,
  endDate: DateString | null,
  colors: CalendarColors,
) => {
  if (!startDate) return {};
  if (!endDate) {
    return {
      [startDate]: {
        startingDay: true,
        endingDay: true,
        color: colors.primary,
        textColor: colors.onPrimary,
      },
    };
  }

  const markings: Record<string, object> = {};
  const cursor = parseDateString(startDate);
  const end = parseDateString(endDate);
  if (!cursor || !end) return markings;
  while (cursor <= end) {
    const date = toDateString(cursor);
    const isStart = date === startDate;
    const isEnd = date === endDate;
    markings[date] = {
      startingDay: isStart,
      endingDay: isEnd,
      color: isStart || isEnd ? colors.primary : colors.primaryContainer,
      textColor: isStart || isEnd ? colors.onPrimary : colors.onPrimaryContainer,
    };
    cursor.setDate(cursor.getDate() + 1);
  }
  return markings;
};

const DateRangePickerModalContent = ({
  open,
  initialValue,
  minDate,
  maxDate,
  selectableYears,
  onConfirm,
  onCancel,
}: DateRangePickerModalProps) => {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const theme = themes[resolvedTheme];
  const [draftStartDate, setDraftStartDate] = useState<DateString | null>(
    initialValue.type === 'range' ? initialValue.startDate : null,
  );
  const [draftEndDate, setDraftEndDate] = useState<DateString | null>(
    initialValue.type === 'range' ? initialValue.endDate : null,
  );
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('start');
  const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);

  const isRangeValid = Boolean(
    draftStartDate &&
    draftEndDate &&
    draftStartDate <= draftEndDate &&
    isInDateBounds(draftStartDate, minDate, maxDate) &&
    isInDateBounds(draftEndDate, minDate, maxDate),
  );
  const calendarMinDate =
    selectionMode === 'end' && draftStartDate
      ? minDate && minDate > draftStartDate
        ? minDate
        : draftStartDate
      : minDate;
  const calendarCurrent = draftStartDate ?? minDate ?? maxDate ?? toDateString(new Date());
  const markedDates = useMemo(
    () => getPeriodMarkings(draftStartDate, draftEndDate, theme),
    [draftEndDate, draftStartDate, theme],
  );
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    if (selectableYears?.length) {
      const years = [...new Set(selectableYears)].sort((first, second) => second - first);
      const currentYearIndex = years.indexOf(currentYear);
      return currentYearIndex > 0
        ? [currentYear, ...years.filter((year) => year !== currentYear)]
        : years;
    }

    const firstYear = minDate ? Number(minDate.slice(0, 4)) : currentYear - 100;
    return Array.from({ length: currentYear - firstYear + 1 }, (_, index) => currentYear - index);
  }, [minDate, selectableYears]);

  const handleDayPress = ({ dateString }: { dateString: string }) => {
    const selectedDate = dateString as DateString;
    if (
      !isInDateBounds(selectedDate, minDate, maxDate) ||
      (selectionMode === 'end' && (!draftStartDate || selectedDate < draftStartDate))
    )
      return;
    if (selectionMode === 'start') {
      setDraftStartDate(selectedDate);
      setDraftEndDate(null);
      setSelectionMode('end');
      return;
    }
    setDraftEndDate(selectedDate);
  };

  const handleAllSelected = () => onConfirm({ type: 'all', startDate: null, endDate: null });
  const handleYearSelected = (year: number) => {
    const startDate = `${year}-01-01` as DateString;
    const endDate = `${year}-12-31` as DateString;
    if (!isInDateBounds(startDate, minDate, maxDate) || !isInDateBounds(endDate, minDate, maxDate))
      return;
    setIsYearPickerOpen(false);
    onConfirm({ type: 'range', startDate, endDate });
  };
  const handleConfirm = () => {
    if (isRangeValid && draftStartDate && draftEndDate)
      onConfirm({ type: 'range', startDate: draftStartDate, endDate: draftEndDate });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onCancel()}>
        <DialogContent className="bg-surface" style={{ borderRadius: radius.xl }}>
          <DialogHeader>
            <DialogTitle>{t('statsPage.dateRangePicker.title')}</DialogTitle>
          </DialogHeader>
          <View className="gap-4">
            <View className="flex-row gap-2">
              <Button
                accessibilityLabel={t('statsPage.dateRangePicker.selectAll')}
                className="min-h-12 flex-1 rounded-xl py-3"
                testID="date-range-all"
                variant="outline"
                onPress={handleAllSelected}
              >
                <Text>{t('statsPage.dateRangePicker.all')}</Text>
              </Button>
              <Button
                accessibilityLabel={t('statsPage.dateRangePicker.openYearPicker')}
                className="min-h-12 flex-1 rounded-xl py-3"
                testID="date-range-year-picker"
                variant="outline"
                onPress={() => setIsYearPickerOpen(true)}
              >
                <Text>{t('statsPage.dateRangePicker.year')}</Text>
              </Button>
            </View>
            <View className="border-border border-t" />
            <View className="gap-2">
              <Button
                accessibilityLabel={t('statsPage.dateRangePicker.selectStartDate')}
                accessibilityState={{ selected: selectionMode === 'start' }}
                className="h-auto min-h-12 justify-between rounded-xl px-3 py-3"
                testID="date-range-start-date"
                variant={selectionMode === 'start' ? 'default' : 'outline'}
                onPress={() => setSelectionMode('start')}
              >
                <Text>{t('statsPage.dateRangePicker.startDate')}</Text>
                <Text>
                  {draftStartDate
                    ? formatJapaneseDate(draftStartDate)
                    : t('statsPage.dateRangePicker.unselected')}
                </Text>
              </Button>
              <Button
                accessibilityLabel={t('statsPage.dateRangePicker.selectEndDate')}
                accessibilityState={{
                  disabled: !draftStartDate,
                  selected: selectionMode === 'end',
                }}
                className="h-auto min-h-12 justify-between rounded-xl px-3 py-3"
                disabled={!draftStartDate}
                testID="date-range-end-date"
                variant={selectionMode === 'end' ? 'default' : 'outline'}
                onPress={() => draftStartDate && setSelectionMode('end')}
              >
                <Text>{t('statsPage.dateRangePicker.endDate')}</Text>
                <Text>
                  {draftEndDate
                    ? formatJapaneseDate(draftEndDate)
                    : t('statsPage.dateRangePicker.unselected')}
                </Text>
              </Button>
              <Text
                className="text-sm text-muted-foreground"
                testID="date-range-selection-instruction"
              >
                {selectionMode === 'start'
                  ? t('statsPage.dateRangePicker.selectStartInstruction')
                  : t('statsPage.dateRangePicker.selectEndInstruction')}
              </Text>
            </View>
            <Calendar
              current={calendarCurrent}
              disableAllTouchEventsForDisabledDays={selectionMode === 'end'}
              enableSwipeMonths
              firstDay={1}
              markedDates={markedDates}
              markingType="period"
              maxDate={maxDate}
              minDate={calendarMinDate}
              monthFormat="yyyy年 M月"
              testID="date-range-calendar"
              theme={{
                arrowColor: theme.primary,
                calendarBackground: theme.surface,
                dayTextColor: theme.onSurface,
                monthTextColor: theme.onSurface,
                textDayFontSize: 14,
                textDayHeaderFontSize: 12,
                textDayHeaderFontWeight: '600',
                textDayFontWeight: '400',
                textDisabledColor: theme.disabled,
                textMonthFontSize: 16,
                textMonthFontWeight: '600',
                textSectionTitleColor: theme.onSurfaceVariant,
                todayTextColor: theme.primary,
              }}
              onDayPress={handleDayPress}
            />
          </View>
          <DialogFooter>
            <Button
              accessibilityLabel={t('Common.Cancel')}
              className="min-h-12 rounded-xl py-3"
              variant="outline"
              onPress={onCancel}
            >
              <Text>{t('Common.Cancel')}</Text>
            </Button>
            <Button
              accessibilityLabel={t('statsPage.dateRangePicker.confirmRange')}
              className="min-h-12 rounded-xl py-3"
              disabled={!isRangeValid}
              onPress={handleConfirm}
            >
              <Text>{t('statsPage.dateRangePicker.confirmRange')}</Text>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isYearPickerOpen} onOpenChange={setIsYearPickerOpen}>
        <DialogContent className="bg-surface" style={{ borderRadius: radius.xl }}>
          <DialogHeader>
            <DialogTitle>{t('statsPage.dateRangePicker.selectYearHeading')}</DialogTitle>
          </DialogHeader>
          <ScrollView className="max-h-80" testID="date-range-year-list">
            <View className="gap-2">
              {availableYears.map((year) => {
                const startDate = `${year}-01-01` as DateString;
                const endDate = `${year}-12-31` as DateString;
                const isDisabled =
                  !isInDateBounds(startDate, minDate, maxDate) ||
                  !isInDateBounds(endDate, minDate, maxDate);
                return (
                  <Button
                    key={year}
                    accessibilityLabel={t('statsPage.dateRangePicker.selectYear', { year })}
                    className="min-h-12 rounded-xl px-4 py-3"
                    disabled={isDisabled}
                    testID={`date-range-year-${year}`}
                    variant="outline"
                    onPress={() => handleYearSelected(year)}
                  >
                    <Text>{year}年</Text>
                  </Button>
                );
              })}
            </View>
          </ScrollView>
          <DialogFooter>
            <Button
              accessibilityLabel={t('Common.Cancel')}
              className="min-h-12 rounded-xl py-3"
              testID="date-range-year-cancel"
              variant="outline"
              onPress={() => setIsYearPickerOpen(false)}
            >
              <Text>{t('Common.Cancel')}</Text>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export const DateRangePickerModal = (props: DateRangePickerModalProps) => {
  const initialRangeKey =
    props.initialValue.type === 'range'
      ? `${props.initialValue.startDate}-${props.initialValue.endDate}`
      : 'all';

  return <DateRangePickerModalContent key={`${props.open}-${initialRangeKey}`} {...props} />;
};

export default DateRangePickerModal;
