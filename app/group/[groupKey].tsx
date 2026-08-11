import { format } from 'date-fns';
import { router, useLocalSearchParams } from 'expo-router';
import { SquareMinus, SquarePlus, UserMinus, UserPlus } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ButtonGridSection } from '@/components/ButtonGridSection';
import { useAlertDialog } from '@/components/common/AlertDialogProvider';
import { MahjongList } from '@/components/common/TextStyles';
import MahjongContainer from '@/components/MahjongContainer';
import { MahjongListItem } from '@/components/MahjongListItem';
import MahjongSection from '@/components/MahjongSection';
import MahjongSectionHeader from '@/components/MahjongSectionHeader';
import PageTitleBar from '@/components/page_parts/PageTitleBar';
import SelectorModal from '@/components/SelectorModal';
import { TextInputModal } from '@/components/TextInputModal';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Text } from '@/components/ui/text';
import { useGetApiGroupsGroupKey } from '@/src/api/generated/mahjongApi';
import { Player, Tournament } from '@/src/api/generated/mahjongApi.schemas';
import { useUpdateGroup } from '@/src/hooks/useGroups';
import { useCreatePlayer, useDeletePlayer, useGetPlayer } from '@/src/hooks/usePlayers';
import { useCreateTable } from '@/src/hooks/useTables';
import {
  useCreateTournament,
  useDeleteTournament,
  useGetTournaments,
} from '@/src/hooks/useTournaments';
import { appStorage } from '@/src/storage/appStorage';
import { getAccessLevelstring } from '@/src/utils/accessLevel_utils';
const GroupPage = () => {
  const { t } = useTranslation();
  const { groupKey } = useLocalSearchParams<{ groupKey: string }>();
  const { alertDialog } = useAlertDialog();

  const { players, isLoadingPlayers, isErrorPlayers, isFetchingPlayers, loadPlayers } =
    useGetPlayer(groupKey);
  const {
    tournaments,
    isLoadingTournaments,
    isErrorTournaments,
    isFetchingTournaments,
    loadTournaments,
  } = useGetTournaments(groupKey);
  const {
    data: group,
    isLoading: isLoadingGroup,
    isError: isErrorGroup,
    isFetching: isFetchingGroup,
    refetch: refetchGroup,
  } = useGetApiGroupsGroupKey(groupKey);
  const { mutate: updateGroup } = useUpdateGroup(refetchGroup);
  const { mutate: createPlayer } = useCreatePlayer(loadPlayers);
  const { mutate: deletePlayer } = useDeletePlayer(loadPlayers);
  const { mutateAsync: createTournament } = useCreateTournament();
  const { mutateAsync: deleteTournament } = useDeleteTournament();
  const { mutateAsync: createChipTable } = useCreateTable();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTournamentModal, setShowTournamentModal] = useState(false);
  const [showDeleteTournamentModal, setShowDeleteTournamentModal] = useState(false);
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
    router.push({
      pathname: '/tournament/[tournamentKey]',
      params: { tournamentKey: data.edit_link, parentGroupKey: groupKey },
    });
  };

  const handleDeleteTournament = async (tournament: Tournament) => {
    setShowDeleteTournamentModal(false);
    const tournamentKey = tournament.edit_link ?? tournament.owner_link;
    if (!tournamentKey) return;

    const confirmed = await alertDialog({
      title: t('groupPage.alertDeleteTournamentTitle'),
      description: t('groupPage.alertDeleteTournamentDescription', {
        tournamentName: tournament.name,
      }),
    });
    if (!confirmed) return;

    try {
      await deleteTournament({ tournamentKey });
      await loadTournaments();
    } catch {
      // The mutation hook displays the API error dialog.
    }
  };

  return (
    <MahjongContainer>
      <PageTitleBar
        title={group ? group.name : t('Common.loading')}
        shareLinks={group ? group.group_links : []}
        onTitleChange={accessLevel === 'VIEW' ? undefined : handleTitleChange}
        parentUrl="/"
      />

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
          <MahjongSection
            className="min-h-0 justify-start"
            isLoading={isLoadingGroup || isLoadingTournaments}
            isError={isErrorGroup || isErrorTournaments}
            isRetrying={
              (isErrorGroup || isErrorTournaments) && (isFetchingGroup || isFetchingTournaments)
            }
            onRetry={() => void Promise.all([refetchGroup(), loadTournaments()])}
          >
            <MahjongSectionHeader
              title={t('groupPage.buttonSelectTournament')}
              actions={
                accessLevel !== 'VIEW' && (
                  <>
                    <Button
                      accessibilityLabel={t('groupPage.modalCreateTournamentTitle')}
                      className="h-10 w-10 rounded-full p-0"
                      size="icon"
                      variant="ghost"
                      onPress={() => setIsCreateTournamentModalOpen(true)}
                    >
                      <Icon as={SquarePlus} className="text-on-surface" size={24} />
                    </Button>
                    <Button
                      accessibilityLabel={t('groupPage.modalDeleteTournamentTitle')}
                      className="h-10 w-10 rounded-full p-0"
                      size="icon"
                      variant="ghost"
                      onPress={() => setShowDeleteTournamentModal(true)}
                    >
                      <Icon as={SquareMinus} className="text-error" size={24} />
                    </Button>
                  </>
                )
              }
            />

            {tournaments?.length === 0 ? (
              <Text>{t('groupPage.sectionTournamentListEmpty')}</Text>
            ) : (
              <MahjongList>
                {tournaments?.map((tournament) => (
                  <MahjongListItem
                    key={tournament.id}
                    title={tournament.name}
                    badge={t('groupPage.rateLabel', { rate: tournament.rate })}
                    accessories={[
                      tournament.created_at &&
                        t('groupPage.createdAt', {
                          date: format(new Date(tournament.created_at), 'yyyy-MM-dd'),
                        }),
                    ]}
                    onPress={() => {
                      const tournament_key = tournament.edit_link ?? tournament.view_link;
                      router.push({
                        pathname: '/tournament/[tournamentKey]',
                        params: { tournamentKey: tournament_key, parentGroupKey: groupKey },
                      });
                    }}
                  />
                ))}
              </MahjongList>
            )}
          </MahjongSection>
        </TabsContent>
        <TabsContent value="member" className="min-h-0 w-full flex-1">
          {/* Member List */}
          <MahjongSection
            className="min-h-0 justify-start"
            isLoading={isLoadingGroup || isLoadingPlayers}
            isError={isErrorGroup || isErrorPlayers}
            isRetrying={(isErrorGroup || isErrorPlayers) && (isFetchingGroup || isFetchingPlayers)}
            onRetry={() => void Promise.all([refetchGroup(), loadPlayers()])}
          >
            <MahjongSectionHeader
              title={t('groupPage.sectionMemberList')}
              actions={
                accessLevel !== 'VIEW' && (
                  <>
                    <Button
                      accessibilityLabel={t('groupPage.modalCreatePlayerTitle')}
                      className="h-10 w-10 rounded-full p-0"
                      size="icon"
                      variant="ghost"
                      onPress={() => setIsCreatePlayerModalOpen(true)}
                    >
                      <Icon as={UserPlus} className="text-on-surface" size={24} />
                    </Button>

                    <Button
                      accessibilityLabel={t('groupPage.modalDeletePlayerTitle')}
                      className="h-10 w-10 rounded-full p-0"
                      size="icon"
                      variant="ghost"
                      onPress={() => setShowDeleteModal(true)}
                    >
                      <Icon as={UserMinus} className="text-error" size={24} />
                    </Button>
                  </>
                )
              }
            />

            {players?.length === 0 ? (
              <Text>{t('groupPage.sectionMemberListEmpty')}</Text>
            ) : (
              <MahjongList columns={2}>
                {players?.map((player) => (
                  <MahjongListItem key={player.id} title={player.name} />
                ))}
              </MahjongList>
            )}
          </MahjongSection>
        </TabsContent>
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
              router.push({
                pathname: '/tournament/[tournamentKey]',
                params: { tournamentKey: tournament_key, parentGroupKey: groupKey },
              });
            }
            setShowTournamentModal(false);
          }}
          onClose={() => setShowTournamentModal(false)}
          emptyMessage={t('groupPage.modalSelectTournamentEmpty')}
        />
      )}
      {showDeleteTournamentModal && (
        <SelectorModal
          title={t('groupPage.modalDeleteTournamentTitle')}
          open={showDeleteTournamentModal}
          items={tournaments}
          onSelect={handleDeleteTournament}
          onClose={() => setShowDeleteTournamentModal(false)}
          emptyMessage={t('groupPage.modalDeleteTournamentEmpty')}
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
