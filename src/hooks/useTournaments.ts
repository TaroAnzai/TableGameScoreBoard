import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import { useAlertDialog } from '@/components/common/AlertDialogProvider';
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

export const useCreateTournament = () => {
  const { t } = useTranslation();
  const { alertDialog } = useAlertDialog();

  return useMutation({
    mutationFn: (data: { groupKey: string; tournament: TournamentCreate }) => {
      return postApiGroupsGroupKeyTournaments(data.groupKey, data.tournament);
    },
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: t('notifications.tournament.createSuccess'),
      });
    },
    onError: (error: any) => {
      console.error('Error creating tournament:', error);
      const message =
        error.body?.errors?.json?.message?.[0] ??
        error.body?.message ??
        error.statusText ??
        t('notifications.common.unknownError');
      alertDialog({
        title: t('notifications.tournament.createErrorTitle'),
        description: message,
        showCancelButton: false,
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
  const { alertDialog } = useAlertDialog();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { tournamentKey: string; tournament: TournamentUpdate }) => {
      return putApiTournamentsTournamentKey(data.tournamentKey, data.tournament);
    },
    onSuccess: (data, variables) => {
      Toast.show({
        type: 'success',
        text1: t('notifications.tournament.updateSuccess'),
      });
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
      const message =
        error.body?.errors?.json?.message?.[0] ??
        error.body?.message ??
        error.statusText ??
        t('notifications.common.unknownError');
      alertDialog({
        title: t('notifications.tournament.updateErrorTitle'),
        description: message,
        showCancelButton: false,
      });
    },
  });
};
export const useDeleteTournament = () => {
  const { t } = useTranslation();
  const { alertDialog } = useAlertDialog();

  return useMutation({
    mutationFn: (data: { tournamentKey: string }) => {
      return deleteApiTournamentsTournamentKey(data.tournamentKey);
    },
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: t('notifications.tournament.deleteSuccess'),
      });
    },
    onError: (error: any) => {
      console.error('Error deleting tournament:', error);
      const message =
        error.body?.errors?.json?.message?.[0] ??
        error.body?.message ??
        error.statusText ??
        t('notifications.common.unknownError');
      alertDialog({
        title: t('notifications.tournament.deleteErrorTitle'),
        description: message,
        showCancelButton: false,
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
  const { alertDialog } = useAlertDialog();
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
      Toast.show({
        type: 'success',
        text1: t('notifications.tournament.addPlayerSuccess'),
      });

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
      const message =
        error.body?.errors?.json?.message?.[0] ??
        error.body?.message ??
        error.statusText ??
        t('notifications.common.unknownError');
      alertDialog({
        title: t('notifications.tournament.addPlayerErrorTitle'),
        description: message,
        showCancelButton: false,
      });
    },
  });
};

export const useDeleteTounamentsPlayer = () => {
  const { t } = useTranslation();
  const { alertDialog } = useAlertDialog();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { tournamentKey: string; playerId: number }) => {
      return deleteApiTournamentsTournamentKeyParticipantsPlayerId(
        data.tournamentKey,
        data.playerId,
      );
    },
    onSuccess: (data, variables) => {
      Toast.show({
        type: 'success',
        text1: t('notifications.tournament.deletePlayerSuccess'),
      });
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
      const message =
        error.body?.errors?.json?.message?.[0] ??
        error.body?.message ??
        error.statusText ??
        t('notifications.common.unknownError');
      alertDialog({
        title: t('notifications.tournament.deletePlayerErrorTitle'),
        description: message,
        showCancelButton: false,
      });
    },
  });
};
