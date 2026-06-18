import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { View } from 'react-native';

import { useAlertDialog } from '@/components/common/AlertDialogProvider';
import type { Group } from '@/src/api/generated/mahjongApi.schemas';
import { useCreateGroup } from '@/src/hooks/useGroups';

const GroupCreatePage = () => {
  const { alertDialog } = useAlertDialog();
  const { mutateAsync: createGroupFromToken } = useCreateGroup();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return; // ← 2回目はスキップ
    hasRun.current = true;
    const token = new URLSearchParams(window.location.search).get('token');

    const createGroup = async () => {
      if (!token) {
        await alertDialog({
          title: 'Error',
          description: '無効なトークンです',
          showCancelButton: false,
        });
        router.push('/');
        return null;
      }
      try {
        const result = await createGroupFromToken({ token: token });
        router.push(`/group/${result.owner_link}`);
      } catch (error) {
        router.push('/');
      }
    };
    createGroup();
  }, []);

  return <View>Creating group...</View>;
};

export default GroupCreatePage;
