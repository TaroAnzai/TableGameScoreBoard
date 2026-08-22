import { useGetApiGroupsGroupKeyPlayerStats } from '@/src/api/generated/mahjongApi';
import { GetApiGroupsGroupKeyPlayerStatsParams } from '@/src/api/generated/mahjongApi.schemas';

export type PlayerStatsPeriodOptions = {
  startDate?: string;
  endDate?: string;
};

const toPlayerStatsParams = (
  options?: PlayerStatsPeriodOptions,
): GetApiGroupsGroupKeyPlayerStatsParams | undefined => {
  const params: GetApiGroupsGroupKeyPlayerStatsParams = {};

  if (options?.startDate !== undefined) params.start_date = options.startDate;
  if (options?.endDate !== undefined) params.end_date = options.endDate;

  return Object.keys(params).length > 0 ? params : undefined;
};

export const useGetPlayerStats = (groupKey: string, options?: PlayerStatsPeriodOptions) => {
  const {
    data: playerStats,
    isLoading: isLoadingPlayerStats,
    isError: isErrorPlayerStats,
    isFetching: isFetchingPlayerStats,
    error: playerStatsError,
    refetch: loadPlayerStats,
  } = useGetApiGroupsGroupKeyPlayerStats(groupKey, toPlayerStatsParams(options));
  return {
    playerStats,
    isLoadingPlayerStats,
    isErrorPlayerStats,
    isFetchingPlayerStats,
    playerStatsError,
    loadPlayerStats,
  };
};
