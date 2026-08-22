import { renderHook } from '@testing-library/react-native';

import {
  getGetApiGroupsGroupKeyPlayerStatsQueryKey,
  useGetApiGroupsGroupKeyPlayerStats,
} from '@/src/api/generated/mahjongApi';
import { type PlayerStatsPeriodOptions, useGetPlayerStats } from '@/src/hooks/useScore';

jest.mock('@/src/api/generated/mahjongApi', () => ({
  ...jest.requireActual('@/src/api/generated/mahjongApi'),
  useGetApiGroupsGroupKeyPlayerStats: jest.fn(),
}));

const mockUseGetApiGroupsGroupKeyPlayerStats = jest.mocked(useGetApiGroupsGroupKeyPlayerStats);

describe('useGetPlayerStats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGetApiGroupsGroupKeyPlayerStats.mockReturnValue({} as never);
  });

  it('期間未指定時はパラメータを渡さない', async () => {
    await renderHook(() => useGetPlayerStats('group-key'));

    expect(mockUseGetApiGroupsGroupKeyPlayerStats).toHaveBeenCalledWith('group-key', undefined);
  });

  it('開始日と終了日をAPIパラメータへ渡す', async () => {
    await renderHook(() =>
      useGetPlayerStats('group-key', { startDate: '2026-01-01', endDate: '2026-01-31' }),
    );

    expect(mockUseGetApiGroupsGroupKeyPlayerStats).toHaveBeenCalledWith('group-key', {
      start_date: '2026-01-01',
      end_date: '2026-01-31',
    });
  });

  it.each([
    ['開始日のみ', { startDate: '2026-01-01' }, { start_date: '2026-01-01' }],
    ['終了日のみ', { endDate: '2026-01-31' }, { end_date: '2026-01-31' }],
  ])('%sが指定された場合も省略した側を送信しない', async (_, options, params) => {
    await renderHook(() => useGetPlayerStats('group-key', options as PlayerStatsPeriodOptions));

    expect(mockUseGetApiGroupsGroupKeyPlayerStats).toHaveBeenCalledWith('group-key', params);
  });

  it('期間パラメーターを含めてReact Queryのquery keyを生成する', () => {
    const allPeriodsKey = getGetApiGroupsGroupKeyPlayerStatsQueryKey('group-key');
    const rangeKey = getGetApiGroupsGroupKeyPlayerStatsQueryKey('group-key', {
      end_date: '2026-01-31',
      start_date: '2026-01-01',
    });

    expect(rangeKey).not.toEqual(allPeriodsKey);
    expect(rangeKey).toEqual([
      '/api/groups/group-key/player_stats',
      { end_date: '2026-01-31', start_date: '2026-01-01' },
    ]);
  });
});
