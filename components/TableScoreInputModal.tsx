import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, type LayoutChangeEvent, useWindowDimensions, View } from 'react-native';
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
import { componentSize, mahjong, radius } from '@/src/lib/theme';

interface TableScoreInputModalProps {
  open: boolean;
  tableType: ScoreTable['type'];
  game: Game | null;
  gameIndex: number;
  players: readonly Player[];
  onConfirm: (scores: ScoreInput[]) => void;
  onClose: () => void;
  isSaving?: boolean;
}

const TableScoreInputModal = ({
  open,
  tableType,
  game,
  gameIndex,
  players,
  onConfirm,
  onClose,
  isSaving = false,
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
  const [headerHeight, setHeaderHeight] = useState<number>(mahjong.tableHeaderHeight);

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
        if (!nextOpen && !isSaving) onClose();
      }}
    >
      <DialogContent
        style={{
          borderRadius: radius.xl,
          width: Math.min(width - 32, componentSize.dialogMaxWidth),
        }}
        className="bg-surface -translate-y-20"
      >
        <DialogHeader>
          <DialogTitle>{t('scoreBoard.inputTitle', { game: title })}</DialogTitle>
        </DialogHeader>
        <View className="w-full flex-row overflow-hidden rounded-xl border border-outline">
          <View>
            {/* Index */}
            <View
              style={{ height: headerHeight, width: mahjong.gameColumnWidth }}
              className="items-center justify-center border-b border-r border-outline bg-surface-variant px-2 py-1"
            >
              <Text className="text-center text-[13px] font-bold leading-[18px] text-on-surface">
                {t('scoreBoard.gameTitle')}
              </Text>
            </View>
            <View
              style={{ minHeight: componentSize.inputHeight, width: mahjong.gameColumnWidth }}
              className="items-center justify-center border-r border-outline bg-surface-variant px-2 py-1"
            >
              <Text className="text-center text-sm font-bold text-on-surface">
                {tableType === 'CHIP'
                  ? t('Common.chip')
                  : t('scoreBoard.gameLabel', { index: gameIndex + 1 })}
              </Text>
            </View>
          </View>
          <ScrollView horizontal className="min-w-0 flex-1 " showsHorizontalScrollIndicator>
            <View>
              {/* Header */}
              <View
                className="flex-row"
                onLayout={(event: LayoutChangeEvent) => {
                  setHeaderHeight(event.nativeEvent.layout.height);
                }}
              >
                {inputPlayers.map((player) => (
                  <View
                    key={player.id}
                    style={{ minHeight: mahjong.tableHeaderHeight, width: mahjong.scoreCellWidth }}
                    className="items-center justify-center border-b border-r border-outline bg-surface-variant px-2 py-1"
                  >
                    <Text className="text-center text-[13px] font-bold leading-[18px] text-on-surface">
                      {player.name}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Input */}
              <View className="flex-row">
                {inputPlayers.map((player) => (
                  <View
                    key={player.id}
                    style={{ minHeight: componentSize.inputHeight, width: mahjong.scoreCellWidth }}
                    className="border-r border-outline bg-surface"
                  >
                    <Input
                      value={scores[player.id] ?? ''}
                      editable={!isSaving}
                      onChangeText={(value) => handleScoreChange(player.id, value)}
                      keyboardType="numeric"
                      selectTextOnFocus
                      className="h-auto min-h-12 w-full rounded-none border-0 bg-surface py-3 text-right text-base font-bold text-on-surface"
                    />
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>

        <Text
          className={[
            'text-right text-base font-bold',
            tableType !== 'NORMAL' || total === 0 ? 'text-success' : 'text-warning',
          ].join(' ')}
        >
          {t('scoreBoard.totalLabel')}: {total.toLocaleString()}
        </Text>
        {tableType === 'NORMAL' && total !== 0 && (
          <Text className="text-right text-sm text-warning">{t('scoreBoard.totalMustBeZero')}</Text>
        )}

        <DialogFooter>
          <Button className="h-auto min-h-12 rounded-xl py-3" variant="outline" disabled={isSaving} onPress={onClose}>
            <Text>{t('Common.Cancel')}</Text>
          </Button>
          <Button
            className="h-auto min-h-12 rounded-xl py-3"
            disabled={!canConfirm || isSaving}
            onPress={() => onConfirm(formattedScores)}
          >
            {isSaving && <ActivityIndicator color="white" />}
            <Text>{isSaving ? t('scoreBoard.saving') : t('Common.Confirmed')}</Text>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TableScoreInputModal;
