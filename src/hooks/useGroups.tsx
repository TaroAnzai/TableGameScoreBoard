// src/hooks/useGroups.tsx

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import { useAlertDialog } from '@/components/common/AlertDialogProvider';
import { getUserFacingApiError } from '@/src/api/apiErrorPresentation';
import type { GroupDashboard } from '@/src/api/dashboardTypes';
import type {
  Group,
  GroupCreate,
  GroupRequest,
  GroupResponse,
  GroupUpdate,
} from '@/src/api/generated/mahjongApi.schemas';
import { useMutationFeedback } from '@/src/hooks/useMutationFeedback';
import { appStorage, PendingGroup } from '@/src/storage/appStorage';
import { syncPendingGroups } from '@/src/utils/groupSync';

import {
  getApiV2GroupsGroupKeyDashboard,
  getGetApiV2GroupsGroupKeyDashboardQueryKey,
  postApiGroups,
  postApiGroupsRequestLink,
  postApiV2GroupsbatchGet,
  putApiGroupsGroupKey,
} from '../api/generated/mahjongApi';
import { formatLocalDateTime, toLocalDate } from '../utils/date_utils';

export const useGetGroupDashboard = (groupKey: string) =>
  useQuery({
    queryKey: getGetApiV2GroupsGroupKeyDashboardQueryKey(groupKey),
    queryFn: () =>
      getApiV2GroupsGroupKeyDashboard(groupKey) as unknown as Promise<GroupDashboard>,
    enabled: !!groupKey,
    select: (dashboard) => dashboard.group,
  });

/**
 * Hook to create a new group.
 *
 * @param onAfterCreate - Callback to be executed after the group is created successfully.
 * @returns A mutation object with the group creation mutation function, onSuccess callback, and onError callback.
 *
 * Usage example:
 * const { mutate: createGroup } = useCreateGroup();
 * const createGroupData = { name: 'My Group', description: 'This is my group.' };
 * createGroup(createGroupData).then((data) => console.log(data)).catch((error) => console.error(error));
 */
export const useCreateGroupRequest = () => {
  const { alertDialog } = useAlertDialog();
  const { showError } = useMutationFeedback();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: GroupRequest) => {
      return postApiGroupsRequestLink(data);
    },
    onSuccess: async (data: GroupResponse, variables: GroupRequest) => {
      const expire_at = formatLocalDateTime(toLocalDate(data.expires_at));
      await appStorage.addPendingGroupKey({
        token: data.token,
        groupName: variables.name,
        expiresAt: toLocalDate(data.expires_at) ?? new Date(),
      });
      // AsyncStorageからpendingGroupsを再取得させる
      await queryClient.invalidateQueries({
        queryKey: GROUP_KEYS_QUERY_KEY,
      });
      alertDialog({
        title: t('hooks.groupRequest.emailSentTitle'),
        description: t('hooks.groupRequest.emailSentDescription'),
        text1: t('hooks.groupRequest.emailSentBodyLink'),
        text2: t('hooks.groupRequest.emailSentBodyExpire', { expire_at }),
        text3: t('hooks.groupRequest.emailSentBodyNote'),
        showCancelButton: false,
      });
      //

      //
    },
    onError: (error: unknown) => {
      const presentation = getUserFacingApiError(error, {
        messageOverrides: {
          validation: t('hooks.groupRequest.invalidEmail'),
        },
        unknownMessage: t('hooks.groupRequest.unknownError'),
      });
      showError({
        title: t('hooks.groupRequest.createErrorTitle'),
        fallback: t('hooks.groupRequest.unknownError'),
        message: presentation.message,
      });
    },
  });
};

export const useCreateGroup = (onAfterCreate?: () => void, showErrorDialog = true) => {
  const { t } = useTranslation();
  const { showError, showSuccess } = useMutationFeedback();
  return useMutation({
    mutationFn: (data: GroupCreate) => {
      return postApiGroups(data);
    },
    onSuccess: async (data: Group) => {
      showSuccess(t('hooks.group.createSuccess'));
      if (data.owner_link) {
        await appStorage.addGroupKey(data.owner_link);
      }
      onAfterCreate?.();
    },
    onError: (error: any) => {
      if (!showErrorDialog) return;

      showError({
        title: t('hooks.group.createErrorTitle'),
        error,
        fallback: t('hooks.group.unknownError'),
      });
    },
  });
};
export const useUpdateGroup = (onAfterUpdate?: () => void) => {
  const { t } = useTranslation();
  const { showError, showSuccess } = useMutationFeedback();
  return useMutation({
    mutationFn: (data: { groupKey: string; groupUpdate: GroupUpdate }) => {
      return putApiGroupsGroupKey(data.groupKey, data.groupUpdate);
    },
    onSuccess: (data: Group) => {
      showSuccess(t('hooks.group.updateSuccess'), data.name);
      onAfterUpdate?.();
    },
    onError: (error: any) => {
      showError({
        title: t('hooks.group.updateErrorTitle'),
        error,
        fallback: t('hooks.group.unknownError'),
      });
    },
  });
};
/**
 * LocalStorageの group_key_* を全て取得し、それぞれのグループデータをuseQueriesで取得する。
 * 成功・エラー時の処理も内部で行う。
 */

