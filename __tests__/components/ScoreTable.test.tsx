import { render, screen } from '@testing-library/react-native';
import React from 'react';

import { ScoreTable } from '@/components/ScoreTable';
import type { TournamentScoreMap } from '@/src/api/generated/mahjongApi.schemas';

jest.mock('@/components/ui/popover', () => {
  const { View } = jest.requireActual('react-native');
  return {
    Popover: View,
    PopoverContent: View,
    PopoverTrigger: View,
  };
});

describe('ScoreTable', () => {
  it('テーブルヘッダーにリソースID由来のtestIDを付ける', async () => {
    const scoreMap = {
      tournament_id: 3,
      tables: [{ id: 12, name: '卓1', type: 'NORMAL' }],
      players: [],
    } as TournamentScoreMap;

    await render(<ScoreTable scoreMap={scoreMap} onClick={jest.fn()} />);

    expect(screen.getByTestId('score-table-12')).toBeTruthy();
  });
});
