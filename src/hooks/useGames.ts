import { useMutation, useQueryClient } from '@tanstack/react-query';
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
  const { alertDialog } = useAlertDialog();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { tableKey: string; gameCreate: GameCreate }) => {
      return postApiTablesTableKeyGames(data.tableKey, data.gameCreate);
    },
    onSuccess: (data, variables) => {
      Toast.show({
        type: 'success',
        text1: 'New game created successfully',
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
        'Unknown error';
      alertDialog({
        title: 'Error creating game',
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
  const { alertDialog } = useAlertDialog();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { tableKey: string; gameId: number; gameUpdate: GameUpdate }) => {
      return putApiTablesTableKeyGamesGameId(data.tableKey, data.gameId, data.gameUpdate);
    },
    onSuccess: (data, variables) => {
      Toast.show({
        type: 'success',
        text1: 'Game updated successfully',
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
        'Unknown error';
      alertDialog({
        title: 'Error updating game',
        description: message,
        showCancelButton: false,
      });
    },
  });
};

export const useDeleteGame = () => {
  const { alertDialog } = useAlertDialog();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { tableKey: string; gameId: number }) => {
      return deleteApiTablesTableKeyGamesGameId(data.tableKey, data.gameId);
    },
    onSuccess: (data, variables) => {
      Toast.show({
        type: 'success',
        text1: 'Game deleted successfully',
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
        'Unknown error';
      alertDialog({
        title: 'Error deleting game',
        description: message,
        showCancelButton: false,
      });
    },
  });
};
