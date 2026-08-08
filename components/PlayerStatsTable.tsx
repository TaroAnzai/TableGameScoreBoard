import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Button } from '@/components/ui/button';
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

      <ScrollView horizontal>
        <View className="min-w-full overflow-hidden rounded-xl border border-outline bg-surface">
          <View className="min-h-11 flex-row items-center bg-surface-variant">
            <Text className="w-32 px-3 py-2 text-[13px] font-bold leading-[18px] text-on-surface">
              {t('statsPage.thName')}
            </Text>
            <Text className="w-24 px-3 py-2 text-right text-[13px] font-bold leading-[18px] text-on-surface">
              {t('statsPage.thGamesPlayed')}
            </Text>
            <Text className="w-24 px-3 py-2 text-right text-[13px] font-bold leading-[18px] text-on-surface">
              {t('statsPage.thTotalPoints')}
            </Text>
            <Text className="w-24 px-3 py-2 text-right text-[13px] font-bold leading-[18px] text-on-surface">
              {t('statsPage.thBalance')}
            </Text>
          </View>

          {playerStatsList.map((p) => (
            <View key={p.player_id} className="min-h-11 flex-row items-center border-t border-outline">
              <View className="w-32 px-2 py-1">
                <Button
                  onPress={() => setSelectedPlayerStats(p)}
                  className="h-auto min-h-12 w-full rounded-lg px-2 py-2"
                  variant="ghost"
                >
                  <Text className="text-center text-sm text-on-surface">{p.player_name}</Text>
                </Button>
              </View>

              <Text className="w-24 px-3 py-2 text-right text-sm text-on-surface">
                {(p.tournament_count ?? 0).toLocaleString()}
              </Text>

              <Text className="w-24 px-3 py-2 text-right text-sm text-on-surface">
                {(p.total_score ?? 0).toLocaleString()}
              </Text>

              <Text className="w-24 px-3 py-2 text-right text-sm text-on-surface">
                {(p.total_balance ?? 0).toLocaleString()}
              </Text>
            </View>
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
