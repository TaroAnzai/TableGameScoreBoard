import { format } from 'date-fns';
import { router, useLocalSearchParams } from 'expo-router';
import { SquarePlus, UserMinus, UserPlus } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { ButtonGridSection } from '@/components/ButtonGridSection';
import { useAlertDialog } from '@/components/common/AlertDialogProvider';
import { MahjongList, MahjongSubTitle } from '@/components/common/TextStyles';
import MahjongContainer from '@/components/MahjongContainer';
import { MahjongListItem } from '@/components/MahjongListItem';
import MahjongSection from '@/components/MahjongSection';
import PageTitleBar from '@/components/page_parts/PageTitleBar';
import SelectorModal from '@/components/SelectorModal';
import { TextInputModal } from '@/components/TextInputModal';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Text } from '@/components/ui/text';
import { useGetApiGroupsGroupKey } from '@/src/api/generated/mahjongApi';
import { Player } from '@/src/api/generated/mahjongApi.schemas';
import { useUpdateGroup } from '@/src/hooks/useGroups';
import { useCreatePlayer, useDeletePlayer, useGetPlayer } from '@/src/hooks/usePlayers';
import { useCreateTable } from '@/src/hooks/useTables';
import { useCreateTournament, useGetTournaments } from '@/src/hooks/useTournaments';
import { appStorage } from '@/src/storage/appStorage';
import { getAccessLevelstring } from '@/src/utils/accessLevel_utils';
const GroupPage = () => {
  const { t } = useTranslation();
  const { groupKey } = useLocalSearchParams<{ groupKey: string }>();
  const { alertDialog } = useAlertDialog();

  const { players, isLoadingPlayers, loadPlayers } = useGetPlayer(groupKey);
  const { tournaments } = useGetTournaments(groupKey);
  const { data: group, refetch: refetchGroup } = useGetApiGroupsGroupKey(groupKey);
  const { mutate: updateGroup } = useUpdateGroup(refetchGroup);
  const { mutate: createPlayer } = useCreatePlayer(loadPlayers);
  const { mutate: deletePlayer } = useDeletePlayer(loadPlayers);
  const { mutateAsync: createTournament } = useCreateTournament();
  const { mutateAsync: createChipTable } = useCreateTable();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTournamentModal, setShowTournamentModal] = useState(false);
  const [isCreateTournamentModalOpen, setIsCreateTournamentModalOpen] = useState(false);
  const [isCreatePlayerModalOpen, setIsCreatePlayerModalOpen] = useState(false);
  const [isGroupRegistered, setIsGroupRegistered] = useState<boolean | null>(null);
  const [value, setValue] = useState('tournament');
  const accessLevel = getAccessLevelstring(group?.group_links);

  useEffect(() => {
    let isMounted = true;

    appStorage.getGroupKeys().then((groupKeys) => {
      if (isMounted) {
        setIsGroupRegistered(groupKeys.includes(groupKey));
      }
    });

    return () => {
      isMounted = false;
    };
  }, [groupKey]);

  const handleTitleChange = (newTitle: string) => {
    if (!newTitle) return;
    if (!groupKey) return;
    updateGroup({ groupKey: groupKey, groupUpdate: { name: newTitle } });
  };
  const handleAddGroup = async () => {
    if (!groupKey || !group) return;
    const res = await alertDialog({
      title: t('groupPage.dialogAddGroupTitle'),
      description: t('groupPage.dialogAddGroupDescription', { groupName: group.name }),
      showCancelButton: true,
    });
    if (!res) return;
    await appStorage.addGroupKey(groupKey);
    setIsGroupRegistered(true);
    router.push('/');
  };
  const handleAddPlayer = (name: string) => {
    if (!name) return;
    createPlayer({ groupKey: groupKey, player: { name: name } });
    setIsCreatePlayerModalOpen(false);
  };
  const handleDeletePlayer = (player: Player) => {
    if (!player || player.id === undefined) return;
    deletePlayer({ groupKey: groupKey, playerId: player.id });
  };

  const handleCreateTournament = async (name: string) => {
    if (!name) return;
    const payload = { groupKey: groupKey, tournament: { name: name } };
    const data = await createTournament(payload);
    //CHIPテーブルを作成
    if (!data.edit_link) return;
    await createChipTable({
      tournamentKey: data.edit_link,
      tableCreate: { name: t('Common.chip'), type: 'CHIP' },
    });
    setIsCreateTournamentModalOpen(false);
    router.push(`/tournament/${data.edit_link}`);
  };

  if (players === undefined || isLoadingPlayers) {
    return;
  }
  return (
    <MahjongContainer>
      <PageTitleBar
        title={group ? group.name : 'Loading...'}
        shareLinks={group ? group.group_links : []}
        onTitleChange={handleTitleChange}
        parentUrl="/"
      />

      <ButtonGridSection>
        {isGroupRegistered === false && (
          <Button onPress={handleAddGroup} className="w-full">
            <Text>{t('groupPage.buttonSaveToBrowser')}</Text>
          </Button>
        )}
        <Button onPress={() => router.push(`/group/stats/${groupKey}`)} className="w-full">
          <Text>{t('groupPage.buttonStats')}</Text>
        </Button>
      </ButtonGridSection>
      <Tabs value={value} onValueChange={setValue} className="min-h-0 w-full flex-1">
        <TabsList className="h-11">
          <TabsTrigger value="tournament">
            <Text className="text-base">{t('groupPage.tabTournamentList')}</Text>
          </TabsTrigger>
          <TabsTrigger value="member">
            <Text className="text-base">{t('groupPage.tabMemberList')}</Text>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="tournament" className="min-h-0 w-full flex-1">
          {/* Tournament List */}
          <MahjongSection className="min-h-0 justify-start">
            <View className="w-full relative mb-4 h-10 items-center justify-center">
              <MahjongSubTitle className="mb-4">
                {t('groupPage.buttonSelectTournament')}
              </MahjongSubTitle>
              {accessLevel !== 'VIEW' && (
                <View className="absolute inset-y-0 right-0 flex-row items-center gap-1">
                  <Pressable
                    className="h-10 w-10 items-center justify-center"
                    onPress={() => setIsCreateTournamentModalOpen(true)}
                  >
                    <Icon as={SquarePlus} className="text-on-surface" size={24} />
                  </Pressable>
                </View>
              )}
            </View>

            {tournaments?.length === 0 ? (
              <Text>{t('groupPage.sectionTournamentListEmpty')}</Text>
            ) : (
              <MahjongList>
                {tournaments?.map((tournament) => (
                  <MahjongListItem
                    key={tournament.id}
                    title={tournament.name}
                    badge={'Rate:' + tournament.rate.toString()}
                    accessories={[
                      tournament.created_at &&
                        '作成日' + format(new Date(tournament.created_at), 'yyyy-MM-dd'),
                    ]}
                    onPress={() => {
                      const tournament_key = tournament.edit_link ?? tournament.view_link;
                      router.push(`/tournament/${tournament_key}`);
                    }}
                  />
                ))}
              </MahjongList>
            )}
          </MahjongSection>
        </TabsContent>
        <TabsContent value="member" className="min-h-0 w-full flex-1">
          {/* Member List */}
          <MahjongSection className="min-h-0 justify-start">
            <View className="w-full relative mb-4 h-10 items-center justify-center">
              <MahjongSubTitle>{t('groupPage.sectionMemberList')}</MahjongSubTitle>
              {accessLevel !== 'VIEW' && (
                <View className="absolute right-0 flex-row items-center gap-1">
                  <Pressable
                    className="h-10 w-10 items-center justify-center"
                    onPress={() => setIsCreatePlayerModalOpen(true)}
                  >
                    <Icon as={UserPlus} className="text-on-surface" size={24} />
                  </Pressable>

                  <Pressable
                    className="h-10 w-10 items-center justify-center"
                    onPress={() => setShowDeleteModal(true)}
                  >
                    <Icon as={UserMinus} className="text-error" size={24} />
                  </Pressable>
                </View>
              )}
            </View>

            {isLoadingPlayers ? (
              <View className=" items-center justify-center gap-2">
                <ActivityIndicator size="large" />
                <Text>Loading...</Text>
              </View>
            ) : (
              <MahjongList columns={2}>
                {players?.map((player) => (
                  <MahjongListItem key={player.id} title={player.name} />
                ))}
              </MahjongList>
            )}
          </MahjongSection>
        </TabsContent>
      </Tabs>

      {showDeleteModal && (
        <SelectorModal
          title={t('groupPage.modalDeletePlayerTitle')}
          open={showDeleteModal}
          items={players}
          onSelect={(player: Player) => {
            handleDeletePlayer(player);
          }}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
      {showTournamentModal && (
        <SelectorModal
          title={t('groupPage.modalSelectTournamentTitle')}
          open={showTournamentModal}
          items={tournaments?.map((t) => ({
            ...t,
            plusDisplayItem:
              t.created_at &&
              new Date(t.started_at ?? t.created_at).toLocaleDateString('ja-JP', {
                timeZone: 'Asia/Tokyo',
              }),
          }))}
          plusDisplayItem={'plusDisplayItem'}
          onSelect={(tournament) => {
            if (tournament) {
              const tournament_key = tournament.edit_link ?? tournament.view_link;
              router.push(`/tournament/${tournament_key}`);
            }
            setShowTournamentModal(false);
          }}
          onClose={() => setShowTournamentModal(false)}
          emptyMessage={t('groupPage.modalSelectTournamentEmpty')}
        />
      )}
      <TextInputModal
        open={isCreatePlayerModalOpen}
        onComfirm={handleAddPlayer}
        onClose={() => setIsCreatePlayerModalOpen(false)}
        value=""
        title={t('groupPage.modalCreatePlayerTitle')}
        discription={t('groupPage.modalCreatePlayerDescription')}
      />
      <TextInputModal
        open={isCreateTournamentModalOpen}
        onComfirm={handleCreateTournament}
        onClose={() => setIsCreateTournamentModalOpen(false)}
        title={t('groupPage.modalCreateTournamentTitle')}
        discription={t('groupPage.modalCreateTournamentDescription')}
      />
    </MahjongContainer>
  );
};

export default GroupPage;
