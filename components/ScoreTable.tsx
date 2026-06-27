import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';

import type { TournamentScoreMap } from '@/src/api/generated/mahjongApi.schemas';

interface ScoreTableProps {
  scoreMap: TournamentScoreMap | undefined;
  onClick: (tableId: number) => void;
}

const CELL_WIDTH = 96;

export const ScoreTable = ({ scoreMap, onClick }: ScoreTableProps) => {
  const { t } = useTranslation();

  if (!scoreMap) {
    return <Text className="text-center text-white">{t('Common.noScoreData')}</Text>;
  }

  const normalTables = scoreMap.tables.filter((table) => table.type !== 'CHIP');
  const chipTables = scoreMap.tables.filter((table) => table.type === 'CHIP');
  const sortedTables = [...normalTables, ...chipTables];

  return (
    <ScrollView horizontal className="mt-4">
      <View className="mt-4">
        {/* ヘッダー */}
        <View className="flex-row">
          <ScoreCell fixed>{t('scoreTable.columnParticipant')}</ScoreCell>

          {sortedTables.map((table) => (
            <Pressable key={table.id} onPress={() => table.id && onClick(table.id)}>
              <ScoreCell underline>{table.name}</ScoreCell>
            </Pressable>
          ))}

          <ScoreCell>{t('scoreTable.columnTotal')}</ScoreCell>
          <ScoreCell>{t('scoreTable.columnConvertedTotal')}</ScoreCell>
        </View>

        {/* 明細 */}
        {scoreMap.players.map((player) => (
          <View key={player.id} className="flex-row">
            <ScoreCell fixed>{player.name}</ScoreCell>

            {sortedTables.map((table) => {
              const score = (player.scores ?? {})[String(table.id)] ?? '';

              return <ScoreCell key={table.id}>{score !== 0 ? String(score) : ''}</ScoreCell>;
            })}

            <ScoreCell>{String(player.total ?? '')}</ScoreCell>
            <ScoreCell>{Number(player.converted_total ?? 0).toFixed(1)}</ScoreCell>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

type ScoreCellProps = {
  children: React.ReactNode;
  fixed?: boolean;
  underline?: boolean;
};

const ScoreCell = ({ children, fixed = false, underline = false }: ScoreCellProps) => {
  return (
    <View
      style={{ width: CELL_WIDTH }}
      className={[
        'border border-gray-300 px-2 py-2 items-center justify-center',
        fixed ? 'bg-green-800' : 'bg-transparent',
      ].join(' ')}
    >
      <Text
        numberOfLines={1}
        ellipsizeMode="tail"
        className={['text-center text-white', underline ? 'underline' : ''].join(' ')}
      >
        {children}
      </Text>
    </View>
  );
};

export default ScoreTable;
