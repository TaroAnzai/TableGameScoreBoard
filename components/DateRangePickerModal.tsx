import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { Calendar } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { radius } from '@/src/lib/theme';
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

type ActiveDateField = 'startDate' | 'endDate' | null;

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

const isInDateBounds = (value: DateString, minDate?: DateString, maxDate?: DateString) => {
  return Boolean(parseDateString(value)) && (!minDate || value >= minDate) && (!maxDate || value <= maxDate);
};

export const DateRangePickerModal = ({
  open,
  initialValue,
  minDate,
  maxDate,
  selectableYears,
  onConfirm,
  onCancel,
}: DateRangePickerModalProps) => {
  const { t } = useTranslation();
  const [selectionType, setSelectionType] = useState<StatsDateRange['type']>(initialValue.type);
  const [startDate, setStartDate] = useState<DateString | null>(
    initialValue.type === 'range' ? initialValue.startDate : null,
  );
  const [endDate, setEndDate] = useState<DateString | null>(
    initialValue.type === 'range' ? initialValue.endDate : null,
  );
  const [activeDateField, setActiveDateField] = useState<ActiveDateField>(null);

  const isRangeValid =
    startDate !== null &&
    endDate !== null &&
    startDate <= endDate &&
    isInDateBounds(startDate, minDate, maxDate) &&
    isInDateBounds(endDate, minDate, maxDate);
  const hasDateOrderError = startDate !== null && endDate !== null && startDate > endDate;
  const isConfirmDisabled = selectionType === 'range' && !isRangeValid;

  const handleDateSelected = (date: Date) => {
    const selectedDate = toDateString(date);
    if (!isInDateBounds(selectedDate, minDate, maxDate)) return;

    if (activeDateField === 'startDate') {
      setStartDate(selectedDate);
      if (endDate !== null && selectedDate > endDate) setEndDate(selectedDate);
    } else if (activeDateField === 'endDate') {
      setEndDate(selectedDate);
    }
    setSelectionType('range');
    setActiveDateField(null);
  };

  const handleYearSelected = (year: number) => {
    setStartDate(`${year}-01-01` as DateString);
    setEndDate(`${year}-12-31` as DateString);
    setSelectionType('range');
  };

  const handleConfirm = () => {
    if (selectionType === 'all') {
      onConfirm({ type: 'all', startDate: null, endDate: null });
      return;
    }
    if (!isRangeValid || !startDate || !endDate) return;
    onConfirm({ type: 'range', startDate, endDate });
  };

  const pickerValue =
    (activeDateField === 'startDate' ? startDate : endDate) ?? minDate ?? maxDate ?? toDateString(new Date());
  const hasSelectableYears = Boolean(selectableYears?.length);

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onCancel()}>
      <DialogContent className="bg-surface" style={{ borderRadius: radius.xl }}>
        <DialogHeader>
          <DialogTitle>{t('statsPage.dateRangePicker.title')}</DialogTitle>
        </DialogHeader>

        <View className="gap-4">
          <View className="gap-2">
            <Text className="text-sm font-semibold text-on-surface">
              {t('statsPage.dateRangePicker.startDate')}
            </Text>
            <Button
              accessibilityLabel={t('statsPage.dateRangePicker.selectStartDate')}
              className="h-auto min-h-12 justify-start rounded-xl px-3 py-3"
              testID="date-range-start-date"
              variant="outline"
              onPress={() => setActiveDateField('startDate')}
            >
              <Icon as={Calendar} className="text-on-surface" size={20} />
              <Text className={startDate ? 'text-on-surface' : 'text-muted-foreground'}>
                {startDate ? formatJapaneseDate(startDate) : t('statsPage.dateRangePicker.unselected')}
              </Text>
            </Button>
          </View>

          <View className="gap-2">
            <Text className="text-sm font-semibold text-on-surface">
              {t('statsPage.dateRangePicker.endDate')}
            </Text>
            <Button
              accessibilityLabel={t('statsPage.dateRangePicker.selectEndDate')}
              className="h-auto min-h-12 justify-start rounded-xl px-3 py-3"
              testID="date-range-end-date"
              variant="outline"
              onPress={() => setActiveDateField('endDate')}
            >
              <Icon as={Calendar} className="text-on-surface" size={20} />
              <Text className={endDate ? 'text-on-surface' : 'text-muted-foreground'}>
                {endDate ? formatJapaneseDate(endDate) : t('statsPage.dateRangePicker.unselected')}
              </Text>
            </Button>
          </View>

          {hasDateOrderError && (
            <Text accessibilityRole="alert" className="text-sm text-destructive">
              {t('statsPage.dateRangePicker.rangeError')}
            </Text>
          )}

          {hasSelectableYears && (
            <View className="gap-2">
              <Text className="text-sm font-semibold text-on-surface">
                {t('statsPage.dateRangePicker.selectYearHeading')}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2 pr-1">
                  {selectableYears?.map((year) => {
                    const yearStart = `${year}-01-01` as DateString;
                    const yearEnd = `${year}-12-31` as DateString;
                    const isDisabled =
                      !isInDateBounds(yearStart, minDate, maxDate) ||
                      !isInDateBounds(yearEnd, minDate, maxDate);
                    const isSelected =
                      selectionType === 'range' && startDate === yearStart && endDate === yearEnd;
                    return (
                      <Button
                        key={year}
                        accessibilityLabel={t('statsPage.dateRangePicker.selectYear', { year })}
                        accessibilityState={{ disabled: isDisabled, selected: isSelected }}
                        className="h-auto min-h-12 rounded-xl px-4 py-3"
                        disabled={isDisabled}
                        testID={`date-range-year-${year}`}
                        variant={isSelected ? 'default' : 'outline'}
                        onPress={() => handleYearSelected(year)}
                      >
                        <Text>{year}年</Text>
                      </Button>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          )}

          <Button
            accessibilityLabel={t('statsPage.dateRangePicker.selectAll')}
            accessibilityState={{ selected: selectionType === 'all' }}
            className="h-auto min-h-12 rounded-xl py-3"
            testID="date-range-all"
            variant={selectionType === 'all' ? 'default' : 'outline'}
            onPress={() => setSelectionType('all')}
          >
            <Text>{t('statsPage.dateRangePicker.all')}</Text>
          </Button>
        </View>

        <DialogFooter>
          <Button
            accessibilityLabel={t('Common.Cancel')}
            className="h-auto min-h-12 rounded-xl py-3"
            variant="outline"
            onPress={onCancel}
          >
            <Text>{t('Common.Cancel')}</Text>
          </Button>
          <Button
            accessibilityLabel={t('Common.ok')}
            className="h-auto min-h-12 rounded-xl py-3"
            disabled={isConfirmDisabled}
            onPress={handleConfirm}
          >
            <Text>{t('Common.ok')}</Text>
          </Button>
        </DialogFooter>
      </DialogContent>

      {activeDateField && (
        <DateTimePicker
          display="compact"
          maximumDate={maxDate ? parseDateString(maxDate) ?? undefined : undefined}
          minimumDate={minDate ? parseDateString(minDate) ?? undefined : undefined}
          mode="date"
          presentation="dialog"
          testID="date-range-native-picker"
          value={parseDateString(pickerValue) ?? new Date()}
          onDismiss={() => setActiveDateField(null)}
          onValueChange={(_, date) => handleDateSelected(date)}
        />
      )}
    </Dialog>
  );
};

export default DateRangePickerModal;
