import { ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { GroupPlayerStat } from '@/src/api/generated/mahjongApi.schemas';

import { PlayerStatsModal } from './PlayerStatsModal';

interface PlayerStatsTableProps {
  playerStatsList: GroupPlayerStat[];
}

export const PlayerStatsTable = ({ playerStatsList }: PlayerStatsTableProps) => {
  const { t } = useTranslation();
  const [selectedPlayerStats, setSelectedPlayerStats] = useState<GroupPlayerStat | null>(null);

  return (
    <View className="w-full">
      <Text className="mb-3 text-center text-xl font-bold leading-7 text-on-surface">
        {t('statsPage.tableTitle')}
      </Text>
      <Text className="mb-2 text-right text-xs text-on-surface-variant">
        {t('statsPage.horizontalScrollHint')}
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View className="min-w-full overflow-hidden rounded-xl border border-outline bg-surface">
          <View className="min-h-11 flex-row items-center bg-surface-variant">
            <Text className="w-32 px-3 py-2 text-center text-[13px] font-bold leading-[18px] text-on-surface">
              {t('statsPage.thName')}
            </Text>
            <Text className="w-24 px-3 py-2 text-center text-[13px] font-bold leading-[18px] text-on-surface">
              {t('statsPage.thGamesPlayedWithUnit')}
            </Text>
            <Text className="w-24 px-3 py-2 text-center text-[13px] font-bold leading-[18px] text-on-surface">
              {t('statsPage.thTotalPointsWithUnit')}
            </Text>
            <Text className="w-36 px-3 py-2 text-center text-[13px] font-bold leading-[18px] text-on-surface">
              {t('statsPage.thBalanceWithUnit')}
            </Text>
          </View>

          {playerStatsList.map((p) => (
            <Pressable
              key={p.player_id}
              className="min-h-11 flex-row items-center border-t border-outline"
              accessibilityRole="button"
              accessibilityLabel={t('statsPage.openPlayerDetails', {
                playerName: p.player_name,
              })}
              onPress={() => setSelectedPlayerStats(p)}
            >
              <View className="flex-row items-center w-32 px-2 py-1">
                <Text className="px-2 py-2  text-sm underline text-on-surface">
                  {p.player_name}
                </Text>
                <Icon as={ChevronRight} className="shrink-0 text-primary" size={14} />
              </View>

              <Text className="w-24 px-3 py-2 text-right text-sm text-on-surface">
                {(p.tournament_count ?? 0).toLocaleString()}
              </Text>

              <Text className="w-24 px-3 py-2 text-right text-sm text-on-surface">
                {(p.total_score ?? 0).toLocaleString()}
              </Text>

              <Text className="w-36 px-3 py-2 text-right text-sm text-on-surface">
                {(p.total_balance ?? 0).toLocaleString()}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <PlayerStatsModal
        open={selectedPlayerStats !== null}
        onClose={() => setSelectedPlayerStats(null)}
        playerStats={selectedPlayerStats}
      />
    </View>
  );
};
