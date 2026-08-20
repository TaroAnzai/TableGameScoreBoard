import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import {
  deleteApiTablesTableKeyGamesGameId,
  getGetApiTablesTableKeyGamesQueryKey,
  getGetApiTournamentsTournamentKeyScoreMapQueryKey,
  getGetApiV2TablesTableKeyDashboardQueryKey,
  getGetApiV2TournamentsTournamentKeyDashboardQueryKey,
  postApiTablesTableKeyGames,
  putApiTablesTableKeyGamesGameId,
} from '@/src/api/generated/mahjongApi';
import type { GameCreate, GameUpdate } from '@/src/api/generated/mahjongApi.schemas';
import { useMutationFeedback } from '@/src/hooks/useMutationFeedback';

export const useCreateGame = () => {
  const { t } = useTranslation();
  const { showError, showSuccess } = useMutationFeedback();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { tableKey: string; tournamentKey?: string; gameCreate: GameCreate }) => {
      return postApiTablesTableKeyGames(data.tableKey, data.gameCreate);
    },
    onSuccess: async (data, variables) => {
      showSuccess(t('notifications.game.createSuccess'));
      const invalidations = [
        queryClient.invalidateQueries({
          queryKey: getGetApiTablesTableKeyGamesQueryKey(variables.tableKey),
        }),
        queryClient.invalidateQueries({
          queryKey: getGetApiV2TablesTableKeyDashboardQueryKey(variables.tableKey),
        }),
      ];
      if (variables.tournamentKey) {
        invalidations.push(
          queryClient.invalidateQueries({
            queryKey: getGetApiTournamentsTournamentKeyScoreMapQueryKey(variables.tournamentKey),
          }),
          queryClient.invalidateQueries({
            queryKey: getGetApiV2TournamentsTournamentKeyDashboardQueryKey(variables.tournamentKey),
          }),
        );
      }
      await Promise.all(invalidations);
    },
    onError: (error: any) => {
      console.error('Error creating game:', error);
      showError({
        title: t('notifications.game.createErrorTitle'),
        error,
        fallback: t('notifications.common.unknownError'),
      });
    },
  });
};
export const useUpdateGame = () => {
  const { t } = useTranslation();
  const { showError, showSuccess } = useMutationFeedback();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      tableKey: string;
      tournamentKey?: string;
      gameId: number;
      gameUpdate: GameUpdate;
    }) => {
      return putApiTablesTableKeyGamesGameId(data.tableKey, data.gameId, data.gameUpdate);
    },
    onSuccess: async (data, variables) => {
      showSuccess(t('notifications.game.updateSuccess'));
      const invalidations = [
        queryClient.invalidateQueries({
          queryKey: getGetApiTablesTableKeyGamesQueryKey(variables.tableKey),
        }),
        queryClient.invalidateQueries({
          queryKey: getGetApiV2TablesTableKeyDashboardQueryKey(variables.tableKey),
        }),
      ];
      if (variables.tournamentKey) {
        invalidations.push(
          queryClient.invalidateQueries({
            queryKey: getGetApiTournamentsTournamentKeyScoreMapQueryKey(variables.tournamentKey),
          }),
          queryClient.invalidateQueries({
            queryKey: getGetApiV2TournamentsTournamentKeyDashboardQueryKey(variables.tournamentKey),
          }),
        );
      }
      await Promise.all(invalidations);
    },
    onError: (error: any) => {
      console.error('Error updating game:', error);
      showError({
        title: t('notifications.game.updateErrorTitle'),
        error,
        fallback: t('notifications.common.unknownError'),
      });
    },
  });
};

export const useDeleteGame = () => {
  const { t } = useTranslation();
  const { showError, showSuccess } = useMutationFeedback();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { tableKey: string; tournamentKey?: string; gameId: number }) => {
      return deleteApiTablesTableKeyGamesGameId(data.tableKey, data.gameId);
    },
    onSuccess: async (data, variables) => {
      showSuccess(t('notifications.game.deleteSuccess'));
      const invalidations = [
        queryClient.invalidateQueries({
          queryKey: getGetApiTablesTableKeyGamesQueryKey(variables.tableKey),
        }),
        queryClient.invalidateQueries({
          queryKey: getGetApiV2TablesTableKeyDashboardQueryKey(variables.tableKey),
        }),
      ];
      if (variables.tournamentKey) {
        invalidations.push(
          queryClient.invalidateQueries({
            queryKey: getGetApiTournamentsTournamentKeyScoreMapQueryKey(variables.tournamentKey),
          }),
          queryClient.invalidateQueries({
            queryKey: getGetApiV2TournamentsTournamentKeyDashboardQueryKey(variables.tournamentKey),
          }),
        );
      }
      await Promise.all(invalidations);
    },
    onError: (error: any) => {
      console.error('Error deleting game:', error);
      showError({
        title: t('notifications.game.deleteErrorTitle'),
        error,
        fallback: t('notifications.common.unknownError'),
      });
    },
  });
};
