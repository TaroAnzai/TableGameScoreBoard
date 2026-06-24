import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Keyboard, Pressable, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { ButtonGridSection } from '@/components/ButtonGridSection';
import MahjongContainer from '@/components/MahjongContainer';
import { TextInputModal } from '@/components/TextInputModal';
import { TextInputModal2 } from '@/components/TextInputModal2';
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
    router.push(`/group/${key}`);
  };

  return (
    <>
      <MahjongContainer>
        <View className="gap-6">
          {/* Header */}
          <View>
            <Text className="text-center text-xl font-semibold text-white">
              {t('welcomPage.pageTitle')}
            </Text>
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
                      <Button
                        key={group.id + getAccessLevelstring(group.group_links)}
                        variant="outline"
                        onPress={() => handleEnterGroup(group)}
                      >
                        <View className="flex-row items-center gap-2">
                          <Text className="text-base font-semibold">{group.name}</Text>
                          <Badge variant="outline">
                            <Text>{getAccessLevelstring(group.group_links)}</Text>
                          </Badge>
                        </View>
                      </Button>
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
