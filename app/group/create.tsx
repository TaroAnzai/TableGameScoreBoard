import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';

import { useAlertDialog } from '@/components/common/AlertDialogProvider';
import { useCreateGroup } from '@/src/hooks/useGroups';

const GroupCreatePage = () => {
  const { t } = useTranslation();
  const { alertDialog } = useAlertDialog();
  const { mutateAsync: createGroupFromToken } = useCreateGroup();
  const hasRun = useRef(false);
  const { token } = useLocalSearchParams<{ token: string }>();
  useEffect(() => {
    if (hasRun.current) return; // ← 2回目はスキップ
    hasRun.current = true;

    const createGroup = async () => {
      if (!token) {
        await alertDialog({
          title: t('groupCreatePage.invalidTokenTitle'),
          description: t('groupCreatePage.invalidTokenDescription'),
          showCancelButton: false,
        });
        router.push('/');
        return null;
      }
      try {
        const result = await createGroupFromToken({ token: token });
        router.push(`/group/${result.owner_link}`);
      } catch {
        router.push('/');
      }
    };
    createGroup();
  }, [alertDialog, createGroupFromToken, t, token]);

  return <Text>{t('groupCreatePage.creating')}</Text>;
};

export default GroupCreatePage;
