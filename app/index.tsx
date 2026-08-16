import { format } from 'date-fns';
import { router, useFocusEffect } from 'expo-router';
import { Settings, SquareMinus } from 'lucide-react-native';
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
import { useAlertDialog } from '@/components/common/AlertDialogProvider';
import MahjongContainer from '@/components/MahjongContainer';
import { MahjongListItem } from '@/components/MahjongListItem';
import MahjongSection from '@/components/MahjongSection';
import MahjongSectionHeader from '@/components/MahjongSectionHeader';
import SelectorModal from '@/components/SelectorModal';
import { TextInputModal } from '@/components/TextInputModal';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { getUserFacingApiError } from '@/src/api/apiErrorPresentation';
import { GroupV2 } from '@/src/api/generated/mahjongApi.schemas';
import { useCreateGroupRequest, useGroupQueries } from '@/src/hooks/useGroups';
import { appStorage } from '@/src/storage/appStorage';
import { getAccessLevelstring, getResourceKey } from '@/src/utils/accessLevel_utils';

type RemovableGroup = Omit<GroupV2, 'id'> & { id: string | number };

export default function Index() {
  const { t } = useTranslation();
  const {
    groups,
    pendingGroups,
    isLoading,
    isFetching,
    isError,
    error,
    isRefreshing,
    refetch,
    refresh,
  } = useGroupQueries();
  const { mutateAsync: createGroup, isPending: isCreatingGroup } = useCreateGroupRequest();
  const { alertDialog } = useAlertDialog();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRemoveGroupModalOpen, setIsRemoveGroupModalOpen] = useState(false);
  const removableGroups = groups.map((group) => ({
    ...group,
    id: group.id ?? getResourceKey(group) ?? group.name,
  }));
  const groupErrorPresentation = getUserFacingApiError(error);

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

  const handleRemoveGroup = async (group: RemovableGroup) => {
    setIsRemoveGroupModalOpen(false);

    const groupKey = getResourceKey(group);
    if (!groupKey) return;

    const confirmed = await alertDialog({
      title: t('groupPage.dialogRemoveGroupTitle'),
      description: t('groupPage.dialogRemoveGroupDescription', { groupName: group.name }),
      showCancelButton: true,
    });
    if (!confirmed) return;

    await appStorage.removeGroupKey(groupKey);
    await safeRefetch();
  };

  const handleCreateGroup = async (groupName: string, email: string) => {
    if (!groupName || !email) return;
    Keyboard.dismiss();
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const recaptchaToken = ''; // TODO: Implement reCAPTCHA and get the token
    try {
      await createGroup({
        name: groupName,
        email: email,
        timezone: timezone,
        recaptcha_token: recaptchaToken,
      });
      setIsModalOpen(false);
    } catch {
      // The mutation hook displays the API error dialog. Keep the form open for retrying.
    }
  };
  const handleEnterGroup = (group: GroupV2) => {
    const key = getResourceKey(group);
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
        <View className="flex-1 gap-6">
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
          <MahjongSection
            isLoading={isLoading}
            isError={isError}
            isRetrying={isError && (isFetching || isRefreshing)}
            errorMessage={groupErrorPresentation.message}
            onRetry={groupErrorPresentation.canRetry ? () => void safeRefetch() : undefined}
          >
            <MahjongSectionHeader
              title={t('welcomPage.RegisteredGroups')}
              actions={
                groups.length > 0 && (
                  <Button
                    accessibilityLabel={t('welcomPage.RemoveRegisteredGroup')}
                    className="h-10 w-10 rounded-full p-0"
                    size="icon"
                    variant="ghost"
                    onPress={() => setIsRemoveGroupModalOpen(true)}
                  >
                    <Icon as={SquareMinus} className="text-error" size={24} />
                  </Button>
                )
              }
            />

            <ScrollView
              className="w-full flex-1"
              contentContainerClassName="flex-grow pb-4"
              keyboardShouldPersistTaps="handled"
              alwaysBounceVertical
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={() => {
                    void refresh();
                  }}
                />
              }
            >
              <View className="gap-1">
                {groups.length > 0 ? (
                  groups.map(
                    (group) =>
                      group && (
                        <MahjongListItem
                          key={group.id + getAccessLevelstring(group.group_links)}
                          title={group.name}
                          badge={t(`Common.accessLevel.${getAccessLevelstring(group.group_links)}`)}
                          accessories={[
                            group.created_at &&
                              t('welcomPage.createdAt', {
                                date: format(new Date(group.created_at), 'yyyy-MM-dd'),
                              }),
                            group.description && group.description,
                          ]}
                          onPress={() => handleEnterGroup(group)}
                        />
                      ),
                  )
                ) : (
                  <View className="items-center justify-center gap-3 p-8">
                    <Text className="text-muted-foreground">
                      {t('welcomPage.noRegisteredGroups')}
                    </Text>
                  </View>
                )}
              </View>
              {pendingGroups.length > 0 && (
                <View className="gap-3 align-center">
                  <Text className="text-lg font-semibold">{t('welcomPage.pendingGroups')}</Text>
                  <Text className="text-sm text-muted-foreground">
                    {t('welcomPage.pendingGroupsDescription')}
                  </Text>
                  <Button
                    className="self-start"
                    variant="outline"
                    disabled={isRefreshing || isFetching}
                    onPress={() => void refresh()}
                  >
                    {(isRefreshing || isFetching) && <ActivityIndicator />}
                    <Text>
                      {isRefreshing || isFetching
                        ? t('welcomPage.refreshingPendingGroups')
                        : t('welcomPage.refreshPendingGroups')}
                    </Text>
                  </Button>
                  {pendingGroups.map((group) => (
                    <MahjongListItem
                      key={group.token}
                      title={group.groupName}
                      accessories={[
                        group.expiresAt &&
                          t('welcomPage.expiresAt', {
                            date: format(group.expiresAt, 'yyyy-MM-dd HH:mm'),
                          }),
                      ]}
                    />
                  ))}
                </View>
              )}
            </ScrollView>
          </MahjongSection>
        </View>
      </MahjongContainer>
      <SelectorModal
        title={t('welcomPage.SelectGroupToRemove')}
        open={isRemoveGroupModalOpen}
        items={removableGroups}
        onSelect={handleRemoveGroup}
        onClose={() => setIsRemoveGroupModalOpen(false)}
      />
      <TextInputModal
        open={isModalOpen}
        title={t('welcomPage.CreateNewGroup')}
        discription={t('welcomPage.EnterGroupName')}
        InputLabel={t('welcomPage.GroupName')}
        onComfirm={(inputText, inputText2) => handleCreateGroup(inputText, inputText2 ?? '')}
        onClose={() => setIsModalOpen(false)}
        isPending={isCreatingGroup}
        pendingText={t('welcomPage.creatingGroup')}
        twoInput={true}
        twoInputLabel={t('welcomPage.Email')}
        twoInputType="email"
        value=""
        twoValue=""
      />
    </>
  );
}
