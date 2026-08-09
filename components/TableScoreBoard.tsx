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
import { Text } from '@/components/ui/text';
import type {
  Game,
  Player,
  ScoreInput,
  Table as ScoreTable,
} from '@/src/api/generated/mahjongApi.schemas';
import { mahjong } from '@/src/lib/theme';

interface TableScoreBoardProps {
  table: ScoreTable;
  players: readonly Player[];
  games: Game[];
  onUpdateGame: (gameId: number | null, scores: ScoreInput[]) => void;
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

  const displayGames: (Game | null)[] = [...games];

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

  const handleConfirm = (scores: ScoreInput[]) => {
    if (editingGameIndex === null) return;

    const game = displayGames[editingGameIndex];
    onUpdateGame(game?.id ?? null, scores);
    setEditingGameIndex(null);
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
                accessibilityState={{ disabled }}
                className="min-h-11 items-center justify-center border-b border-r border-outline bg-surface-variant px-2 py-1 active:bg-primary-container"
                disabled={disabled}
                style={{ width: mahjong.gameColumnWidth }}
                onPress={() => handleRowPress(index)}
              >
                <Text className="text-center text-sm text-on-surface" numberOfLines={1}>
                  {isChipTable ? t('Common.chip') : t('scoreBoard.gameLabel', { index: index + 1 })}
                </Text>
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
                    accessibilityState={{ disabled }}
                    className="min-h-11 flex-row active:bg-primary-container"
                    disabled={disabled}
                    onPress={() => handleRowPress(index)}
                  >
                    {displayPlayers.map((player) => {
                      const score =
                        game?.scores?.find((s) => s.player_id === player.id)?.score ?? '';

                      return (
                        <View
                          key={`${index}-${player.id}`}
                          style={{ width: mahjong.scoreCellWidth }}
                          className="items-center justify-center border-b border-r border-outline bg-surface px-2 py-1"
                        >
                          <Text
                            className="text-center text-base font-bold leading-[22px] text-on-surface"
                            numberOfLines={1}
                          >
                            {score === '' ? '—' : Number(score).toLocaleString()}
                          </Text>
                        </View>
                      );
                    })}
                  </Pressable>
                </Fragment>
              ))}

              {!isChipTable && (
                <View className="flex-row">
                  {displayPlayers.map((player) => (
                    <View
                      key={`total-${player.id}`}
                      style={{
                        minHeight: mahjong.tableHeaderHeight,
                        width: mahjong.scoreCellWidth,
                      }}
                      className="items-center justify-center border-r border-outline bg-surface-variant px-2 py-1"
                    >
                      <Text className="text-center text-base font-bold leading-[22px] text-on-surface">
                        {(totalScores[player.id] ?? 0).toLocaleString()}
                      </Text>
                    </View>
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
          players={displayPlayers}
          onConfirm={handleConfirm}
          onClose={handleCancel}
        />
      )}
    </View>
  );
};

export default TableScoreBoard;
