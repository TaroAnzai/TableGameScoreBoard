import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import {
  deleteApiTournamentsTournamentKey,
  deleteApiTournamentsTournamentKeyParticipantsPlayerId,
  getGetApiTournamentsTournamentKeyParticipantsQueryOptions,
  getGetApiTournamentsTournamentKeyQueryOptions,
  getGetApiTournamentsTournamentKeyScoreMapQueryOptions,
  postApiGroupsGroupKeyTournaments,
  postApiTournamentsTournamentKeyParticipants,
  putApiTournamentsTournamentKey,
  useGetApiGroupsGroupKeyTournaments,
  useGetApiTournamentsTournamentKey,
  useGetApiTournamentsTournamentKeyParticipants,
} from '@/src/api/generated/mahjongApi';
import type {
  Player,
  TournamentCreate,
  TournamentUpdate,
} from '@/src/api/generated/mahjongApi.schemas';
import { useMutationFeedback } from '@/src/hooks/useMutationFeedback';

export const useCreateTournament = () => {
  const { t } = useTranslation();
  const { showError, showSuccess } = useMutationFeedback();

  return useMutation({
    mutationFn: (data: { groupKey: string; tournament: TournamentCreate }) => {
      return postApiGroupsGroupKeyTournaments(data.groupKey, data.tournament);
    },
    onSuccess: () => {
      showSuccess(t('notifications.tournament.createSuccess'));
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
  } = useGetApiGroupsGroupKeyTournaments(groupKey);
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
    mutationFn: (data: { tournamentKey: string; tournament: TournamentUpdate }) => {
      return putApiTournamentsTournamentKey(data.tournamentKey, data.tournament);
    },
    onSuccess: (data, variables) => {
      showSuccess(t('notifications.tournament.updateSuccess'));
      const queryKeytournament = getGetApiTournamentsTournamentKeyQueryOptions(
        variables.tournamentKey,
      ).queryKey;
      const queryKeyScore = getGetApiTournamentsTournamentKeyScoreMapQueryOptions(
        variables.tournamentKey,
      ).queryKey;
      queryClient.invalidateQueries({ queryKey: queryKeytournament });
      queryClient.invalidateQueries({ queryKey: queryKeyScore });
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
  } = useGetApiTournamentsTournamentKey(tournamentKey);
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
  } = useGetApiTournamentsTournamentKeyParticipants(tournamentKey, options);
  const players = data?.participants;
  return {
    players,
    isLoadingPlayers,
    isErrorPlayers,
    isFetchingPlayers,
    playersError,
    loadPlayers,
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
      return postApiTournamentsTournamentKeyParticipants(data.tournamentKey, payload);
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
      return deleteApiTournamentsTournamentKeyParticipantsPlayerId(
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
