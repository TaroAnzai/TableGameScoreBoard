// src/hooks/useGroups.tsx

import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import { useAlertDialog } from '@/components/common/AlertDialogProvider';
import type {
  Group,
  GroupCreate,
  GroupRequest,
  GroupResponse,
  GroupUpdate,
} from '@/src/api/generated/mahjongApi.schemas';
import { appStorage, PendingGroup } from '@/src/storage/appStorage';
import { syncPendingGroups } from '@/src/utils/groupSync';

import {
  getGetApiGroupsGroupKeyQueryKey,
  getGetApiGroupsGroupKeyQueryOptions,
  postApiGroups,
  postApiGroupsRequestLink,
  putApiGroupsGroupKey,
} from '../api/generated/mahjongApi';
import { formatLocalDateTime, toLocalDate } from '../utils/date_utils';

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
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: GroupRequest) => {
      return postApiGroupsRequestLink(data);
    },
    onSuccess: async (data: GroupResponse, variables: GroupRequest) => {
      const expire_at = formatLocalDateTime(toLocalDate(data.expires_at));
      appStorage.addPendingGroupKey({
        token: data.token,
        groupName: variables.name,
        expiresAt: toLocalDate(data.expires_at) ?? new Date(),
      });
      // AsyncStorageからpendingGroupsを再取得させる
      await queryClient.invalidateQueries({
        queryKey: ['groupKeysAndPendingGroups'],
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
    onError: (error: any) => {
      const message =
        error.body?.errors?.json?.message?.[0] ??
        error.body?.message ??
        error.statusText ??
        t('hooks.groupRequest.unknownError');
      alertDialog({
        title: t('hooks.groupRequest.createErrorTitle'),
        description: message,
        showCancelButton: false,
      });
    },
  });
};

export const useCreateGroup = (onAfterCreate?: () => void) => {
  const { alertDialog } = useAlertDialog();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (data: GroupCreate) => {
      return postApiGroups(data);
    },
    onSuccess: (data: Group) => {
      Toast.show({
        type: 'success',
        text1: t('hooks.group.createSuccess'),
      });
      if (data.owner_link) {
        appStorage.addGroupKey(data.owner_link);
      }
      onAfterCreate?.();
    },
    onError: (error: any) => {
      const message =
        error.body?.errors?.json?.message?.[0] ??
        error.body?.message ??
        error.statusText ??
        t('hooks.group.unknownError');
      alertDialog({
        title: t('hooks.group.createErrorTitle'),
        description: message,
        showCancelButton: false,
      });
    },
  });
};
export const useUpdateGroup = (onAfterUpdate?: () => void) => {
  const { alertDialog } = useAlertDialog();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (data: { groupKey: string; groupUpdate: GroupUpdate }) => {
      return putApiGroupsGroupKey(data.groupKey, data.groupUpdate);
    },
    onSuccess: (data: Group) => {
      Toast.show({
        type: 'success',
        text1: t('hooks.group.updateSuccess'),
        text2: data.name,
      });
      onAfterUpdate?.();
    },
    onError: (error: any) => {
      const message =
        error.body?.errors?.json?.message?.[0] ??
        error.body?.message ??
        error.statusText ??
        t('hooks.group.unknownError');
      alertDialog({
        title: t('hooks.group.updateErrorTitle'),
        description: message,
        showCancelButton: false,
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

type ApiError = { status?: number };

const isNotFoundError = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && (error as ApiError).status === 404;
const EMPTY_GROUP_KEYS: string[] = [];
const EMPTY_PENDING_GROUPS: PendingGroup[] = [];
export const useGroupQueries = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const hookRenderCount = useRef(0);
  hookRenderCount.current++;

  // AsyncStorageからGroup Keyとpending groupsを取得
  // 手動の useState + useEffect ではなく useQuery に寄せることで、
  // 「マウント時にfetchしてsetStateする」effectそのものを不要にする
  const groupKeysQuery = useQuery({
    queryKey: ['groupKeysAndPendingGroups'],
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

  // 各 group_key ごとにクエリを作成し、combine で派生値をメモ化
  const {
    results: groupQueries,
    isLoading,
    groups,
    notFoundKeys,
  } = useQueries({
    queries: groupKeys.map((key: string) => ({
      ...getGetApiGroupsGroupKeyQueryOptions(key),
      retry: 1,
      select: (data: Group) => ({
        ...data,
        keyType: getKeyType(data),
      }),
    })),
    combine: (results) => ({
      results,
      isLoading: results.some((query) => query.isLoading),
      groups: results.filter((query) => query.isSuccess).map((query) => query.data),
      notFoundKeys: results
        .map((query, index) => (isNotFoundError(query.error) ? groupKeys[index] : null))
        .filter((key): key is string => key !== null),
    }),
  });

  const notFoundKeysSignal = notFoundKeys.join(',');

  // クエリ結果監視：外部ストレージ(AsyncStorage)を最新状態に同期する
  // ここは「Reactの外にある状態を外部システムに反映する」正当なeffectの用途
  useEffect(() => {
    if (!notFoundKeysSignal) {
      return;
    }

    const removeInvalidGroupKeys = async () => {
      for (const key of notFoundKeysSignal.split(',')) {
        await appStorage.removeGroupKey(key);
      }

      await queryClient.invalidateQueries({ queryKey: ['groupKeysAndPendingGroups'] });
    };

    void removeInvalidGroupKeys();
  }, [notFoundKeysSignal, queryClient]);

  const refetch = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['groupKeysAndPendingGroups'] });

    /*
     * 既存のキーが変わらなかった場合でも、
     * グループ本体の最新情報を取得する。
     */
    await Promise.all(
      groupKeys.map((key) =>
        queryClient.invalidateQueries({
          queryKey: getGetApiGroupsGroupKeyQueryKey(key),
          exact: true,
        }),
      ),
    );
  }, [groupKeys, queryClient]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);

    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  console.log('useGroupQueries render', {
    count: hookRenderCount.current,
    isRefreshing,
    groupKeysStatus: groupKeysQuery.status,
    groupKeysFetchStatus: groupKeysQuery.fetchStatus,
    groupKeysDataUpdatedAt: groupKeysQuery.dataUpdatedAt,
    groupKeys,
    groupsCount: groups.length,
  });
  return {
    groupQueries,
    groupKeys,
    pendingGroups,
    isLoading: isLoading || groupKeysQuery.isLoading,
    isRefreshing,
    groups,
    refetch,
    refresh,
  };
};
