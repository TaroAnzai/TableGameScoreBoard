import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';

import { ButtonGridSection } from '@/components/ButtonGridSection';
import { useAlertDialog } from '@/components/common/AlertDialogProvider';
import { MahjongList, MahjongListItem, MahjongSubTitle } from '@/components/common/TextStyles';
import MahjongContainer from '@/components/MahjongContainer';
import MahjongSection from '@/components/MahjongSection';
import PageTitleBar from '@/components/page_parts/PageTitleBar';
import SelectorModal from '@/components/SelectorModal';
import { TextInputModal } from '@/components/TextInputModal';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useGetApiGroupsGroupKey } from '@/src/api/generated/mahjongApi';
import { Player } from '@/src/api/generated/mahjongApi.schemas';
import { useUpdateGroup } from '@/src/hooks/useGroups';
import { useCreatePlayer, useDeletePlayer, useGetPlayer } from '@/src/hooks/usePlayers';
import { useCreateTable } from '@/src/hooks/useTables';
import { useCreateTournament, useGetTournaments } from '@/src/hooks/useTournaments';
import { appStorage } from '@/src/storage/appStorage';
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

  const [accessLevel, setAccessLevel] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTournamentModal, setShowTournamentModal] = useState(false);
  const [isCreateTournamentModalOpen, setIsCreateTournamentModalOpen] = useState(false);
  const [isCreatePlayerModalOpen, setIsCreatePlayerModalOpen] = useState(false);

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
    appStorage.addGroupKey(groupKey);
    router.push('/');
  };
  const handleRemoveGroup = async () => {
    if (!groupKey || !group) return;
    const confirmed = await alertDialog({
      title: t('groupPage.dialogRemoveGroupTitle'),
      description: t('groupPage.dialogRemoveGroupDescription', { groupName: group.name }),
      showCancelButton: true,
    });
    if (!confirmed) return;
    appStorage.removeGroupKey(groupKey);
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
        <Button
          disabled={accessLevel === 'VIEW'}
          onPress={() => setIsCreatePlayerModalOpen(true)}
          className="w-full"
        >
          <Text>{t('groupPage.buttonAddPlayer')}</Text>
        </Button>
        <Button
          disabled={accessLevel === 'VIEW'}
          onPress={() => setShowDeleteModal(true)}
          className="w-full"
        >
          <Text>{t('groupPage.buttonDeletePlayer')}</Text>
        </Button>
        <Button
          disabled={accessLevel === 'VIEW'}
          onPress={() => setIsCreateTournamentModalOpen(true)}
          className="w-full"
        >
          <Text>{t('groupPage.buttonCreateTournament')}</Text>
        </Button>
        <Button onPress={() => setShowTournamentModal(true)} className="w-full">
          <Text>{t('groupPage.buttonSelectTournament')}</Text>
        </Button>
        <Button onPress={handleAddGroup} className="w-full">
          <Text>{t('groupPage.buttonSaveToBrowser')}</Text>
        </Button>
        <Button onPress={handleRemoveGroup} className="w-full">
          <Text>{t('groupPage.buttonRemoveFromBrowser')}</Text>
        </Button>
        <Button onPress={() => router.push(`/group/stats/${groupKey}`)} className="w-full">
          <Text>{t('groupPage.buttonStats')}</Text>
        </Button>
      </ButtonGridSection>

      <MahjongSection>
        <MahjongSubTitle>{t('groupPage.sectionMemberList')}</MahjongSubTitle>

        {isLoadingPlayers ? (
          <View className="items-center justify-center gap-2">
            <ActivityIndicator size="large" />
            <span>Loading...</span>
          </View>
        ) : (
          <MahjongList>
            {players?.map((player) => (
              <MahjongListItem key={player.id}>{player.name}</MahjongListItem>
            ))}
          </MahjongList>
        )}
      </MahjongSection>

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
