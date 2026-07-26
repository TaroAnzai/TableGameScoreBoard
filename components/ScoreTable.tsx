import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Text } from '@/components/ui/text';
import type { TournamentScoreMap } from '@/src/api/generated/mahjongApi.schemas';

interface ScoreTableProps {
  scoreMap: TournamentScoreMap | undefined;
  onClick: (tableId: number) => void;
}

export const ScoreTable = ({ scoreMap, onClick }: ScoreTableProps) => {
  const { t } = useTranslation();

  if (!scoreMap) {
    return <Text className="text-center text-white">{t('Common.noScoreData')}</Text>;
  }

  const normalTables = scoreMap.tables.filter((table) => table.type !== 'CHIP');
  const chipTables = scoreMap.tables.filter((table) => table.type === 'CHIP');
  const sortedTables = [...normalTables, ...chipTables];

  return (
    <View className="flex-row">
      <View className="flex-col mt-4">
        {/* インデックス */}
        <ColIndexCell fixed>{t('scoreTable.columnParticipant')}</ColIndexCell>
        {scoreMap.players.map((player) => (
          <ScoreCell key={player.id} fixed>
            {player.name}
          </ScoreCell>
        ))}
      </View>
      <ScrollView horizontal>
        <View className="mt-4">
          {/* ヘッダー */}
          <View className="flex-row">
            {sortedTables.map((table) => (
              <Pressable key={table.id} onPress={() => table.id && onClick(table.id)}>
                <ColIndexCell underline>{table.name}</ColIndexCell>
              </Pressable>
            ))}

            <ColIndexCell>{t('scoreTable.columnTotal')}</ColIndexCell>
            <ColIndexCell>{t('scoreTable.columnConvertedTotal')}</ColIndexCell>
          </View>

          {/* 明細 */}
          {scoreMap.players.map((player) => (
            <View key={player.id} className="flex-row">
              {sortedTables.map((table) => {
                const score = (player.scores ?? {})[String(table.id)] ?? '';

                return (
                  <ScoreCell key={table.id}>{score !== 0 ? score.toLocaleString() : ''}</ScoreCell>
                );
              })}

              <ScoreCell>{String(player.total?.toLocaleString() ?? '')}</ScoreCell>
              <ScoreCell>{Number(player.converted_total ?? 0).toLocaleString()}</ScoreCell>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

type ScoreCellProps = {
  children: React.ReactNode;
  fixed?: boolean;
  underline?: boolean;
  className?: string;
};

const CELL_HEIGHT = 40;
const CELL_WIDTH = 62;
const FIXED_WIDTH = 96;
const ScoreCell = ({ children, fixed = false, underline = false }: ScoreCellProps) => {
  return (
    <View
      style={{ width: fixed ? FIXED_WIDTH : CELL_WIDTH, height: CELL_HEIGHT }}
      className={[
        'border border-gray-300 items-center justify-center',
        fixed ? 'bg-green-800' : 'bg-transparent',
      ].join(' ')}
    >
      <Popover>
        <PopoverTrigger>
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            className={['text-center text-white', underline ? 'underline' : ''].join(' ')}
          >
            {children}
          </Text>
        </PopoverTrigger>
        <PopoverContent>
          <Text className="text-center">{children}</Text>
        </PopoverContent>
      </Popover>
    </View>
  );
};

type ColIndexCellProps = {
  children: React.ReactNode;
  fixed?: boolean;
  underline?: boolean;
  className?: string;
};

const ColIndexCell = ({ children, fixed = false, underline = false }: ColIndexCellProps) => {
  return (
    <View
      style={{ width: fixed ? FIXED_WIDTH : CELL_WIDTH, height: CELL_HEIGHT }}
      className={[
        'border border-gray-300 items-center justify-center',
        fixed ? 'bg-green-800' : 'bg-green-800',
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
