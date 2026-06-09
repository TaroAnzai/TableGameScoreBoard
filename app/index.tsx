import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Keyboard, Pressable, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { ButtonGridSection } from '@/components/ButtonGridSection';
import { MahjongContainer } from '@/components/MahjongContainer';
import { TextInputModal } from '@/components/TextInputModal';
import { Button } from '@/components/ui/button';
import { Group } from '@/src/api/generated/mahjongApi.schemas';
import { useCreateGroupRequest, useGroupQueries } from '@/src/hooks/useGroups';
import { getAccessLevelstring } from '@/src/utils/accessLevel_utils';
export default function Index() {
  const { t } = useTranslation();
  const { groups, isLoading, refetch } = useGroupQueries();
  const { mutate: createGroup, isPending: isCreateGroupPending } = useCreateGroupRequest();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModdal2Open, setIsModal2Open] = useState(false);

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
      <MahjongContainer>
        <Text className="mahjong-title">{t('welcomPage.pageTitle')}</Text>
        <ButtonGridSection>
          <Button className="mahjong-button" onPress={() => setIsModalOpen(true)}>
            <Text>{t('welcomPage.CreateNewGroup')}</Text>
          </Button>
        </ButtonGridSection>
        <View className="mahjong-section">
          <Text className="mahjong-heading">{t('welcomPage.RegisteredGroups')}</Text>
          {isLoading ? (
            <View className="flex items-center justify-center gap-2">
              <ActivityIndicator size="large" />
              <Text>Loading...</Text>
            </View>
          ) : (
            <View className="mahjong-list">
              {groups.map(
                (group) =>
                  group && (
                    <Pressable
                      key={group.id + getAccessLevelstring(group.group_links)}
                      onPress={() => handleEnterGroup(group)}
                    >
                      <Text className="mahjong-list-item">
                        {group?.name}（{getAccessLevelstring(group.group_links)}）
                      </Text>
                    </Pressable>
                  ),
              )}
            </View>
          )}
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
