import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import { useAlertDialog } from '@/components/common/AlertDialogProvider';
import {
  deleteApiTablesTableKeyGamesGameId,
  getGetApiTablesTableKeyGamesQueryKey,
  postApiTablesTableKeyGames,
  putApiTablesTableKeyGamesGameId,
  useGetApiTablesTableKeyGames,
} from '@/src/api/generated/mahjongApi';
import type { GameCreate, GameUpdate } from '@/src/api/generated/mahjongApi.schemas';

export const useCreateGame = () => {
  const { t } = useTranslation();
  const { alertDialog } = useAlertDialog();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { tableKey: string; gameCreate: GameCreate }) => {
      return postApiTablesTableKeyGames(data.tableKey, data.gameCreate);
    },
    onSuccess: (data, variables) => {
      Toast.show({
        type: 'success',
        text1: t('notifications.game.createSuccess'),
        position: 'bottom',
      });
      const queryKey = getGetApiTablesTableKeyGamesQueryKey(variables.tableKey);
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: any) => {
      console.error('Error creating game:', error);
      const message =
        error.body?.errors?.json?.message?.[0] ??
        error.body?.message ??
        error.statusText ??
        t('notifications.common.unknownError');
      alertDialog({
        title: t('notifications.game.createErrorTitle'),
        description: message,
        showCancelButton: false,
      });
    },
  });
};
export const useGetTableGames = (tableKey: string, optins?: object) => {
  const { data: games, isLoading: isLoadingGames } = useGetApiTablesTableKeyGames(tableKey, optins);
  return { games, isLoadingGames };
};
export const useUpdateGame = () => {
  const { t } = useTranslation();
  const { alertDialog } = useAlertDialog();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { tableKey: string; gameId: number; gameUpdate: GameUpdate }) => {
      return putApiTablesTableKeyGamesGameId(data.tableKey, data.gameId, data.gameUpdate);
    },
    onSuccess: (data, variables) => {
      Toast.show({
        type: 'success',
        text1: t('notifications.game.updateSuccess'),
        position: 'bottom',
      });
      const queryKey = getGetApiTablesTableKeyGamesQueryKey(variables.tableKey);
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: any) => {
      console.error('Error updating game:', error);
      const message =
        error.body?.errors?.json?.scores?.[0] ??
        error.body?.errors?.json?.message?.[0] ??
        error.body?.message ??
        error.statusText ??
        t('notifications.common.unknownError');
      alertDialog({
        title: t('notifications.game.updateErrorTitle'),
        description: message,
        showCancelButton: false,
      });
    },
  });
};

export const useDeleteGame = () => {
  const { t } = useTranslation();
  const { alertDialog } = useAlertDialog();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { tableKey: string; gameId: number }) => {
      return deleteApiTablesTableKeyGamesGameId(data.tableKey, data.gameId);
    },
    onSuccess: (data, variables) => {
      Toast.show({
        type: 'success',
        text1: t('notifications.game.deleteSuccess'),
        position: 'bottom',
      });
      const queryKey = getGetApiTablesTableKeyGamesQueryKey(variables.tableKey);
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: any) => {
      console.error('Error deleting game:', error);
      const message =
        error.body?.errors?.json?.message?.[0] ??
        error.body?.message ??
        error.statusText ??
        t('notifications.common.unknownError');
      alertDialog({
        title: t('notifications.game.deleteErrorTitle'),
        description: message,
        showCancelButton: false,
      });
    },
  });
};
