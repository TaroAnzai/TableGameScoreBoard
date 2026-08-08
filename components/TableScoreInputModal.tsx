import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useWindowDimensions, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import type {
  Game,
  Player,
  ScoreInput,
  Table as ScoreTable,
} from '@/src/api/generated/mahjongApi.schemas';

interface TableScoreInputModalProps {
  open: boolean;
  tableType: ScoreTable['type'];
  game: Game | null;
  gameIndex: number;
  players: readonly Player[];
  onConfirm: (scores: ScoreInput[]) => void;
  onClose: () => void;
}

const TableScoreInputModal = ({
  open,
  tableType,
  game,
  gameIndex,
  players,
  onConfirm,
  onClose,
}: TableScoreInputModalProps) => {
  const { t } = useTranslation();
  const inputPlayers = players.filter((player) => player.id > 0);
  const [scores, setScores] = useState<Record<number, string>>(() =>
    Object.fromEntries(
      inputPlayers.map((player) => {
        const score = game?.scores?.find((entry) => entry.player_id === player.id)?.score;
        return [player.id, score === undefined || score === null ? '' : String(score)];
      }),
    ),
  );

  const total = useMemo(
    () =>
      Object.values(scores).reduce((sum, value) => {
        const score = Number(value);
        return sum + (Number.isFinite(score) ? score : 0);
      }, 0),
    [scores],
  );

  const formattedScores = useMemo<ScoreInput[]>(
    () =>
      Object.entries(scores)
        .filter(([, score]) => score !== '' && Number.isFinite(Number(score)))
        .map(([playerId, score]) => ({
          player_id: Number(playerId),
          score: Number(score),
        })),
    [scores],
  );

  const handleScoreChange = (playerId: number, value: string) => {
    if (value !== '' && !/^-?\d*\.?\d*$/.test(value)) return;
    setScores((current) => ({ ...current, [playerId]: value }));
  };

  const canConfirm = formattedScores.length > 0 && (tableType !== 'NORMAL' || total === 0);
  const title =
    tableType === 'CHIP' ? t('Common.chip') : t('scoreBoard.gameLabel', { index: gameIndex + 1 });
  const { width } = useWindowDimensions();
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogContent
        style={{
          width: Math.min(width - 32, 500),
        }}
        className="-translate-y-[80px]"
      >
        <DialogHeader>
          <DialogTitle>{t('scoreBoard.inputTitle', { game: title })}</DialogTitle>
        </DialogHeader>
        <View className="flex-row w-full">
          <View>
            {/* Index */}
            <View className="w-[70px] border border-gray-300 bg-green-800 py-5 px-2">
              <Text className="text-center font-bold text-white" numberOfLines={1}>
                {t('scoreBoard.gameTitle')}
              </Text>
            </View>
            <View className="w-[70px] border border-gray-300 bg-green-800 p-2">
              <Text className="text-center font-bold text-white">
                {' '}
                {tableType === 'CHIP'
                  ? t('Common.chip')
                  : t('scoreBoard.gameLabel', { index: gameIndex + 1 })}
              </Text>
            </View>
          </View>
          <ScrollView horizontal className="min-w-0 flex-1 " showsHorizontalScrollIndicator>
            <View>
              {/* Header */}
              <View className="flex-row">
                {inputPlayers.map((player) => (
                  <View
                    key={player.id}
                    className="w-[60px] bg-green-800 border border-gray-300 py-5 px-1"
                  >
                    <Text className="text-center text-white font-bold" numberOfLines={1}>
                      {player.name}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Input */}
              <View className="flex-row">
                {inputPlayers.map((player) => (
                  <View key={player.id} className="w-[60px] border border-gray-300">
                    <Input
                      value={scores[player.id] ?? ''}
                      onChangeText={(value) => handleScoreChange(player.id, value)}
                      keyboardType="numeric"
                      selectTextOnFocus
                      className="w-full text-right"
                    />
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>

        <Text className="text-right font-bold">
          {t('scoreBoard.totalLabel')}: {total}
        </Text>

        <DialogFooter>
          <Button variant="outline" onPress={onClose}>
            <Text>{t('Common.Cancel')}</Text>
          </Button>
          <Button disabled={!canConfirm} onPress={() => onConfirm(formattedScores)}>
            <Text>{t('Common.Confirmed')}</Text>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TableScoreInputModal;
