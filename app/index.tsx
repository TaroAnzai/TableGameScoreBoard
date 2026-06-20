import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Keyboard, Pressable, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { ButtonGridSection } from '@/components/ButtonGridSection';
import { MahjongContainer } from '@/components/MahjongContainer';
import { TextInputModal } from '@/components/TextInputModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { Group } from '@/src/api/generated/mahjongApi.schemas';
import { useCreateGroupRequest, useGroupQueries } from '@/src/hooks/useGroups';
import { getAccessLevelstring } from '@/src/utils/accessLevel_utils';
import { formatLocalDateTime } from '@/src/utils/date_utils';
export default function Index() {
  const { t } = useTranslation();
  const { groups, pendingGroups, isLoading, refetch } = useGroupQueries();
  const { mutate: createGroup, isPending: isCreateGroupPending } = useCreateGroupRequest();
  const [isModalOpen, setIsModalOpen] = useState(false);

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

    Toast.show({
      type: 'info',
      text1: 'Entering group...',
    });
  };

  return (
    <>
      <View className="flex-1 bg-background px-5 py-8">
        <View className="gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">{t('welcomPage.pageTitle')}</Text>
            <Text className="text-muted-foreground">麻雀グループを作成・参加できます</Text>
          </View>

          {/* Create Group */}
          <ButtonGridSection>
            <Button className="h-12 rounded-xl" onPress={() => setIsModalOpen(true)}>
              <Text className="font-semibold">{t('welcomPage.CreateNewGroup')}</Text>
            </Button>
          </ButtonGridSection>

          {/* Registered Groups */}
          <View className="gap-3">
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
                      <Pressable
                        key={group.id + getAccessLevelstring(group.group_links)}
                        onPress={() => handleEnterGroup(group)}
                      >
                        <Card className="rounded-2xl border-border bg-card active:opacity-80">
                          <CardContent className="flex-row items-center justify-between p-4">
                            <View className="gap-1">
                              <Text className="text-base font-semibold">{group.name}</Text>
                              <Text className="text-sm text-muted-foreground">アクセス権限</Text>
                            </View>

                            <Badge variant="secondary" className="rounded-full">
                              <Text>{getAccessLevelstring(group.group_links)}</Text>
                            </Badge>
                          </CardContent>
                        </Card>
                      </Pressable>
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
          </View>
        </View>
      </View>
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
