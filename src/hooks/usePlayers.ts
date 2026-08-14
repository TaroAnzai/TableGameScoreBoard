import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import {
  deleteApiGroupsGroupKeyPlayersPlayerId,
  postApiGroupsGroupKeyPlayers,
  useGetApiGroupsGroupKeyPlayers,
} from '@/src/api/generated/mahjongApi';
import type { PlayerCreate } from '@/src/api/generated/mahjongApi.schemas';
import { useMutationFeedback } from '@/src/hooks/useMutationFeedback';
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
  const { showError, showSuccess } = useMutationFeedback();
  return useMutation({
    mutationFn: (data: { groupKey: string; player: PlayerCreate }) => {
      return postApiGroupsGroupKeyPlayers(data.groupKey, data.player);
    },
    onSuccess: () => {
      showSuccess(t('notifications.player.createSuccess'));
      onAfterCreate?.();
    },
    onError: (error: any) => {
      console.error('Error creating player:', error);
      showError({
        title: t('notifications.player.createErrorTitle'),
        error,
        fallback: t('notifications.common.unknownError'),
      });
    },
  });
};
export const useDeletePlayer = (onAfterDelete?: () => void) => {
  const { t } = useTranslation();
  const { showError, showSuccess } = useMutationFeedback();
  return useMutation({
    mutationFn: (data: { groupKey: string; playerId: number }) => {
      return deleteApiGroupsGroupKeyPlayersPlayerId(data.groupKey, data.playerId);
    },
    onSuccess: () => {
      showSuccess(t('notifications.player.deleteSuccess'));
      onAfterDelete?.();
    },
    onError: (error: any) => {
      console.error('Error deleting player:', error);
      showError({
        title: t('notifications.player.deleteErrorTitle'),
        error,
        fallback: t('notifications.common.unknownError'),
      });
    },
  });
};
