import { useQuery } from '@tanstack/react-query';

import {
  getApiV2TournamentsTournamentKeyDashboard,
  getGetApiV2TournamentsTournamentKeyDashboardQueryKey,
  useGetApiGroupsGroupKeyPlayerStats,
  useGetApiTournamentsTournamentKeyExport,
} from '@/src/api/generated/mahjongApi';

export const useGetTournamentScore = (tournamentKey: string) => {
  const {
    data: score,
    isLoading: isLoadingScore,
    isError: isErrorScore,
    isFetching: isFetchingScore,
    error: scoreError,
    refetch: loadScore,
  } = useGetApiTournamentsTournamentKeyExport(tournamentKey);
  return { score, isLoadingScore, isErrorScore, isFetchingScore, scoreError, loadScore };
};

export const useGetTournamentScoreMap = (tournamentKey: string) => {
  const {
    data: scoreMap,
    isLoading: isLoadingScoreMap,
    isError: isErrorScoreMap,
    isFetching: isFetchingScoreMap,
    error: scoreMapError,
    refetch: loadScoreMap,
  } = useQuery({
    queryKey: getGetApiV2TournamentsTournamentKeyDashboardQueryKey(tournamentKey),
    queryFn: () =>
      getApiV2TournamentsTournamentKeyDashboard(tournamentKey),
    enabled: !!tournamentKey,
    select: (dashboard) => dashboard.score_map,
  });
  return {
    scoreMap,
    isLoadingScoreMap,
    isErrorScoreMap,
    isFetchingScoreMap,
    scoreMapError,
    loadScoreMap,
  };
};

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
