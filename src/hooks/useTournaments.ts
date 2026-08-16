import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import {
  deleteApiTournamentsTournamentKey,
  deleteApiV2TournamentsTournamentKeyParticipantsPlayerId,
  getApiV2GroupsGroupKeyDashboard,
  getApiV2TournamentsTournamentKeyDashboard,
  getGetApiTournamentsTournamentKeyParticipantsQueryOptions,
  getGetApiTournamentsTournamentKeyQueryOptions,
  getGetApiTournamentsTournamentKeyScoreMapQueryOptions,
  getGetApiV2GroupsGroupKeyDashboardQueryKey,
  getGetApiV2TournamentsTournamentKeyDashboardQueryKey,
  postApiV2GroupsGroupKeyTournaments,
  postApiV2TournamentsTournamentKeyParticipantsbatchAdd,
  putApiTournamentsTournamentKey,
} from '@/src/api/generated/mahjongApi';
import type {
  Player,
  TournamentCreateV2,
  TournamentUpdate,
} from '@/src/api/generated/mahjongApi.schemas';
import { useMutationFeedback } from '@/src/hooks/useMutationFeedback';

export const useCreateTournament = () => {
  const { t } = useTranslation();
  const { showError, showSuccess } = useMutationFeedback();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { groupKey: string; tournament: TournamentCreateV2 }) => {
      return postApiV2GroupsGroupKeyTournaments(data.groupKey, data.tournament);
    },
    onSuccess: async (_data, variables) => {
      showSuccess(t('notifications.tournament.createSuccess'));
      await queryClient.invalidateQueries({
        queryKey: getGetApiV2GroupsGroupKeyDashboardQueryKey(variables.groupKey),
      });
    },
    onError: (error: any) => {
      console.error('Error creating tournament:', error);
      showError({
        title: t('notifications.tournament.createErrorTitle'),
        error,
        fallback: t('notifications.common.unknownError'),
      });
    },
  });
};

export const useGetTournaments = (groupKey: string) => {
  const {
    data: tournaments,
    isLoading: isLoadingTournaments,
    isError: isErrorTournaments,
    isFetching: isFetchingTournaments,
    error: tournamentsError,
    refetch: loadTournaments,
  } = useQuery({
    queryKey: getGetApiV2GroupsGroupKeyDashboardQueryKey(groupKey),
    queryFn: () =>
      getApiV2GroupsGroupKeyDashboard(groupKey),
    enabled: !!groupKey,
    select: (dashboard) => dashboard.tournaments,
  });
  return {
    tournaments,
    isLoadingTournaments,
    isErrorTournaments,
    isFetchingTournaments,
    tournamentsError,
    loadTournaments,
  };
};
export const useUpdateTournament = () => {
  const { t } = useTranslation();
  const { showError, showSuccess } = useMutationFeedback();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      tournamentKey: string;
      groupKey?: string;
      tournament: TournamentUpdate;
    }) => {
      return putApiTournamentsTournamentKey(data.tournamentKey, data.tournament);
    },
    onSuccess: async (_data, variables) => {
      showSuccess(t('notifications.tournament.updateSuccess'));
      const queryKeytournament = getGetApiTournamentsTournamentKeyQueryOptions(
        variables.tournamentKey,
      ).queryKey;
      const queryKeyScore = getGetApiTournamentsTournamentKeyScoreMapQueryOptions(
        variables.tournamentKey,
      ).queryKey;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeytournament }),
        queryClient.invalidateQueries({ queryKey: queryKeyScore }),
        queryClient.invalidateQueries({
          queryKey: getGetApiV2TournamentsTournamentKeyDashboardQueryKey(
            variables.tournamentKey,
          ),
        }),
      ]);
      if (variables.groupKey) {
        await queryClient.invalidateQueries({
          queryKey: getGetApiV2GroupsGroupKeyDashboardQueryKey(variables.groupKey),
        });
      }
    },
    onError: (error: any) => {
      console.error('Error updating tournament:', error);
      showError({
        title: t('notifications.tournament.updateErrorTitle'),
        error,
        fallback: t('notifications.common.unknownError'),
      });
    },
  });
};
export const useDeleteTournament = () => {
  const { t } = useTranslation();
  const { showError, showSuccess } = useMutationFeedback();

  return useMutation({
    mutationFn: (data: { tournamentKey: string }) => {
      return deleteApiTournamentsTournamentKey(data.tournamentKey);
    },
    onSuccess: () => {
      showSuccess(t('notifications.tournament.deleteSuccess'));
    },
    onError: (error: any) => {
      console.error('Error deleting tournament:', error);
      showError({
        title: t('notifications.tournament.deleteErrorTitle'),
        error,
        fallback: t('notifications.common.unknownError'),
      });
    },
  });
};
export const useGetTournament = (tournamentKey: string) => {
  const {
    data: tournament,
    isLoading: isLoadingTournament,
    isError: isErrorTournament,
    isFetching: isFetchingTournament,
    error: tournamentError,
    refetch: loadTournament,
  } = useQuery({
    queryKey: getGetApiV2TournamentsTournamentKeyDashboardQueryKey(tournamentKey),
    queryFn: () =>
      getApiV2TournamentsTournamentKeyDashboard(tournamentKey),
    enabled: !!tournamentKey,
    select: (dashboard) => dashboard.tournament,
  });
  return {
    tournament,
    isLoadingTournament,
    isErrorTournament,
    isFetchingTournament,
    tournamentError,
    loadTournament,
  };
};

