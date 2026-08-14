import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import {
  deleteApiTablesTableKey,
  deleteApiTablesTableKeyPlayersPlayerId,
  getApiTablesTableKeyGames,
  getGetApiTablesTableKeyPlayersQueryKey,
  getGetApiTablesTableKeyQueryOptions,
  postApiTablesTableKeyPlayers,
  postApiTournamentsTournamentKeyTables,
  putApiTablesTableKey,
  useGetApiTablesTableKey,
  useGetApiTablesTableKeyPlayers,
  useGetApiTournamentsTournamentKeyTables,
} from '@/src/api/generated/mahjongApi';
import type {
  TableCreate,
  TablePlayerItem,
  TableUpdate,
} from '@/src/api/generated/mahjongApi.schemas';
import { useDeleteGame } from '@/src/hooks/useGames';
import { useMutationFeedback } from '@/src/hooks/useMutationFeedback';
import { getResourceKey } from '@/src/utils/accessLevel_utils';

export const useGetTables = (tournamentKey: string) => {
  const {
    data: tables,
    isLoading: isLoadingTables,
    isError: isErrorTables,
    isFetching: isFetchingTables,
    error: tablesError,
    refetch: loadTables,
  } = useGetApiTournamentsTournamentKeyTables(tournamentKey);
  return {
    tables,
    isLoadingTables,
    isErrorTables,
    isFetchingTables,
    tablesError,
    loadTables,
  };
};

export const useCreateTable = () => {
  const { t } = useTranslation();
  const { showError, showSuccess } = useMutationFeedback();
  return useMutation({
    mutationFn: (data: { tournamentKey: string; tableCreate: TableCreate }) => {
      return postApiTournamentsTournamentKeyTables(data.tournamentKey, data.tableCreate);
    },
    onSuccess: (data) => {
      showSuccess(t('notifications.table.createSuccess'));
      // 遷移
      const tableKey = getResourceKey(data);
      if (tableKey) router.push(`/table/${tableKey}`);
    },
    onError: (error: any) => {
      console.error('Error creating table:', error);
      showError({
        title: t('notifications.table.createErrorTitle'),
        error,
        fallback: t('notifications.common.unknownError'),
      });
    },
  });
};

export const useUpdateTable = () => {
  const { t } = useTranslation();
  const { showError, showSuccess } = useMutationFeedback();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { tableKey: string; tableUpdate: TableUpdate }) => {
      return putApiTablesTableKey(data.tableKey, data.tableUpdate);
    },
    onSuccess: (data, variables) => {
      showSuccess(t('notifications.table.updateSuccess'));
      // キャッシュ更新
      const queryKey = getGetApiTablesTableKeyQueryOptions(variables.tableKey).queryKey;
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: any) => {
      console.error('Error updating table:', error);
      showError({
        title: t('notifications.table.updateErrorTitle'),
        error,
        fallback: t('notifications.common.unknownError'),
      });
    },
  });
};

export const useGetTable = (tableKey: string, optins?: object) => {
  const {
    data: table,
    isLoading: isLoadingTable,
    isError: isErrorTable,
    isFetching: isFetchingTable,
    error: tableError,
    refetch: loadTable,
  } = useGetApiTablesTableKey(tableKey, optins);
  return {
    table,
    isLoadingTable,
    isErrorTable,
    isFetchingTable,
    tableError,
    loadTable,
  };
};

export const useDeleteTable = () => {
  const { t } = useTranslation();
  const { showError, showSuccess } = useMutationFeedback();
  return useMutation({
    mutationFn: (data: { tableKey: string }) => {
      return deleteApiTablesTableKey(data.tableKey);
    },
    onSuccess: () => {
      showSuccess(t('notifications.table.deleteSuccess'));
    },
    onError: (error: any) => {
      console.error('Error deleting table:', error);
      showError({
        title: t('notifications.table.deleteErrorTitle'),
        error,
        fallback: t('notifications.common.unknownError'),
      });
    },
  });
};

export const useGetTablePlayer = (tableKey: string, optins?: object) => {
  const {
    data,
    isLoading: isLoadingPlayers,
    isError: isErrorPlayers,
    isFetching: isFetchingPlayers,
    error: playersError,
    refetch: loadPlayers,
  } = useGetApiTablesTableKeyPlayers(tableKey, optins);
  const players = data?.table_players;
  return {
    players,
    isLoadingPlayers,
    isErrorPlayers,
    isFetchingPlayers,
    playersError,
    loadPlayers,
  };
};

export const useAddTablePlayer = () => {
  const { t } = useTranslation();
  const { showError, showSuccess } = useMutationFeedback();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { tableKey: string; tablePlayersItem: TablePlayerItem[] }) => {
      return postApiTablesTableKeyPlayers(data.tableKey, { players: data.tablePlayersItem });
    },
    onSuccess: (data, variables) => {
      showSuccess(t('notifications.table.addPlayersSuccess'));
      // キャッシュ更新
      const queryKey = getGetApiTablesTableKeyPlayersQueryKey(variables.tableKey);
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: any) => {
      console.error('Error adding players to table:', error);
      showError({
        title: t('notifications.table.addPlayersErrorTitle'),
        error,
        fallback: t('notifications.common.unknownError'),
      });
    },
  });
};

export const useDeleteTablePlayer = () => {
  const { t } = useTranslation();
  const { showError, showSuccess } = useMutationFeedback();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { tableKey: string; playerId: number }) => {
      return deleteApiTablesTableKeyPlayersPlayerId(data.tableKey, data.playerId);
    },
    onSuccess: (data, variables) => {
      showSuccess(t('notifications.table.removePlayersSuccess'));
      // キャッシュ更新
      const queryKey = getGetApiTablesTableKeyPlayersQueryKey(variables.tableKey);
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: any) => {
      console.error('Error removing players from table:', error);
      showError({
        title: t('notifications.table.removePlayersErrorTitle'),
        error,
        fallback: t('notifications.common.unknownError'),
      });
    },
  });
};

export const useDeleteChipTableWithScores = () => {
  const { t } = useTranslation();
  const { showError, showSuccess } = useMutationFeedback();
  // チップテーブルのスコアデータとテーブル自体を削除する。
  const { mutateAsync: deleteScores } = useDeleteGame();

  return useMutation({
    mutationFn: async (tableKey: string) => {
      // 1. まず、該当テーブルの全ゲームを取得
      const games = await getApiTablesTableKeyGames(tableKey);
      // 2. 各ゲームを削除
      for (const game of games) {
        if (game.id) {
          await deleteScores({ tableKey, gameId: game.id });
        }
      }
      // 3. 最後にテーブル自体を削除
      return deleteApiTablesTableKey(tableKey);
    },
    onSuccess: () => {
      showSuccess(t('notifications.table.deleteSuccess'));
    },
    onError: (error: any) => {
      console.error('Error deleting table:', error);
      showError({
        title: t('notifications.table.deleteErrorTitle'),
        error,
        fallback: t('notifications.common.unknownError'),
      });
    },
  });
};
