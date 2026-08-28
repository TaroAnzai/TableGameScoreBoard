import { fireEvent, render, screen } from '@testing-library/react-native';
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

  it('データなしでは空状態を表示する', async () => {
    await render(<ScoreTable scoreMap={undefined} onClick={jest.fn()} />);
    expect(screen.getByText('成績データがありません')).toBeTruthy();
  });

  it('通常卓をチップ卓より先に並べ、卓タップを通知する', async () => {
    const onClick = jest.fn();
    const scoreMap = {
      tournament_id: 3,
      tables: [
        { id: 2, name: 'チップ卓', type: 'CHIP' },
        { id: 1, name: '通常卓', type: 'NORMAL' },
      ],
      players: [],
    } as TournamentScoreMap;
    await render(<ScoreTable scoreMap={scoreMap} onClick={onClick} />);

    const headers = screen.getAllByRole('button');
    expect(headers[0].props.accessibilityLabel).toContain('通常卓');
    expect(headers[1].props.accessibilityLabel).toContain('チップ卓');
    fireEvent.press(screen.getByTestId('score-table-1'));
    expect(onClick).toHaveBeenCalledWith(1);
  });

  it('正・負・0・欠損スコアと合計の境界値を表示する', async () => {
    const scoreMap = {
      tournament_id: 3,
      tables: [
        { id: 1, name: '卓1', type: 'NORMAL' },
        { id: 2, name: '卓2', type: 'NORMAL' },
        { id: 3, name: '卓3', type: 'NORMAL' },
        { id: 4, name: '卓4', type: 'NORMAL' },
      ],
      players: [
        {
          id: 10,
          name: '境界選手',
          scores: { 1: 1200, 2: -500, 3: 0 },
          total: null,
          converted_total: undefined,
        },
      ],
    } as TournamentScoreMap;
    await render(<ScoreTable scoreMap={scoreMap} onClick={jest.fn()} />);

    expect(screen.getAllByText('1,200').length).toBeGreaterThan(0);
    expect(screen.getAllByText('-500').length).toBeGreaterThan(0);
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('境界選手').length).toBeGreaterThan(0);
  });

  it('参加者0人・卓0件でもヘッダーを表示し操作を発生させない', async () => {
    const onClick = jest.fn();
    const scoreMap = { tournament_id: 3, tables: [], players: [] } as TournamentScoreMap;
    await render(<ScoreTable scoreMap={scoreMap} onClick={onClick} />);

    expect(screen.getAllByText('参加者').length).toBeGreaterThan(0);
    expect(screen.getAllByText('合計').length).toBeGreaterThan(0);
    expect(screen.queryByText(/タップすると記録用紙/)).toBeNull();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('IDが無効な卓は押しても遷移を通知しない', async () => {
    const onClick = jest.fn();
    const scoreMap = {
      tournament_id: 3,
      tables: [{ id: 0, name: 'IDなし卓', type: 'NORMAL' }],
      players: [],
    } as TournamentScoreMap;
    await render(<ScoreTable scoreMap={scoreMap} onClick={onClick} />);
    fireEvent.press(screen.getByText('IDなし卓'));
    expect(onClick).not.toHaveBeenCalled();
  });
});
