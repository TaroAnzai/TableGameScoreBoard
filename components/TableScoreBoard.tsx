import { Pencil } from 'lucide-react-native';
import React, { Fragment, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  View,
} from 'react-native';

import TableScoreInputModal from '@/components/TableScoreInputModal';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type {
  Game,
  GameV2,
  Player,
  PlayerV2,
  ScoreInput,
  Table as ScoreTable,
  TableV2,
} from '@/src/api/generated/mahjongApi.schemas';
import { mahjong } from '@/src/lib/theme';

interface ScoreCellProps {
  score: number | '';
  isTotal: boolean;
  hasBottomBorder?: boolean;
}

const ScoreCell = ({
  score,
  isTotal,
  hasBottomBorder = true,
}: ScoreCellProps) => (
  <View
    style={{
      height: mahjong.tableHeaderHeight,
      width: mahjong.scoreCellWidth,
    }}
    className={`items-center justify-center border-r border-outline px-2 py-1 ${
      isTotal ? 'bg-surface-variant' : 'bg-surface'
    } ${
      hasBottomBorder ? 'border-b' : ''
    }`}
  >
    <Text
      className="text-center text-base font-bold leading-[22px] text-on-surface"
      numberOfLines={1}
    >
      {score === '' ? '—' : score.toLocaleString()}
    </Text>
  </View>
);

interface TableScoreBoardProps {
  table: ScoreTable | TableV2;
  players: readonly (Player | PlayerV2)[];
  games: (Game | GameV2)[];
  onUpdateGame: (gameId: number | null, scores: ScoreInput[]) => Promise<void>;
  disabled?: boolean;
}

