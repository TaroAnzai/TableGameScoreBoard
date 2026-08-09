import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  View,
} from 'react-native';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Text } from '@/components/ui/text';
import type { TournamentScoreMap } from '@/src/api/generated/mahjongApi.schemas';
import { mahjong } from '@/src/lib/theme';

interface ScoreTableProps {
  scoreMap: TournamentScoreMap | undefined;
  onClick: (tableId: number) => void;
}

export const ScoreTable = ({ scoreMap, onClick }: ScoreTableProps) => {
  const { t } = useTranslation();
  const headerScrollRef = useRef<ScrollView>(null);
  const detailScrollRef = useRef<ScrollView>(null);

  if (!scoreMap) {
    return (
      <Text className="py-8 text-center text-sm text-on-surface-variant">
        {t('scoreTable.noScoreData')}
      </Text>
    );
  }

  const normalTables = scoreMap.tables.filter((table) => table.type !== 'CHIP');
  const chipTables = scoreMap.tables.filter((table) => table.type === 'CHIP');
  const sortedTables = [...normalTables, ...chipTables];

  const syncHeaderScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    headerScrollRef.current?.scrollTo({ x: event.nativeEvent.contentOffset.x, animated: false });
  };

  const syncDetailScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    detailScrollRef.current?.scrollTo({ x: event.nativeEvent.contentOffset.x, animated: false });
  };

  return (
    <View className="min-h-0 flex-1 self-stretch overflow-hidden rounded-xl border border-outline bg-surface">
      {/* ヘッダー */}
      <View className="flex-row">
        <ColIndexCell fixed>{t('scoreTable.columnParticipant')}</ColIndexCell>
        <ScrollView
          ref={headerScrollRef}
          className="flex-1 min-w-0"
          horizontal
          showsHorizontalScrollIndicator={false}
          onScrollEndDrag={syncDetailScroll}
          onMomentumScrollEnd={syncDetailScroll}
        >
          <View className="flex-row">
            {sortedTables.map((table) => (
              <Pressable
                key={table.id}
                hitSlop={2}
                role="button"
                onPress={() => table.id && onClick(table.id)}
              >
                <ColIndexCell underline>{table.name}</ColIndexCell>
              </Pressable>
            ))}

            <ColIndexCell>{t('scoreTable.columnTotal')}</ColIndexCell>
            <ColIndexCell>{t('scoreTable.columnConvertedTotal')}</ColIndexCell>
          </View>
        </ScrollView>
      </View>

      {/* 明細 */}
      <ScrollView className="flex-1 min-h-0" nestedScrollEnabled>
        <View className="flex-row">
          <View>
            {scoreMap.players.map((player) => (
              <ScoreCell key={player.id} fixed>
                {player.name}
              </ScoreCell>
            ))}
          </View>
          <ScrollView
            ref={detailScrollRef}
            className="flex-1 min-w-0"
            horizontal
            nestedScrollEnabled
            onScroll={syncHeaderScroll}
            scrollEventThrottle={16}
          >
            <View>
              {scoreMap.players.map((player) => (
                <View key={player.id} className="flex-row">
                  {sortedTables.map((table) => {
                    const score = (player.scores ?? {})[String(table.id)] as number | undefined;

                    return (
                      <ScoreCell key={table.id}>
                        {score === undefined ? '—' : score.toLocaleString()}
                      </ScoreCell>
                    );
                  })}

                  <ScoreCell>
                    {player.total === null || player.total === undefined
                      ? '—'
                      : player.total.toLocaleString()}
                  </ScoreCell>
                  <ScoreCell>{Number(player.converted_total ?? 0).toLocaleString()}</ScoreCell>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </ScrollView>
    </View>
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
      style={{
        minHeight: mahjong.tableHeaderHeight,
        width: fixed ? mahjong.playerColumnWidth : mahjong.scoreCellWidth,
      }}
      className={[
        'items-center justify-center border-b border-r border-outline px-2 py-1',
        fixed ? 'bg-surface-variant' : 'bg-surface',
      ].join(' ')}
    >
      <Popover>
        <PopoverTrigger hitSlop={2}>
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            className={[
              'text-center text-base font-bold leading-[22px] text-on-surface',
              underline ? 'underline' : '',
            ].join(' ')}
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
};

const ColIndexCell = ({ children, fixed = false, underline = false }: ColIndexCellProps) => {
  return (
    <View
      style={{
        minHeight: mahjong.tableHeaderHeight,
        width: fixed ? mahjong.playerColumnWidth : mahjong.scoreCellWidth,
      }}
      className="items-center justify-center border-b border-r border-outline bg-surface-variant px-2 py-1"
    >
      <Text
        numberOfLines={1}
        ellipsizeMode="tail"
        className={[
          'text-center text-[13px] font-bold leading-[18px] text-on-surface',
          underline ? 'underline' : '',
        ].join(' ')}
      >
        {children}
      </Text>
    </View>
  );
};
export default ScoreTable;
