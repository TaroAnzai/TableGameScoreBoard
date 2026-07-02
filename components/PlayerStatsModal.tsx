import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Text } from '@/components/ui/text';
import type { GroupPlayerStat } from '@/src/api/generated/mahjongApi.schemas';

import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

export const STATS_NAME_MAP = {
  tournament_count: 'tournament_count',
  game_count: 'game_count',
  total_score: 'total_score',
  total_balance: 'total_balance',
  average_rank: 'average_rank',
  rank1_rate: 'rank1_rate',
  rank1_count: 'rank1_count',
  rank2_count: 'rank2_count',
  rank3_count: 'rank3_count',
  rank4_or_lower_count: 'rank4_or_lower_count',
};
interface PlayerStatsModalProps {
  open: boolean;
  onClose: () => void;
  playerStats: GroupPlayerStat | null;
}

export const PlayerStatsModal = ({ open, onClose, playerStats }: PlayerStatsModalProps) => {
  const { t } = useTranslation();
  if (!playerStats) return null;
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('statsPage.dialogTitle')}</DialogTitle>
          <DialogDescription>
            {t('statsPage.dialogDescription', { playerName: playerStats.player_name })}
          </DialogDescription>
        </DialogHeader>

        <View className="rounded-lg border border-gray-200">
          {Object.entries(STATS_NAME_MAP).map(([key, label], index) => {
            const value = playerStats[key as keyof GroupPlayerStat];

            if (value === undefined || value === null || value === '') {
              return null;
            }

            return (
              <View key={key} className={`flex-row p-2`}>
                <Text>{t(`statsPage.statsNameMap.${label}`)}</Text>

                <Text className="ml-auto">
                  {typeof value === 'number' ? value.toLocaleString() : String(value)}
                </Text>
              </View>
            );
          })}
        </View>

        <DialogFooter>
          <Button onPress={onClose}>
            <Text> {t('Common.close')}</Text>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
