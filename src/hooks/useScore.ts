import {
  useGetApiGroupsGroupKeyPlayerStats,
  useGetApiTournamentsTournamentKeyExport,
  useGetApiTournamentsTournamentKeyScoreMap,
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
  } = useGetApiTournamentsTournamentKeyScoreMap(tournamentKey);
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
