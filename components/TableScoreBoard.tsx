import React, { Fragment, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, TextInput, View } from 'react-native';

import { Table, TBody, Td, THead, Tr } from '@/components/common/Table';
import { Text } from '@/components/ui/text';
import type {
  Game,
  Player,
  ScoreInput,
  Table as ScoreTable,
} from '@/src/api/generated/mahjongApi.schemas';

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

  const [editingGameIndex, setEditingGameIndex] = useState<number | null>(null);
  const [editingScores, setEditingScores] = useState<Record<number, string>>({});
  const [rowTotal, setRowTotal] = useState(0);

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

    const game = displayGames[index];
    const initialScores: Record<number, string> = {};

    displayPlayers.forEach((player) => {
      const scoreEntry = game?.scores?.find((s) => s.player_id === player.id);
      initialScores[player.id] = scoreEntry?.score ? String(scoreEntry.score) : '';
    });

    setEditingGameIndex(index);
    setEditingScores(initialScores);

    const initialTotal = Object.values(initialScores).reduce((acc, val) => {
      const num = Number(val);
      return acc + (Number.isNaN(num) ? 0 : num);
    }, 0);

    setRowTotal(initialTotal);
  };

  const handleScoreChange = (playerId: number, value: string) => {
    if (value !== '' && !/^-?\d*\.?\d*$/.test(value)) return;

    setEditingScores((prev) => {
      const newScores = { ...prev, [playerId]: value };

      const total = Object.values(newScores).reduce((acc, val) => {
        const num = Number(val);
        return acc + (Number.isNaN(num) ? 0 : num);
      }, 0);

      setRowTotal(total);
      return newScores;
    });
  };

  const handleConfirm = () => {
    if (editingGameIndex === null) return;

    const game = displayGames[editingGameIndex];

    const formatted: ScoreInput[] = Object.entries(editingScores)
      .filter(([, score]) => score !== '')
      .map(([playerId, score]) => ({
        player_id: Number(playerId),
        score: Number(score),
      }));

    if (formatted.length === 0) return;

    onUpdateGame(game?.id ?? null, formatted);
    setEditingGameIndex(null);
    setEditingScores({});
  };

  const handleCancel = () => {
    setEditingGameIndex(null);
    setEditingScores({});
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
    <View className="flex-col">
      <Table>
        <THead>
          <Tr>
            <Td>
              <Text numberOfLines={1}>順位</Text>
            </Td>
            <Td>
              <Text numberOfLines={1}>名前</Text>
            </Td>
            <Td>
              <Text numberOfLines={1}>点数</Text>
            </Td>
            <Td>
              <Text numberOfLines={1}>順位</Text>
            </Td>
          </Tr>
        </THead>
        <TBody>
          <Tr>
            <Td>
              <Text>100</Text>
            </Td>
            <Td>
              <Text>100</Text>
            </Td>
            <Td>
              <Text>1</Text>
            </Td>
          </Tr>
        </TBody>
      </Table>
      <View className="flex-col">
        <ScrollView horizontal className="mt-4">
          <View className="mt-4">
            <View className="flex-row">
              <View className="w-[70px] border border-gray-300 p-2">
                <Text className="text-center text-white font-bold" numberOfLines={1}>
                  {t('scoreBoard.gameTitle')}
                </Text>
              </View>

              {displayPlayers.map((player) => (
                <View key={player.id} className="w-[70px] border border-gray-300 p-2">
                  <Text className="text-center text-white font-bold" numberOfLines={1}>
                    {player.name}
                  </Text>
                </View>
              ))}
            </View>

            {displayGames.map((game, index) => (
              <Fragment key={game?.id ?? `row-${index}`}>
                <Pressable className="flex-row" onPress={() => handleRowPress(index)}>
                  <View className="w-[70px] border border-gray-300 p-2">
                    <Text className="text-center text-white" numberOfLines={1}>
                      {isChipTable
                        ? t('Common.chip')
                        : t('scoreBoard.gameLabel', { index: index + 1 })}
                    </Text>
                  </View>

                  {displayPlayers.map((player) => {
                    const score = game?.scores?.find((s) => s.player_id === player.id)?.score ?? '';

                    return (
                      <View
                        key={`${index}-${player.id}`}
                        className="w-[70px] border border-gray-300 p-1"
                      >
                        {editingGameIndex === index && player.id > 0 ? (
                          <TextInput
                            value={editingScores[player.id] ?? ''}
                            onChangeText={(value) => handleScoreChange(player.id, value)}
                            keyboardType="numeric"
                            className="bg-white text-black text-center p-1"
                          />
                        ) : (
                          <Text className="text-center text-white" numberOfLines={1}>
                            {score}
                          </Text>
                        )}
                      </View>
                    );
                  })}
                </Pressable>

                {editingGameIndex === index && (
                  <View className="border border-gray-300 p-2">
                    <Text className="text-right text-white font-bold">
                      {t('scoreBoard.totalLabel')}: {rowTotal}
                    </Text>

                    <View className="flex-row justify-center items-center gap-4 mt-2">
                      <Pressable
                        onPress={handleConfirm}
                        disabled={rowTotal !== 0 && table.type === 'NORMAL'}
                        className="rounded bg-blue-500 px-4 py-2 disabled:opacity-50"
                      >
                        <Text className="text-white">{t('Common.Confirmed')}</Text>
                      </Pressable>

                      <Pressable onPress={handleCancel} className="rounded bg-blue-500 px-4 py-2">
                        <Text className="text-white">{t('Common.Cancel')}</Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              </Fragment>
            ))}

            {!isChipTable && (
              <View className="flex-row">
                <View className="w-[70px] border border-gray-300 p-2">
                  <Text className="text-center text-white font-bold">
                    {t('scoreBoard.totalLabel')}
                  </Text>
                </View>

                {displayPlayers.map((player) => (
                  <View key={`total-${player.id}`} className="w-[70px] border border-gray-300 p-2">
                    <Text className="text-center text-white font-bold">
                      {totalScores[player.id] ?? 0}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

export default TableScoreBoard;