const TableScoreBoard = ({
  table,
  players,
  games,
  onUpdateGame,
  disabled = false,
}: TableScoreBoardProps) => {
  const { t } = useTranslation();
  const headerScrollRef = useRef<ScrollView>(null);
  const detailScrollRef = useRef<ScrollView>(null);

  const [editingGameIndex, setEditingGameIndex] = useState<number | null>(null);
  const [savingGameIndex, setSavingGameIndex] = useState<number | null>(null);
  const isChipTable = table.type === 'CHIP';

  const displayPlayers = [...players];
  if (!isChipTable) {
    while (displayPlayers.length < 4) {
      displayPlayers.push({
        id: (displayPlayers.length + 1) * -1,
        name: '',
        group_id: 0,
      });
    }
  }

  const displayGames: (Game | GameV2 | null)[] = [...games];

  if (!isChipTable) {
    const targetLength = games.length <= 3 ? 4 : games.length + 1;
    while (displayGames.length < targetLength) {
      displayGames.push(null);
    }
  } else if (games.length === 0) {
    displayGames.push(null);
  }

  const handleRowPress = (index: number) => {
    if (editingGameIndex === index || disabled) return;

    setEditingGameIndex(index);
  };

  const handleConfirm = async (scores: ScoreInput[]) => {
    if (editingGameIndex === null) return;

    const game = displayGames[editingGameIndex];
    setSavingGameIndex(editingGameIndex);
    try {
      await onUpdateGame(game?.id ?? null, scores);
      setEditingGameIndex(null);
    } catch {
      // The mutation hook presents the error. Keep the modal and its draft open for retry.
    } finally {
      setSavingGameIndex(null);
    }
  };

  const handleCancel = () => {
    setEditingGameIndex(null);
  };

  const syncHeaderScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    headerScrollRef.current?.scrollTo({ x: event.nativeEvent.contentOffset.x, animated: false });
  };

  const syncDetailScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    detailScrollRef.current?.scrollTo({ x: event.nativeEvent.contentOffset.x, animated: false });
  };

  const totalScores: Record<number, number> = {};
  displayPlayers.forEach((player) => {
    totalScores[player.id] = 0;
  });

  displayGames.forEach((game) => {
    game?.scores?.forEach(({ player_id, score }) => {
      if (totalScores[player_id] !== undefined) {
        totalScores[player_id] += score;
      }
    });
  });

  return (
    <View className="mt-4 min-h-0 flex-1 self-stretch overflow-hidden rounded-xl border border-outline bg-surface">
      <View className="flex-row items-center justify-center gap-1 border-b border-outline bg-surface px-3 py-1.5">
        <Text className="text-xs text-on-surface-variant">{t('scoreBoard.horizontalScrollHint')}</Text>
      </View>
      <View className="flex-row">
        <View
          style={{ minHeight: mahjong.tableHeaderHeight, width: mahjong.gameColumnWidth }}
          className="items-center justify-center border-b border-r border-outline bg-surface-variant px-2 py-1"
        >
          <Text className="text-center text-[13px] font-bold leading-[18px] text-on-surface">
            {t('scoreBoard.gameTitle')}
          </Text>
        </View>

        <ScrollView
          ref={headerScrollRef}
          className="min-w-0 flex-1"
          horizontal
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={syncDetailScroll}
          onScrollEndDrag={syncDetailScroll}
        >
          <View className="flex-row">
            {displayPlayers.map((player) => (
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
        </ScrollView>
      </View>

      <ScrollView className="min-h-0 flex-1" nestedScrollEnabled>
        <View className="flex-row">
          <View>
            {displayGames.map((game, index) => (
              <Pressable
                key={game?.id ?? `index-row-${index}`}
                accessibilityRole="button"
                accessibilityLabel={t('scoreBoard.editRowLabel', {
                  game: isChipTable
                    ? t('Common.chip')
                    : t('scoreBoard.gameLabel', { index: index + 1 }),
                })}
                accessibilityState={{ disabled: disabled || savingGameIndex === index, busy: savingGameIndex === index }}
                className="min-h-11 items-center justify-center border-b border-r border-outline bg-surface-variant px-2 py-1 active:bg-primary-container"
                disabled={disabled || savingGameIndex === index}
                style={{ width: mahjong.gameColumnWidth }}
                onPress={() => handleRowPress(index)}
              >
                <Text className="text-center text-sm text-on-surface" numberOfLines={1}>
                  {isChipTable ? t('Common.chip') : t('scoreBoard.gameLabel', { index: index + 1 })}
                </Text>
                {!disabled && <Icon as={Pencil} className="text-on-surface-variant" size={13} />}
              </Pressable>
            ))}

            {!isChipTable && (
              <View
                style={{ minHeight: mahjong.tableHeaderHeight, width: mahjong.gameColumnWidth }}
                className="items-center justify-center border-r border-outline bg-surface-variant px-2 py-1"
              >
                <Text className="text-center text-sm font-bold text-on-surface">
                  {t('scoreBoard.totalLabel')}
                </Text>
              </View>
            )}
          </View>

          <ScrollView
            ref={detailScrollRef}
            className="min-w-0 flex-1"
            horizontal
            nestedScrollEnabled
            onScroll={syncHeaderScroll}
            scrollEventThrottle={16}
          >
            <View>
              {displayGames.map((game, index) => (
                <Fragment key={game?.id ?? `score-row-${index}`}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('scoreBoard.editRowLabel', {
                      game: isChipTable
                        ? t('Common.chip')
                        : t('scoreBoard.gameLabel', { index: index + 1 }),
                    })}
                    accessibilityHint={t('scoreBoard.tapToInput')}
                    accessibilityState={{ disabled: disabled || savingGameIndex === index, busy: savingGameIndex === index }}
                    className="min-h-11 flex-row active:bg-primary-container"
                    disabled={disabled || savingGameIndex === index}
                    onPress={() => handleRowPress(index)}
                  >
                    {displayPlayers.map((player) => {
                      const score =
                        game?.scores?.find((s) => s.player_id === player.id)?.score ?? '';

                      return (
                        <ScoreCell
                          key={`${index}-${player.id}`}
                          score={score === '' ? '' : Number(score)}
                          isTotal={false}
                        />
                      );
                    })}
                  </Pressable>
                </Fragment>
              ))}

              {!isChipTable && (
                <View className="flex-row">
                  {displayPlayers.map((player) => (
                    <ScoreCell
                      key={`total-${player.id}`}
                      score={totalScores[player.id] ?? 0}
                      isTotal
                      hasBottomBorder={false}
                    />
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </ScrollView>

      {editingGameIndex !== null && (
        <TableScoreInputModal
          key={`${editingGameIndex}-${displayGames[editingGameIndex]?.id ?? 'new'}`}
          open
          tableType={table.type}
          game={displayGames[editingGameIndex]}
          gameIndex={editingGameIndex}
          players={players}
          onConfirm={handleConfirm}
          onClose={handleCancel}
          isSaving={savingGameIndex === editingGameIndex}
        />
      )}
    </View>
  );
};

export default TableScoreBoard;
