import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import { useAlertDialog } from '@/components/common/AlertDialogProvider';
import {
  deleteApiGroupsGroupKeyPlayersPlayerId,
  postApiGroupsGroupKeyPlayers,
  useGetApiGroupsGroupKeyPlayers,
} from '@/src/api/generated/mahjongApi';
import type { PlayerCreate } from '@/src/api/generated/mahjongApi.schemas';
/**
 * Fetch players in a group by group key.
 *
 * @param groupKey - Group key to fetch players.
 * @returns An object containing the players data, a boolean indicating if the data is loading, and a function to refetch the data.
 */
export const useGetPlayer = (groupKey: string) => {
  const {
    data: players,
    isLoading: isLoadingPlayers,
    isError: isErrorPlayers,
    isFetching: isFetchingPlayers,
    error: playersError,
    refetch: loadPlayers,
  } = useGetApiGroupsGroupKeyPlayers(groupKey);
  return {
    players,
    isLoadingPlayers,
    isErrorPlayers,
    isFetchingPlayers,
    playersError,
    loadPlayers,
  };
};
export const useCreatePlayer = (onAfterCreate?: () => void) => {
  const { t } = useTranslation();
  const { alertDialog } = useAlertDialog();
  return useMutation({
    mutationFn: (data: { groupKey: string; player: PlayerCreate }) => {
      return postApiGroupsGroupKeyPlayers(data.groupKey, data.player);
    },
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: t('notifications.player.createSuccess'),
      });
      onAfterCreate?.();
    },
    onError: (error: any) => {
      console.error('Error creating player:', error);
      const message =
        error.body?.errors?.json?.message?.[0] ??
        error.body?.message ??
        error.statusText ??
        t('notifications.common.unknownError');
      alertDialog({
        title: t('notifications.player.createErrorTitle'),
        description: message,
        showCancelButton: false,
      });
    },
  });
};
export const useDeletePlayer = (onAfterDelete?: () => void) => {
  const { t } = useTranslation();
  const { alertDialog } = useAlertDialog();
  return useMutation({
    mutationFn: (data: { groupKey: string; playerId: number }) => {
      return deleteApiGroupsGroupKeyPlayersPlayerId(data.groupKey, data.playerId);
    },
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: t('notifications.player.deleteSuccess'),
      });
      onAfterDelete?.();
    },
    onError: (error: any) => {
      console.error('Error deleting player:', error);
      const message =
        error.body?.errors?.json?.message?.[0] ??
        error.body?.message ??
        error.statusText ??
        t('notifications.common.unknownError');
      alertDialog({
        title: t('notifications.player.deleteErrorTitle'),
        description: message,
        showCancelButton: false,
      });
    },
  });
};
