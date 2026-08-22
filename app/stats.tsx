import { ChevronRight } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { DateRangePickerModal } from '@/components/DateRangePickerModal';
import GroupStats from '@/components/GroupStats';
import MahjongContainer from '@/components/MahjongContainer';
import MahjongSection from '@/components/MahjongSection';
import PageTitleBar from '@/components/page_parts/PageTitleBar';
import SelectorModal from '@/components/SelectorModal';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { GroupV2 } from '@/src/api/generated/mahjongApi.schemas';
import { useGroupQueries } from '@/src/hooks/useGroups';
import type { StatsDateRange } from '@/src/types/statsDateRange ';

const StatsPage = () => {
  const [selectedGroup, setSelectedGroup] = useState<GroupV2 | null>(null);
  const [isGroupSelectorOpen, setIsGroupSelectorOpen] = useState(false);
  const [dateRange, setDateRange] = useState<StatsDateRange>({
    type: 'all',
    startDate: null,
    endDate: null,
  });
  const [isDateRangePickerOpen, setIsDateRangePickerOpen] = useState(false);
  const { groups } = useGroupQueries();
  const { t } = useTranslation();
  const availableGroups = useMemo(
    () => Array.from(new Map(groups.map((group) => [group.id, group])).values()),
    [groups],
  );
  const effectiveGroup = selectedGroup ?? availableGroups[0] ?? null;
  const dateRangeLabel =
    dateRange.type === 'all'
      ? t('statsPage.allPeriods')
      : `${dateRange.startDate} ～ ${dateRange.endDate}`;
  const startDate = dateRange.type === 'range' ? dateRange.startDate : undefined;
  const endDate = dateRange.type === 'range' ? dateRange.endDate : undefined;

  return (
    <MahjongContainer>
      <PageTitleBar title={t('statsPage.pageTitle')} />
      <View className="mb-2 gap-2 rounded-2xl border border-outline bg-surface-variant p-4">
        <View className="flex-row items-center justify-between">
          <Text className="shrink-0">{t('statsPage.group')}</Text>
          <Pressable
            accessibilityLabel={t('statsPage.selectGroup')}
            accessibilityRole="button"
            className="ml-4 flex-row items-centergap-2"
            onPress={() => setIsGroupSelectorOpen(true)}
          >
            <Text className="" numberOfLines={1}>
              {effectiveGroup?.name}
            </Text>
            <Icon as={ChevronRight} size={20} />
          </Pressable>
        </View>

        <View className="flex-row items-center justify-between">
          <Text className="shrink-0">{t('statsPage.period')}</Text>
          <Pressable
            accessibilityHint={t('statsPage.selectPeriodHint')}
            accessibilityLabel={t('statsPage.selectPeriod', { period: dateRangeLabel })}
            accessibilityRole="button"
            className="ml-4 flex-1 flex-row items-center justify-end gap-2"
            testID="stats-date-range-selector"
            onPress={() => setIsDateRangePickerOpen(true)}
          >
            <Text className="flex-1 text-right" numberOfLines={1}>
              {dateRangeLabel}
            </Text>
            <Icon as={ChevronRight} size={20} />
          </Pressable>
        </View>
      </View>

      {effectiveGroup && effectiveGroup.group_links ? (
        <GroupStats
          endDate={endDate}
          groupKey={effectiveGroup.group_links[0].short_key}
          startDate={startDate}
        />
      ) : (
        <MahjongSection className="flex-1">
          <Text>{t('statsPage.selectGroupFirst')}</Text>
        </MahjongSection>
      )}

      <SelectorModal
        title={t('statsPage.group')}
        items={availableGroups}
        open={isGroupSelectorOpen}
        onSelect={(group) => {
          setIsGroupSelectorOpen(false);
          setSelectedGroup(group);
        }}
        onClose={() => setIsGroupSelectorOpen(false)}
      />

      {isDateRangePickerOpen && (
        <DateRangePickerModal
          initialValue={dateRange}
          open
          onCancel={() => setIsDateRangePickerOpen(false)}
          onConfirm={(value) => {
            setDateRange(value);
            setIsDateRangePickerOpen(false);
          }}
        />
      )}
    </MahjongContainer>
  );
};

export default StatsPage;
