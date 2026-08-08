import { format } from 'date-fns';
import { router, useFocusEffect } from 'expo-router';
import { Settings } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  AppState,
  AppStateStatus,
  Keyboard,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';

import { ButtonGridSection } from '@/components/ButtonGridSection';
import MahjongContainer from '@/components/MahjongContainer';
import { MahjongListItem } from '@/components/MahjongListItem';
import MahjongSection from '@/components/MahjongSection';
import { TextInputModal } from '@/components/TextInputModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Group } from '@/src/api/generated/mahjongApi.schemas';
import { useCreateGroupRequest, useGroupQueries } from '@/src/hooks/useGroups';
import { getAccessLevelstring } from '@/src/utils/accessLevel_utils';
import { formatLocalDateTime } from '@/src/utils/date_utils';
export default function Index() {
  const { t } = useTranslation();
  const { groups, pendingGroups, isLoading, isRefreshing, refetch, refresh } = useGroupQueries();
  const { mutate: createGroup } = useCreateGroupRequest();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const appState = useRef<AppStateStatus>(AppState.currentState);
  const refetchingRef = useRef(false);

  /**
   * 複数の更新契機が重なった場合でも、
   * 同時に複数回refetchしないようにする。
   */
  const safeRefetch = useCallback(async () => {
    if (refetchingRef.current) {
      return;
    }

    refetchingRef.current = true;

    try {
      await refetch();
    } finally {
      refetchingRef.current = false;
    }
  }, [refetch]);
  const handleCreateGroup = async (groupName: string, email: string) => {
    if (!groupName || !email) return;
    Keyboard.dismiss();
    setIsModalOpen(false);
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const recaptchaToken = ''; // TODO: Implement reCAPTCHA and get the token
    createGroup({
      name: groupName,
      email: email,
      timezone: timezone,
      recaptcha_token: recaptchaToken,
    });
  };
  const handleEnterGroup = (group: Group) => {
    const key = group.owner_link ?? group.edit_link ?? group.view_link;
    if (!key) return;
    router.push(`/group/${key}`);
  };

  /*
   * AppStateの変化を監視して、アプリがフォアグラウンドに戻ったときにrefetchする
   */
  useFocusEffect(
    useCallback(() => {
      void safeRefetch();
    }, [safeRefetch]),
  );

  /*
   * アプリがアクティブになったときにrefetchする
   */
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      const wasInBackground = appState.current === 'background' || appState.current === 'inactive';

      if (wasInBackground && nextAppState === 'active') {
        void safeRefetch();
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [safeRefetch]);
  return (
    <>
      <MahjongContainer>
        <ScrollView
          contentContainerClassName="gap-6 pb-8"
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => {
                void refresh();
              }}
            />
          }
        >
          {/* Header */}
          <View className="relative h-12 flex-row items-center justify-center">
            <Text className="text-center text-xl font-bold text-on-surface">
              {t('welcomPage.pageTitle')}
            </Text>
            <Button
              accessibilityLabel={t('settings.open')}
              className="absolute right-0 h-12 w-12 rounded-full p-0"
              size="icon"
              variant="ghost"
              onPress={() => router.push('/settings')}
            >
              <Icon as={Settings} className="text-on-surface" size={24} />
            </Button>
          </View>

          {/* Create Group */}
          <ButtonGridSection>
            <Button className="h-12 rounded-xl" onPress={() => setIsModalOpen(true)}>
              <Text className="font-semibold">{t('welcomPage.CreateNewGroup')}</Text>
            </Button>
          </ButtonGridSection>

          {/* Registered Groups */}
          <MahjongSection>
            <Text className="text-lg font-semibold">{t('welcomPage.RegisteredGroups')}</Text>

            {isLoading ? (
              <Card className="rounded-2xl">
                <CardContent className="items-center justify-center gap-3 p-8">
                  <ActivityIndicator size="large" />
                  <Text className="text-muted-foreground">Loading...</Text>
                </CardContent>
              </Card>
            ) : (
              <View className="gap-3">
                {groups.map(
                  (group) =>
                    group && (
                      <MahjongListItem
                        key={group.id + getAccessLevelstring(group.group_links)}
                        title={group.name}
                        badge={getAccessLevelstring(group.group_links)}
                        accessories={[
                          group.created_at && '作成日' + format(group.created_at, 'yyyy-MM-dd'),
                          group.description && group.description,
                        ]}
                        onPress={() => handleEnterGroup(group)}
                      />
                    ),
                )}
              </View>
            )}
            {pendingGroups.length > 0 && (
              <View className="gap-3">
                <Text className="text-lg font-semibold">Pending Groups</Text>
                {pendingGroups.map((group) => (
                  <View key={group.token} className="gap-1">
                    <Text className="text-base font-semibold">{group.groupName}</Text>
                    <Text className="text-sm text-muted-foreground">
                      {formatLocalDateTime(group.expiresAt)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </MahjongSection>
        </ScrollView>
      </MahjongContainer>
      <TextInputModal
        open={isModalOpen}
        title={t('welcomPage.CreateNewGroup')}
        discription={t('welcomPage.EnterGroupName')}
        InputLabel={t('welcomPage.GroupName')}
        onComfirm={(inputText, inputText2) => {
          handleCreateGroup(inputText, inputText2 ?? '');
          setIsModalOpen(false);
        }}
        onClose={() => setIsModalOpen(false)}
        twoInput={true}
        twoInputLabel={t('welcomPage.Email')}
        twoInputType="email"
        value=""
        twoValue=""
      />
    </>
  );
}
