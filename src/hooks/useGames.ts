import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import {
  deleteApiTablesTableKeyGamesGameId,
  getGetApiTablesTableKeyGamesQueryKey,
  postApiTablesTableKeyGames,
  putApiTablesTableKeyGamesGameId,
  useGetApiTablesTableKeyGames,
} from '@/src/api/generated/mahjongApi';
import type { GameCreate, GameUpdate } from '@/src/api/generated/mahjongApi.schemas';
import { useMutationFeedback } from '@/src/hooks/useMutationFeedback';

export const useCreateGame = () => {
  const { t } = useTranslation();
  const { showError, showSuccess } = useMutationFeedback();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { tableKey: string; gameCreate: GameCreate }) => {
      return postApiTablesTableKeyGames(data.tableKey, data.gameCreate);
    },
    onSuccess: (data, variables) => {
      showSuccess(t('notifications.game.createSuccess'));
      const queryKey = getGetApiTablesTableKeyGamesQueryKey(variables.tableKey);
      queryClient.invalidateQueries({ queryKey });
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
export const useGetTableGames = (tableKey: string, optins?: object) => {
  const {
    data: games,
    isLoading: isLoadingGames,
    isError: isErrorGames,
    isFetching: isFetchingGames,
    error: gamesError,
    refetch: loadGames,
  } = useGetApiTablesTableKeyGames(tableKey, optins);
  return { games, isLoadingGames, isErrorGames, isFetchingGames, gamesError, loadGames };
};
export const useUpdateGame = () => {
  const { t } = useTranslation();
  const { showError, showSuccess } = useMutationFeedback();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { tableKey: string; gameId: number; gameUpdate: GameUpdate }) => {
      return putApiTablesTableKeyGamesGameId(data.tableKey, data.gameId, data.gameUpdate);
    },
    onSuccess: (data, variables) => {
      showSuccess(t('notifications.game.updateSuccess'));
      const queryKey = getGetApiTablesTableKeyGamesQueryKey(variables.tableKey);
      queryClient.invalidateQueries({ queryKey });
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
    mutationFn: (data: { tableKey: string; gameId: number }) => {
      return deleteApiTablesTableKeyGamesGameId(data.tableKey, data.gameId);
    },
    onSuccess: (data, variables) => {
      showSuccess(t('notifications.game.deleteSuccess'));
      const queryKey = getGetApiTablesTableKeyGamesQueryKey(variables.tableKey);
      queryClient.invalidateQueries({ queryKey });
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
