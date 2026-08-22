import { ChevronRight } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import GroupStats from '@/components/GroupStats';
import MahjongContainer from '@/components/MahjongContainer';
import MahjongSection from '@/components/MahjongSection';
import PageTitleBar from '@/components/page_parts/PageTitleBar';
import SelectorModal from '@/components/SelectorModal';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Group, GroupV2 } from '@/src/api/generated/mahjongApi.schemas';
import { useGroupQueries } from '@/src/hooks/useGroups';

const StatsPage = () => {
  const [selectedGroup, setSelectedGroup] = useState<GroupV2 | null>(null);
  const [isGroupSelectorOprn, setIsGroupSelectorOpen] = useState<boolean>(false);
  const {
    groups,
    pendingGroups,
    isLoading,
    isFetching,
    isError,
    error,
    isRefreshing,
    refetch,
    refresh,
  } = useGroupQueries();
  const { t } = useTranslation();
  const availableGroups = useMemo(
    () => Array.from(new Map(groups.map((group) => [group.id, group])).values()),
    [groups],
  );
  const effectiveGroup = selectedGroup ?? availableGroups[0] ?? null;

  return (
    <MahjongContainer>
      <PageTitleBar title="グループ成績 統計"></PageTitleBar>
      <View className="mb-6 rounded-2xl border border-outline bg-surface-variant p-4">
        <View className="flex-row justify-between">
          <Text>グルーフ</Text>
          <Pressable
            className="items-center flex-row gap-2"
            onPress={() => setIsGroupSelectorOpen(true)}
          >
            <Text>{effectiveGroup?.name}</Text>
            <Icon as={ChevronRight} size={20} />
          </Pressable>
        </View>
        <Text>期間</Text>
      </View>
      {effectiveGroup && effectiveGroup.group_links ? (
        <GroupStats groupKey={effectiveGroup.group_links[0].short_key} />
      ) : (
        <MahjongSection className="flex-1">
          <Text>グループを選択してください。</Text>
        </MahjongSection>
      )}
      <SelectorModal
        title="グルーフ"
        items={availableGroups}
        open={isGroupSelectorOprn}
        onSelect={(group) => {
          setIsGroupSelectorOpen(false);
          setSelectedGroup(group ?? undefined);
        }}
        onClose={() => setIsGroupSelectorOpen(false)}
      />
    </MahjongContainer>
  );
};

export default StatsPage;
