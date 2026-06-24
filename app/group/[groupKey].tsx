import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';

import { ButtonGridSection } from '@/components/ButtonGridSection';
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
import { useCreatePlayer, useDeletePlayer, useGetPlayer } from '@/src/hooks/usePlayers';
import { useGetTournaments } from '@/src/hooks/useTournaments';
const GroupPage = () => {
  const { t } = useTranslation();
  const { groupKey } = useLocalSearchParams<{ groupKey: string }>();

  const { players, isLoadingPlayers, loadPlayers } = useGetPlayer(groupKey);
  const { tournaments } = useGetTournaments(groupKey);
  const { data: group, refetch: refetchGroup } = useGetApiGroupsGroupKey(groupKey);
  const [accessLevel, setAccessLevel] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTournamentModal, setShowTournamentModal] = useState(false);
  const [isCreateTournamentModalOpen, setIsCreateTournamentModalOpen] = useState(false);
  const [isCreatePlayerModalOpen, setIsCreatePlayerModalOpen] = useState(false);

  const handleTitleChange = () => {};
  const handleAddGroup = () => {};
  const handleRemoveGroup = () => {};
  const handleDeletePlayer = (player: Player) => {};
  const handleAddPlayer = () => {};
  const handleCreateTournament = () => {};

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
        <Button disabled={accessLevel === 'VIEW'} onPress={() => setIsCreatePlayerModalOpen(true)}>
          <Text>{t('groupPage.buttonAddPlayer')}</Text>
        </Button>
        <Button disabled={accessLevel === 'VIEW'} onPress={() => setShowDeleteModal(true)}>
          <Text>{t('groupPage.buttonDeletePlayer')}</Text>
        </Button>
        <Button
          disabled={accessLevel === 'VIEW'}
          onPress={() => setIsCreateTournamentModalOpen(true)}
        >
          <Text>{t('groupPage.buttonCreateTournament')}</Text>
        </Button>
        <Button onPress={() => setShowTournamentModal(true)}>
          <Text>{t('groupPage.buttonSelectTournament')}</Text>
        </Button>
        <Button onPress={handleAddGroup}>
          <Text>{t('groupPage.buttonSaveToBrowser')}</Text>
        </Button>
        <Button onPress={handleRemoveGroup}>
          <Text>{t('groupPage.buttonRemoveFromBrowser')}</Text>
        </Button>
        <Button onPress={() => router.push(`/group/stats/${groupKey}`)}>
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