export const useGetTournamentPlayers = (tournamentKey: string, options?: object) => {
  const {
    data,
    isLoading: isLoadingPlayers,
    isError: isErrorPlayers,
    isFetching: isFetchingPlayers,
    error: playersError,
    refetch: loadPlayers,
  } = useQuery({
    queryKey: getGetApiV2TournamentsTournamentKeyDashboardQueryKey(tournamentKey),
    queryFn: () =>
      getApiV2TournamentsTournamentKeyDashboard(tournamentKey),
    enabled: !!tournamentKey,
    select: (dashboard) => dashboard.participants,
    ...(options ?? {}),
  });
  const players = data;
  return {
    players,
    isLoadingPlayers,
    isErrorPlayers,
    isFetchingPlayers,
    playersError,
    loadPlayers,
  };
};

export const useGetAvailableTournamentPlayers = (tournamentKey: string) => {
  const query = useQuery({
    queryKey: getGetApiV2TournamentsTournamentKeyDashboardQueryKey(tournamentKey),
    queryFn: () =>
      getApiV2TournamentsTournamentKeyDashboard(tournamentKey),
    enabled: !!tournamentKey,
    select: (dashboard) => dashboard.available_group_players,
  });
  return {
    players: query.data,
    isLoadingPlayers: query.isLoading,
    isErrorPlayers: query.isError,
    isFetchingPlayers: query.isFetching,
    playersError: query.error,
    loadPlayers: query.refetch,
  };
};

export const useAddTournamentPlayer = () => {
  const { t } = useTranslation();
  const { showError, showSuccess } = useMutationFeedback();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { tournamentKey: string; players: Player[] }) => {
      if (!data.players) {
        throw new Error('Player ID is required');
      }
      const payload = {
        participants: data.players.map((player) => {
          return { player_id: player.id };
        }),
      };
      return postApiV2TournamentsTournamentKeyParticipantsbatchAdd(data.tournamentKey, payload);
    },
    onSuccess: (data, variables) => {
      showSuccess(t('notifications.tournament.addPlayerSuccess'));

      const queryKeyPlayer = getGetApiTournamentsTournamentKeyParticipantsQueryOptions(
        variables.tournamentKey,
      ).queryKey;
      const queryKeyScore = getGetApiTournamentsTournamentKeyScoreMapQueryOptions(
        variables.tournamentKey,
      ).queryKey;
      queryClient.invalidateQueries({ queryKey: queryKeyScore });
      queryClient.invalidateQueries({ queryKey: queryKeyPlayer });
      queryClient.invalidateQueries({
        queryKey: getGetApiV2TournamentsTournamentKeyDashboardQueryKey(variables.tournamentKey),
      });
    },
    onError: (error: any) => {
      console.error('Error adding player:', error);
      showError({
        title: t('notifications.tournament.addPlayerErrorTitle'),
        error,
        fallback: t('notifications.common.unknownError'),
      });
    },
  });
};

export const useDeleteTounamentsPlayer = () => {
  const { t } = useTranslation();
  const { showError, showSuccess } = useMutationFeedback();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { tournamentKey: string; playerId: number }) => {
      return deleteApiV2TournamentsTournamentKeyParticipantsPlayerId(
        data.tournamentKey,
        data.playerId,
      );
    },
    onSuccess: (data, variables) => {
      showSuccess(t('notifications.tournament.deletePlayerSuccess'));
      const queryKeyPlayer = getGetApiTournamentsTournamentKeyParticipantsQueryOptions(
        variables.tournamentKey,
      ).queryKey;
      const queryKeyScore = getGetApiTournamentsTournamentKeyScoreMapQueryOptions(
        variables.tournamentKey,
      ).queryKey;
      queryClient.invalidateQueries({ queryKey: queryKeyScore });
      queryClient.invalidateQueries({ queryKey: queryKeyPlayer });
      queryClient.invalidateQueries({
        queryKey: getGetApiV2TournamentsTournamentKeyDashboardQueryKey(variables.tournamentKey),
      });
    },
    onError: (error: any) => {
      console.error('Error deleting player from tournament:', error);
      showError({
        title: t('notifications.tournament.deletePlayerErrorTitle'),
        error,
        fallback: t('notifications.common.unknownError'),
      });
    },
  });
};
