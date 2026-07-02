import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';

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
      <Text className="mb-3 text-center text-sm text-gray-600">{t('statsPage.tableTitle')}</Text>

      <ScrollView horizontal>
        <View className="min-w-full overflow-hidden rounded-lg border border-gray-200 bg-white">
          <View className="flex-row bg-gray-100">
            <Text className="w-32 px-3 py-2 font-bold text-gray-700">{t('statsPage.thName')}</Text>
            <Text className="w-24 px-3 py-2 text-right font-bold text-gray-700">
              {t('statsPage.thGamesPlayed')}
            </Text>
            <Text className="w-24 px-3 py-2 text-right font-bold text-gray-700">
              {t('statsPage.thTotalPoints')}
            </Text>
            <Text className="w-24 px-3 py-2 text-right font-bold text-gray-700">
              {t('statsPage.thBalance')}
            </Text>
          </View>

          {playerStatsList.map((p) => (
            <View key={p.player_id} className="flex-row border-t border-gray-200">
              <View className="w-32 px-3 py-2">
                <Pressable
                  onPress={() => setSelectedPlayerStats(p)}
                  className="rounded-md border border-gray-300 px-2 py-1 active:opacity-70"
                >
                  <Text className="text-center text-sm text-gray-900">{p.player_name}</Text>
                </Pressable>
              </View>

              <Text className="w-24 px-3 py-2 text-right text-gray-900">{p.tournament_count}</Text>

              <Text className="w-24 px-3 py-2 text-right text-gray-900">{p.total_score}</Text>

              <Text className="w-24 px-3 py-2 text-right text-gray-900">{p.total_balance}</Text>
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
