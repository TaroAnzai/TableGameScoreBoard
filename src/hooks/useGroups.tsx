// src/hooks/useGroups.tsx

import { useMutation, useQueries } from '@tanstack/react-query';
import { View } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import { useAlertDialog } from '@/components/common/AlertDialogProvider';
import { Text } from '@/components/ui/text';
import type {
  Group,
  GroupCreate,
  GroupRequest,
  GroupResponse,
  GroupUpdate,
} from '@/src/api/generated/mahjongApi.schemas';
import { appStorage } from '@/src/storage/appStorage';

import {
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
  return useMutation({
    mutationFn: (data: GroupRequest) => {
      return postApiGroupsRequestLink(data);
    },
    onSuccess: (data: GroupResponse, variables: GroupRequest) => {
      const expire_at = formatLocalDateTime(toLocalDate(data.expires_at));
      appStorage.addPendingGroupKey(data.token, variables.name);
      alertDialog({
        title: t('hooks.groupRequest.emailSentTitle'),
        description: t('hooks.groupRequest.emailSentDescription'),
        body: (
          <View className="mt-2">
            <Text>{t('hooks.groupRequest.emailSentBodyLink')}</Text>
            <Text>{t('hooks.groupRequest.emailSentBodyExpire', { expire_at })}</Text>
            <Text>{t('hooks.groupRequest.emailSentBodyNote')}</Text>
          </View>
        ),
        showCancelButton: false,
      });
      //

      //
    },
    onError: (error: any) => {
      console.error('Error creating group:', error);
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
  // this function is not used in this app. It is provided for future use when we want to create a group without email verification.
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
      console.error('Error creating group:', error);
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
      console.error('Error updating group:', error);
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

export const useGroupQueries = () => {
  const [refetchGroups, setRefetchGroups] = useState(0);
  const [groupKeys, setGroupKeys] = useState<string[]>([]);
  const [pendingGroups, setPendingGroups] = useState<{ groupKey: string; groupName: string }[]>([]);

  // AsyncStorageからGroup Keyを取得
  useEffect(() => {
    const loadGroupKeys = async () => {
      const keys = await appStorage.getGroupKeys();
      const pendingKeys = await appStorage.getPendingGroupKeys();
      const pendingGroups = await appStorage.getPendingGroups();
      const allKeys = Array.from(new Set([...keys, ...pendingKeys]));
      setGroupKeys(allKeys);
      setPendingGroups(pendingGroups);
    };

    loadGroupKeys();
  }, [refetchGroups]);

  // 各 group_key ごとにクエリを作成
  const groupQueries = useQueries({
    queries: groupKeys.map((key) => ({
      ...getGetApiGroupsGroupKeyQueryOptions(key),
      retry: 1,
      select: (data: Group) => ({
        ...data,
        keyType: getKeyType(data),
      }),
    })),
  });

  // クエリ結果監視
  useEffect(() => {
    const syncGroupKeys = async () => {
      const pendingKeys = await appStorage.getPendingGroupKeys();
      const savedGroupKeys = await appStorage.getGroupKeys();
      let changed = false;
      for (const [index, query] of groupQueries.entries()) {
        const key = groupKeys[index];

        if (!key) continue;

        if (query.isSuccess) {
          if (pendingKeys.includes(key)) {
            await appStorage.removePendingGroupKey(key);
            changed = true;
          }

          if (!savedGroupKeys.includes(key)) {
            await appStorage.addGroupKey(key);
            changed = true;
          }
        }

        if (query.isError) {
          console.error(`Error fetching group ${key}:`, query.error);

          const status = (query.error as any)?.status;

          if (status === 404) {
            console.warn(`Group not found: ${key}, removing from storage`);

            // 登録済みなら削除
            if (savedGroupKeys.includes(key)) {
              await appStorage.removeGroupKey(key);
              changed = true;
            }

            // Pendingは削除しない
            // 取得できない場合はPendingに継続
          }
        }
        if (changed) {
          setRefetchGroups((prev) => prev + 1);
        }
      }
    };

    syncGroupKeys();
  }, [groupQueries, groupKeys]);

  const refetch = () => setRefetchGroups((prev) => prev + 1);

  return {
    groupQueries,
    groupKeys,
    pendingGroups,
    isLoading: groupQueries.some((q) => q.isLoading),
    groups: groupQueries.filter((q) => q.isSuccess).map((q) => q.data),
    refetch,
  };
};
