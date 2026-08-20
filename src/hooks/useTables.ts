import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import {
  deleteApiTablesTableKeyPlayersPlayerId,
  deleteApiV2TablesTableKey,
  getApiV2TablesTableKeyDashboard,
  getGetApiTablesTableKeyPlayersQueryKey,
  getGetApiTablesTableKeyQueryOptions,
  getGetApiTournamentsTournamentKeyScoreMapQueryKey,
  getGetApiTournamentsTournamentKeyTablesQueryKey,
  getGetApiV2TablesTableKeyDashboardQueryKey,
  getGetApiV2TournamentsTournamentKeyDashboardQueryKey,
  postApiTablesTableKeyPlayers,
  postApiTournamentsTournamentKeyTables,
  putApiTablesTableKey,
} from '@/src/api/generated/mahjongApi';
import type {
  Table,
  TableCreate,
  TablePlayerItem,
  TableUpdate,
  TournamentScoreMap,
} from '@/src/api/generated/mahjongApi.schemas';
import { useMutationFeedback } from '@/src/hooks/useMutationFeedback';
import { getResourceKey } from '@/src/utils/accessLevel_utils';

type UseCreateTableOptions = {
  navigateOnSuccess?: boolean;
};

export const useGetTableDashboard = (tableKey: string, options?: object) => {
  const {
    data: dashboard,
    isLoading: isLoadingDashboard,
    isError: isErrorDashboard,
    isFetching: isFetchingDashboard,
    error: dashboardError,
    refetch: loadDashboard,
  } = useQuery({
    queryKey: getGetApiV2TablesTableKeyDashboardQueryKey(tableKey),
    queryFn: () => getApiV2TablesTableKeyDashboard(tableKey),
    enabled: !!tableKey,
    ...(options ?? {}),
  });
  return {
    dashboard,
    isLoadingDashboard,
    isErrorDashboard,
    isFetchingDashboard,
    dashboardError,
    loadDashboard,
  };
};

export const useCreateTable = ({ navigateOnSuccess = true }: UseCreateTableOptions = {}) => {
  const { t } = useTranslation();
  const { showError, showSuccess } = useMutationFeedback();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { tournamentKey: string; tableCreate: TableCreate }) => {
      return postApiTournamentsTournamentKeyTables(data.tournamentKey, data.tableCreate);
    },
    onSuccess: async (data, variables) => {
      showSuccess(t('notifications.table.createSuccess'));
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: getGetApiTournamentsTournamentKeyTablesQueryKey(variables.tournamentKey),
        }),
        queryClient.invalidateQueries({
          queryKey: getGetApiTournamentsTournamentKeyScoreMapQueryKey(variables.tournamentKey),
        }),
        queryClient.invalidateQueries({
          queryKey: getGetApiV2TournamentsTournamentKeyDashboardQueryKey(variables.tournamentKey),
        }),
      ]);
      // 遷移
      const tableKey = getResourceKey(data);
      if (tableKey && navigateOnSuccess) {
        router.push({
          pathname: '/table/[tableKey]',
          params: {
            tableKey,
            parentTournamentKey: variables.tournamentKey,
          },
        });
      }
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
    mutationFn: (data: { tableKey: string; tournamentKey?: string; tableUpdate: TableUpdate }) => {
      return putApiTablesTableKey(data.tableKey, data.tableUpdate);
    },
    onSuccess: async (data, variables) => {
      showSuccess(t('notifications.table.updateSuccess'));
      const tableQueryKey = getGetApiTablesTableKeyQueryOptions(variables.tableKey).queryKey;

      // The update response is authoritative. Write it through to every view that
      // displays the table name so the UI does not depend on a follow-up request.
      queryClient.setQueryData<Table>(tableQueryKey, data);

      const invalidations = [
        queryClient.invalidateQueries({
          queryKey: tableQueryKey,
        }),
        queryClient.invalidateQueries({
          queryKey: getGetApiV2TablesTableKeyDashboardQueryKey(variables.tableKey),
        }),
      ];
      if (variables.tournamentKey) {
        const tablesQueryKey = getGetApiTournamentsTournamentKeyTablesQueryKey(
          variables.tournamentKey,
        );
        const scoreMapQueryKey = getGetApiTournamentsTournamentKeyScoreMapQueryKey(
          variables.tournamentKey,
        );

        queryClient.setQueryData<Table[]>(tablesQueryKey, (tables) =>
          tables?.map((table) => (table.id === data.id ? data : table)),
        );
        queryClient.setQueryData<TournamentScoreMap>(scoreMapQueryKey, (scoreMap) =>
          scoreMap
            ? {
                ...scoreMap,
                tables: scoreMap.tables.map((table) =>
                  table.id === data.id ? { ...table, name: data.name, type: data.type } : table,
                ),
              }
            : scoreMap,
        );

        invalidations.push(
          queryClient.invalidateQueries({
            queryKey: tablesQueryKey,
          }),
          queryClient.invalidateQueries({
            queryKey: scoreMapQueryKey,
          }),
          queryClient.invalidateQueries({
            queryKey: getGetApiV2TournamentsTournamentKeyDashboardQueryKey(variables.tournamentKey),
          }),
        );
      }
      await Promise.all(invalidations);
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

export const useDeleteTable = () => {
  const { t } = useTranslation();
  const { showError, showSuccess } = useMutationFeedback();
  return useMutation({
    mutationFn: (data: { tableKey: string }) => {
      return deleteApiV2TablesTableKey(data.tableKey);
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
      queryClient.invalidateQueries({
        queryKey: getGetApiV2TablesTableKeyDashboardQueryKey(variables.tableKey),
      });
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
      queryClient.invalidateQueries({
        queryKey: getGetApiV2TablesTableKeyDashboardQueryKey(variables.tableKey),
      });
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
  const mutation = useDeleteTable();
  return {
    ...mutation,
    mutate: (tableKey: string, options?: Parameters<typeof mutation.mutate>[1]) =>
      mutation.mutate({ tableKey }, options),
    mutateAsync: (tableKey: string, options?: Parameters<typeof mutation.mutateAsync>[1]) =>
      mutation.mutateAsync({ tableKey }, options),
  };
};
