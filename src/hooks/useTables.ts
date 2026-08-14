import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import { useAlertDialog } from '@/components/common/AlertDialogProvider';
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
  const { alertDialog } = useAlertDialog();
  return useMutation({
    mutationFn: (data: { tournamentKey: string; tableCreate: TableCreate }) => {
      return postApiTournamentsTournamentKeyTables(data.tournamentKey, data.tableCreate);
    },
    onSuccess: (data) => {
      Toast.show({
        type: 'success',
        text1: t('notifications.table.createSuccess'),
        position: 'bottom',
      });
      // 遷移
      const tableKey = getResourceKey(data);
      if (tableKey) router.push(`/table/${tableKey}`);
    },
    onError: (error: any) => {
      console.error('Error creating table:', error);
      const message =
        error.body?.errors?.json?.message?.[0] ??
        error.body?.message ??
        error.statusText ??
        t('notifications.common.unknownError');
      alertDialog({
        title: t('notifications.table.createErrorTitle'),
        description: message,
        showCancelButton: false,
      });
    },
  });
};

export const useUpdateTable = () => {
  const { t } = useTranslation();
  const { alertDialog } = useAlertDialog();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { tableKey: string; tableUpdate: TableUpdate }) => {
      return putApiTablesTableKey(data.tableKey, data.tableUpdate);
    },
    onSuccess: (data, variables) => {
      Toast.show({
        type: 'success',
        text1: t('notifications.table.updateSuccess'),
        position: 'bottom',
      });
      // キャッシュ更新
      const queryKey = getGetApiTablesTableKeyQueryOptions(variables.tableKey).queryKey;
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: any) => {
      console.error('Error updating table:', error);
      const message =
        error.body?.errors?.json?.message?.[0] ??
        error.body?.message ??
        error.statusText ??
        t('notifications.common.unknownError');
      alertDialog({
        title: t('notifications.table.updateErrorTitle'),
        description: message,
        showCancelButton: false,
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
  const { alertDialog } = useAlertDialog();
  return useMutation({
    mutationFn: (data: { tableKey: string }) => {
      return deleteApiTablesTableKey(data.tableKey);
    },
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: t('notifications.table.deleteSuccess'),
        position: 'bottom',
      });
    },
    onError: (error: any) => {
      console.error('Error deleting table:', error);
      const message =
        error.body?.errors?.json?.message?.[0] ??
        error.body?.message ??
        error.statusText ??
        t('notifications.common.unknownError');
      alertDialog({
        title: t('notifications.table.deleteErrorTitle'),
        description: message,
        showCancelButton: false,
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
  const { alertDialog } = useAlertDialog();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { tableKey: string; tablePlayersItem: TablePlayerItem[] }) => {
      return postApiTablesTableKeyPlayers(data.tableKey, { players: data.tablePlayersItem });
    },
    onSuccess: (data, variables) => {
      Toast.show({
        type: 'success',
        text1: t('notifications.table.addPlayersSuccess'),
        position: 'bottom',
      });
      // キャッシュ更新
      const queryKey = getGetApiTablesTableKeyPlayersQueryKey(variables.tableKey);
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: any) => {
      console.error('Error adding players to table:', error);
      const message =
        error.body?.errors?.json?.message?.[0] ??
        error.body?.message ??
        error.statusText ??
        t('notifications.common.unknownError');
      alertDialog({
        title: t('notifications.table.addPlayersErrorTitle'),
        description: message,
        showCancelButton: false,
      });
    },
  });
};

export const useDeleteTablePlayer = () => {
  const { t } = useTranslation();
  const { alertDialog } = useAlertDialog();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { tableKey: string; playerId: number }) => {
      return deleteApiTablesTableKeyPlayersPlayerId(data.tableKey, data.playerId);
    },
    onSuccess: (data, variables) => {
      Toast.show({
        type: 'success',
        text1: t('notifications.table.removePlayersSuccess'),
        position: 'bottom',
      });
      // キャッシュ更新
      const queryKey = getGetApiTablesTableKeyPlayersQueryKey(variables.tableKey);
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: any) => {
      console.error('Error removing players from table:', error);
      const message =
        error.body?.errors?.json?.message?.[0] ??
        error.body?.message ??
        error.statusText ??
        t('notifications.common.unknownError');
      alertDialog({
        title: t('notifications.table.removePlayersErrorTitle'),
        description: message,
        showCancelButton: false,
      });
    },
  });
};

export const useDeleteChipTableWithScores = () => {
  const { t } = useTranslation();
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
      Toast.show({
        type: 'success',
        text1: t('notifications.table.deleteSuccess'),
        position: 'bottom',
      });
    },
    onError: (error: any) => {
      console.error('Error deleting table:', error);
      const message =
        error.body?.errors?.json?.message?.[0] ??
        error.body?.message ??
        error.statusText ??
        t('notifications.common.unknownError');
      Toast.show({
        type: 'error',
        text1: message,
        position: 'bottom',
      });
    },
  });
};
