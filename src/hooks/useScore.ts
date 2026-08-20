import { useGetApiGroupsGroupKeyPlayerStats } from '@/src/api/generated/mahjongApi';

export const useGetPlayerStats = (groupKey: string) => {
  const {
    data: playerStats,
    isLoading: isLoadingPlayerStats,
    isError: isErrorPlayerStats,
    isFetching: isFetchingPlayerStats,
    error: playerStatsError,
    refetch: loadPlayerStats,
  } = useGetApiGroupsGroupKeyPlayerStats(groupKey);
  return {
    playerStats,
    isLoadingPlayerStats,
    isErrorPlayerStats,
    isFetchingPlayerStats,
    playerStatsError,
    loadPlayerStats,
  };
};