export const getKeyType = (data: Group): 'OWNER' | 'EDIT' | 'VIEW' | '' => {
  if (data.owner_link) return 'OWNER';
  if (data.edit_link) return 'EDIT';
  if (data.view_link) return 'VIEW';
  return '';
};

const GROUP_KEYS_QUERY_KEY = ['groupKeysAndPendingGroups'] as const;
const EMPTY_GROUP_KEYS: string[] = [];
const EMPTY_PENDING_GROUPS: PendingGroup[] = [];
const GROUP_BATCH_QUERY_KEY = ['groupsBatch'] as const;
type GroupBatchResult =
  | { client_id: string; status: 'ok'; group: Group }
  | { client_id: string; status: 'not_found' | 'forbidden' | 'error' };
export const useGroupQueries = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { alertDialog } = useAlertDialog();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // AsyncStorageからGroup Keyとpending groupsを取得
  // 手動の useState + useEffect ではなく useQuery に寄せることで、
  // 「マウント時にfetchしてsetStateする」effectそのものを不要にする
  const groupKeysQuery = useQuery({
    queryKey: GROUP_KEYS_QUERY_KEY,
    queryFn: async () => {
      // 外部デバイスで作成済みになっていないか確認
      await syncPendingGroups();

      const keys = await appStorage.getGroupKeys();
      const storedPendingGroups = await appStorage.getPendingGroups();
      const now = new Date();

      const validPendingGroups = storedPendingGroups.filter((group) => group.expiresAt > now);
      const expiredGroups = storedPendingGroups.filter((group) => group.expiresAt <= now);

      if (expiredGroups.length > 0) {
        await appStorage.setPendingGroups(validPendingGroups);

        Toast.show({
          type: 'info',
          text1: t('hooks.group.expiredPendingGroup'),
          text2: expiredGroups.map((group) => group.groupName).join(', '),
        });
      }

      /*
       * groupKeysには正式なowner/edit/viewキーだけを含める。
       * Pending tokenを通常のグループ詳細APIへ渡さない。
       */
      return { keys, validPendingGroups };
    },
  });

  const groupKeys = groupKeysQuery.data?.keys ?? EMPTY_GROUP_KEYS;
  const pendingGroups = groupKeysQuery.data?.validPendingGroups ?? EMPTY_PENDING_GROUPS;

  const groupsQuery = useQuery({
    queryKey: [...GROUP_BATCH_QUERY_KEY, ...groupKeys],
    enabled: groupKeys.length > 0,
    retry: 1,
    queryFn: () =>
      postApiV2GroupsbatchGet({
        items: groupKeys.map((groupKey, index) => ({
          client_id: String(index),
          group_key: groupKey,
        })),
      }) as unknown as Promise<{ results: GroupBatchResult[] }>,
  });
  const batchResults = groupsQuery.data?.results ?? [];
  const groups = batchResults.flatMap((result) =>
    result.status === 'ok' ? [result.group] : [],
  );
  const notFoundKeys = batchResults.flatMap((result) =>
    result.status === 'not_found' ? [groupKeys[Number(result.client_id)]] : [],
  );

  const notFoundKeysSignal = notFoundKeys.join(',');

  // クエリ結果監視：外部ストレージ(AsyncStorage)を最新状態に同期する
  // ここは「Reactの外にある状態を外部システムに反映する」正当なeffectの用途
  useEffect(() => {
    if (!notFoundKeysSignal) {
      return;
    }

    const removeInvalidGroupKeys = async () => {
      const invalidGroupKeys = notFoundKeysSignal.split(',');

      for (const key of invalidGroupKeys) {
        await appStorage.removeGroupKey(key);
      }

      void alertDialog({
        title: t('hooks.group.fetchNotFoundTitle'),
        description: t('hooks.group.fetchNotFoundDescription'),
        text1: invalidGroupKeys.map((key) => `- ${key}`).join('\n'),
        showCancelButton: false,
      });

      await queryClient.invalidateQueries({ queryKey: GROUP_KEYS_QUERY_KEY });
    };

    void removeInvalidGroupKeys();
  }, [alertDialog, notFoundKeysSignal, queryClient, t]);

  const refetch = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: GROUP_KEYS_QUERY_KEY });

    await queryClient.invalidateQueries({ queryKey: GROUP_BATCH_QUERY_KEY });
  }, [queryClient]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);

    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  return {
    groupKeys,
    pendingGroups,
    isLoading: groupsQuery.isLoading || groupKeysQuery.isLoading,
    isFetching: groupsQuery.isFetching || groupKeysQuery.isFetching,
    isError: groupsQuery.isError || groupKeysQuery.isError,
    error: groupKeysQuery.error ?? groupsQuery.error,
    isRefreshing,
    groups,
    refetch,
    refresh,
  };
};
