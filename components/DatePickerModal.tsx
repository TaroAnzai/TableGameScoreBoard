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
import type { DateString } from '@/src/types/statsDateRange';

type DatePickerModalProps = {
  open: boolean;
  title: string;
  value: DateString | null;
  minDate?: DateString;
  maxDate?: DateString;
  selectableYears?: number[];
  onSelect: (value: DateString) => void;
  onCancel: () => void;
};

const getYear = (value: DateString) => Number(value.slice(0, 4));
const getMonth = (value: DateString) => Number(value.slice(5, 7));
const toMonthString = (year: number, month: number) =>
  `${year}-${String(month).padStart(2, '0')}-01` as DateString;
const getTodayString = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate(),
  ).padStart(2, '0')}` as DateString;
};

export const DatePickerModal = ({
  open,
  title,
  value,
  minDate,
  maxDate,
  selectableYears,
  onSelect,
  onCancel,
}: DatePickerModalProps) => {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const theme = themes[resolvedTheme];
  const initialDate = value ?? minDate ?? maxDate ?? getTodayString();
  const [visibleYear, setVisibleYear] = useState(getYear(initialDate));
  const [visibleMonth, setVisibleMonth] = useState(getMonth(initialDate));
  const [isYearModalOpen, setIsYearModalOpen] = useState(false);
  const [isMonthModalOpen, setIsMonthModalOpen] = useState(false);

  const availableYears = useMemo(() => {
    if (selectableYears?.length)
      return [...new Set(selectableYears)].sort((first, second) => second - first);
    const currentYear = new Date().getFullYear();
    const firstYear = minDate ? getYear(minDate) : currentYear - 100;
    const lastYear = maxDate ? getYear(maxDate) : currentYear;
    return Array.from({ length: lastYear - firstYear + 1 }, (_, index) => lastYear - index);
  }, [maxDate, minDate, selectableYears]);

  const currentMonth = toMonthString(visibleYear, visibleMonth);
  const isMonthDisabled = (month: number) => {
    const monthStart = toMonthString(visibleYear, month);
    const monthEnd = `${visibleYear}-${String(month).padStart(2, '0')}-31`;
    return Boolean((minDate && monthEnd < minDate) || (maxDate && monthStart > maxDate));
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onCancel()}>
        <DialogContent className="bg-surface" style={{ borderRadius: radius.xl }}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <View className="flex-row gap-2">
            <Button
              accessibilityLabel={t('statsPage.dateRangePicker.openCalendarYearPicker')}
              className="min-h-12 flex-1 rounded-xl"
              testID="calendar-year-picker"
              variant="outline"
              onPress={() => setIsYearModalOpen(true)}
            >
              <Text>{visibleYear}年 ▼</Text>
            </Button>
            <Button
              accessibilityLabel={t('statsPage.dateRangePicker.openCalendarMonthPicker')}
              className="min-h-12 flex-1 rounded-xl"
              testID="calendar-month-picker"
              variant="outline"
              onPress={() => setIsMonthModalOpen(true)}
            >
              <Text>{visibleMonth}月 ▼</Text>
            </Button>
          </View>
          <Calendar
            key={currentMonth}
            current={currentMonth}
            disableAllTouchEventsForDisabledDays
            firstDay={0}
            hideArrows
            markedDates={
              value
                ? {
                    [value]: {
                      selected: true,
                      selectedColor: theme.primary,
                      selectedTextColor: theme.onPrimary,
                    },
                  }
                : undefined
            }
            maxDate={maxDate}
            minDate={minDate}
            renderHeader={() => null}
            testID="date-range-calendar"
            theme={{
              calendarBackground: theme.surface,
              dayTextColor: theme.onSurface,
              textDayFontSize: 14,
              textDayHeaderFontSize: 12,
              textDayHeaderFontWeight: '600',
              textDayFontWeight: '400',
              textDisabledColor: theme.disabled,
              textSectionTitleColor: theme.onSurfaceVariant,
              todayTextColor: theme.primary,
            }}
            onDayPress={({ dateString }) => onSelect(dateString as DateString)}
          />
          <DialogFooter>
            <Button className="min-h-12 rounded-xl" variant="outline" onPress={onCancel}>
              <Text>{t('Common.Cancel')}</Text>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isYearModalOpen} onOpenChange={setIsYearModalOpen}>
        <DialogContent className="bg-surface" style={{ borderRadius: radius.xl }}>
          <DialogHeader>
            <DialogTitle>{t('statsPage.dateRangePicker.selectCalendarYear')}</DialogTitle>
          </DialogHeader>
          <ScrollView className="max-h-80" testID="calendar-year-list">
            <View className="gap-2">
              {availableYears.map((year) => (
                <Button
                  key={year}
                  className="min-h-12 rounded-xl"
                  testID={`calendar-year-${year}`}
                  variant={year === visibleYear ? 'default' : 'outline'}
                  onPress={() => {
                    setVisibleYear(year);
                    setIsYearModalOpen(false);
                  }}
                >
                  <Text>{year}年</Text>
                </Button>
              ))}
            </View>
          </ScrollView>
        </DialogContent>
      </Dialog>

      <Dialog open={isMonthModalOpen} onOpenChange={setIsMonthModalOpen}>
        <DialogContent className="bg-surface" style={{ borderRadius: radius.xl }}>
          <DialogHeader>
            <DialogTitle>{t('statsPage.dateRangePicker.selectCalendarMonth')}</DialogTitle>
          </DialogHeader>
          <View className="flex-row flex-wrap gap-2">
            {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
              <Button
                key={month}
                className="min-h-12 basis-[30%] rounded-xl"
                disabled={isMonthDisabled(month)}
                testID={`calendar-month-${month}`}
                variant={month === visibleMonth ? 'default' : 'outline'}
                onPress={() => {
                  setVisibleMonth(month);
                  setIsMonthModalOpen(false);
                }}
              >
                <Text>{month}月</Text>
              </Button>
            ))}
          </View>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DatePickerModal;
