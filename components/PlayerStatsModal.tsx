import { useTranslation } from 'react-i18next';
import { useWindowDimensions, View } from 'react-native';

import { Text } from '@/components/ui/text';
import type { GroupPlayerStat } from '@/src/api/generated/mahjongApi.schemas';
import { componentSize, radius } from '@/src/lib/theme';

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
  const { width } = useWindowDimensions();

  if (!playerStats) return null;
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="bg-surface"
        style={{
          borderRadius: radius.xl,
          maxWidth: componentSize.dialogMaxWidth,
          width: Math.min(width - 32, componentSize.dialogMaxWidth),
        }}
      >
        <DialogHeader>
          <DialogTitle>{t('statsPage.dialogTitle')}</DialogTitle>
          <DialogDescription>
            {t('statsPage.dialogDescription', { playerName: playerStats.player_name })}
          </DialogDescription>
        </DialogHeader>

        <View className="overflow-hidden rounded-xl border border-outline bg-surface">
          {Object.entries(STATS_NAME_MAP).map(([key, label]) => {
            const value = playerStats[key as keyof GroupPlayerStat];

            if (value === undefined || value === null || value === '') {
              return null;
            }

            return (
              <View
                key={key}
                className="min-h-11 flex-row items-center border-b border-outline px-3 py-2 last:border-b-0"
              >
                <Text className="flex-1 text-sm text-on-surface">
                  {t(`statsPage.statsNameMap.${label}`)}
                </Text>

                <Text className="ml-3 text-right text-base font-bold text-on-surface">
                  {typeof value === 'number' ? value.toLocaleString() : String(value)}
                </Text>
              </View>
            );
          })}
        </View>

        <DialogFooter>
          <Button className="h-auto min-h-12 rounded-xl py-3" onPress={onClose}>
            <Text> {t('Common.close')}</Text>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
