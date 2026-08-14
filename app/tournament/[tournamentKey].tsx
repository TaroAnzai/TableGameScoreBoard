// src/pages/TournamentPage.jsx
import { router, useLocalSearchParams } from 'expo-router';
import { TriangleAlert, UserMinus, UserPlus } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Keyboard, Pressable, View } from 'react-native';

import { ButtonGridSection } from '@/components/ButtonGridSection';
import { useAlertDialog } from '@/components/common/AlertDialogProvider';
import EditTournamentModal from '@/components/EditTournamentModal';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import MahjongContainer from '@/components/MahjongContainer';
import MahjongSection from '@/components/MahjongSection';
import MahjongSectionHeader from '@/components/MahjongSectionHeader';
import MultiSelectorModal from '@/components/MultiSelectorModal';
import PageTitleBar from '@/components/page_parts/PageTitleBar';
import { ScoreTable } from '@/components/ScoreTable';
import { SectionErrorState } from '@/components/SectionErrorState';
import SelectorModal from '@/components/SelectorModal';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useGetTournamentScoreMap } from '@/src//hooks/useScore';
import {
  type Player,
  type TablePlayerItem,
  TableType,
  type TournamentScoreMap,
  type TournamentUpdate,
} from '@/src/api/generated/mahjongApi.schemas';
import { useGetPlayer } from '@/src/hooks/usePlayers';
import { useAddTablePlayer, useCreateTable, useGetTables } from '@/src/hooks/useTables';
import {
  useAddTournamentPlayer,
  useDeleteTounamentsPlayer,
  useGetTournament,
  useGetTournamentPlayers,
  useUpdateTournament,
} from '@/src/hooks/useTournaments';
import { getAccessLevelstring, getResourceKey } from '@/src/utils/accessLevel_utils';

const isChipTableNonZero = (scoreMap: TournamentScoreMap | undefined) => {
  const chipTableIds =
    scoreMap?.tables?.filter((t) => t.type === TableType.CHIP).map((t) => t.id) ?? [];
  return chipTableIds.some((tableId) => {
    const tableTotal = scoreMap?.players.reduce((sum, player) => {
      return sum + (player.scores?.[tableId] ?? 0);
    }, 0);
    return tableTotal !== 0;
  });
};
const TournamentPage = () => {
  const { t } = useTranslation();
  const { alertDialog } = useAlertDialog();
  const { tournamentKey, parentGroupKey } = useLocalSearchParams<{
    tournamentKey: string;
    parentGroupKey?: string;
  }>();
  //Query系フック設定
  const {
    tournament,
    isLoadingTournament,
    isErrorTournament,
    isFetchingTournament,
    tournamentError,
    loadTournament,
  } = useGetTournament(tournamentKey);
  const groupKey = getResourceKey(tournament?.parent_group_link) ?? '';
  const {
    players,
    isLoadingPlayers,
    isErrorPlayers,
    isFetchingPlayers,
    loadPlayers: loadTournamentPlayers,
  } = useGetTournamentPlayers(tournamentKey);
  const { tables, isLoadingTables, isErrorTables, isFetchingTables, loadTables } =
    useGetTables(tournamentKey);
  const { scoreMap, isLoadingScoreMap, isErrorScoreMap, isFetchingScoreMap, loadScoreMap } =
    useGetTournamentScoreMap(tournamentKey);
  const {
    players: groupPlayers,
    isLoadingPlayers: isLoadingGroupPlayers,
    isErrorPlayers: isErrorGroupPlayers,
    isFetchingPlayers: isFetchingGroupPlayers,
    loadPlayers: loadGroupPlayers,
  } = useGetPlayer(groupKey);
  //Mutation系フック
  const { mutateAsync: addTournamentPlayer } = useAddTournamentPlayer();
  const { mutateAsync: deleteTournamentPlayer } = useDeleteTounamentsPlayer();
  const { mutate: createTable, isPending: isCreatingTable } = useCreateTable();
  const { mutate: updateTournament } = useUpdateTournament();
  const { mutate: addTablePlayer } = useAddTablePlayer();

  //ローカルステート

  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);

  const [showDeletePlayerModal, setShowDeletePlayerModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const isCreatingTableRef = useRef(false);

  const accessLevel = getAccessLevelstring(tournament?.tournament_links);
  const parentPageUrl = `/group/${parentGroupKey ?? groupKey}`;

  const candidatePlayers = groupPlayers?.filter(
    (player) => !players?.some((p) => p.id === player.id),
  );

  const isLoading =
    isLoadingTournament ||
    isLoadingPlayers ||
    isLoadingTables ||
    isLoadingScoreMap ||
    (!!groupKey && isLoadingGroupPlayers);

  const isError =
    isErrorTournament ||
    isErrorPlayers ||
    isErrorTables ||
    isErrorScoreMap ||
    (!!groupKey && isErrorGroupPlayers);

  const isRetrying =
    isError &&
    (isFetchingTournament ||
      isFetchingPlayers ||
      isFetchingTables ||
      isFetchingScoreMap ||
      (!!groupKey && isFetchingGroupPlayers));

  const retrySection = async () => {
    const requests: Promise<unknown>[] = [
      loadTournament(),
      loadTournamentPlayers(),
      loadTables(),
      loadScoreMap(),
    ];
    if (groupKey) requests.push(loadGroupPlayers());
    await Promise.all(requests);
  };

  const handleOpenAddPlayerModal = async () => {
    if (!candidatePlayers?.length) {
      await alertDialog({
        title: t('tournamentPage.alertNoPlayersToAddTitle'),
        description: t('tournamentPage.alertNoPlayersToAdd'),
        showCancelButton: false,
      });
      return;
    }
    setShowAddPlayerModal(true);
  };

  const handleAddPlayer = async (selectedPlayers: Player[]) => {
    setShowAddPlayerModal(false);
    await addTournamentPlayer({
      tournamentKey: tournamentKey!,
      players: selectedPlayers,
    });
    //CHIPテーブルにも追加する。
    const chipTables = tables?.filter((t) => t.type === 'CHIP');
    chipTables?.forEach((table) => {
      const tableKey = table.edit_link;
      if (!tableKey) return;
      const tablePlayers = selectedPlayers.map<TablePlayerItem>((player) => ({
        player_id: player.id,
      }));
      addTablePlayer({ tableKey: tableKey, tablePlayersItem: tablePlayers });
    });
  };
  const handleCreateTable = () => {
    if (isCreatingTableRef.current || isCreatingTable) return;
    isCreatingTableRef.current = true;
    // 既存の卓名から使用済み番号を抽出
    const existingNames = tables?.map((t) => t.name);
    let index = 1;
    let newName = t('tournamentPage.tableName', { index: index });
    while (existingNames?.includes(newName)) {
      index++;
      newName = t('tournamentPage.tableName', { index: index });
    }

    // 卓を作成
    createTable(
      {
        tournamentKey: tournamentKey,
        tableCreate: {
          name: newName,
        },
      },
      { onSettled: () => (isCreatingTableRef.current = false) },
    );
  };

  const handleOpenDeletePlayerModal = () => {
    if (!players?.length) {
      alertDialog({
        title: t('tournamentPage.alertDeletePlayerErrorTitle'),
        description: t('tournamentPage.alertNoPlayersToDelete'),
      });
      return;
    }
    setShowDeletePlayerModal(true);
  };
  const handleDeletePlayer = async (player: Player) => {
    const confirmed = await alertDialog({
      title: t('tournamentPage.alertDeletePlayerTitle'),
      description: t('tournamentPage.alertDeletePlayerDescription', { playerName: player.name }),
    });
    //
    if (!confirmed) return;
    const payload = { tournamentKey: tournamentKey!, playerId: player.id };
    deleteTournamentPlayer(payload);

    setShowDeletePlayerModal(false);
  };
  const handleTitleChange = (newName: string) => {
    updateTournament({ tournamentKey: tournamentKey, tournament: { name: newName } });
  };
  const handleUpdateTournament = (updates: TournamentUpdate) => {
    updateTournament({ tournamentKey: tournamentKey!, tournament: updates });
    setShowEditModal(false);
  };
  const handleRateChange = (newRate: number) => {
    updateTournament({
      tournamentKey: tournamentKey!,
      tournament: { rate: newRate },
    });
  };
  const handleTableClick = (table_id: number) => {
    if (!tables) return;
    const table = tables.find((t) => t.id === table_id);
    if (!table) return;
    const table_key = getResourceKey(table);
    if (!table_key) return;
    router.push({
      pathname: '/table/[tableKey]',
      params: {
        tableKey: table_key,
        parentTournamentKey: tournamentKey,
        parentGroupKey: parentGroupKey ?? groupKey,
      },
    });
  };
  const TitleWithModal = ({ onPress }: { onPress?: () => void }) =>
    onPress ? (
      <Pressable className="mahjong-editable-title" onPress={onPress}>
        <Text>{tournament?.name}</Text>
      </Pressable>
    ) : (
      <Text>{tournament?.name}</Text>
    );
  if (!tournamentKey) {
    return (
      <MahjongContainer>
        <View className="flex-1 items-center justify-center">
          <Text>{t('tournamentPage.tournamentKeyMissing')}</Text>
        </View>
      </MahjongContainer>
    );
  }

  if (isLoadingTournament) {
    return (
      <MahjongContainer>
        <LoadingIndicator text={t('tournamentPage.loading')} />
      </MahjongContainer>
    );
  }

  if (isErrorTournament || !tournament) {
    const isNotFound =
      typeof tournamentError === 'object' &&
      tournamentError !== null &&
      'status' in tournamentError &&
      Number(tournamentError.status) === 404;
    return (
      <MahjongContainer>
        <SectionErrorState
          message={t(
            isNotFound ? 'tournamentPage.tournamentNotFound' : 'tournamentPage.tournamentLoadError',
          )}
          isRetrying={isFetchingTournament}
          onRetry={() => void loadTournament()}
        />
      </MahjongContainer>
    );
  }

  return (
    <MahjongContainer>
      <PageTitleBar
        title={tournament?.name ?? ''}
        shareLinks={tournament?.tournament_links}
        onTitleClick={accessLevel === 'VIEW' ? undefined : () => setShowEditModal(true)}
        onTitleChange={accessLevel === 'VIEW' ? undefined : handleTitleChange}
        TitleComponent={TitleWithModal}
        parentUrl={parentPageUrl}
      />
      <View className="mb-2 flex-row items-center justify-center">
        {tournament && (
          <EditableRate
            key={`${tournament.id}-${tournament.rate}`}
            rate={tournament.rate}
            label={t('tournamentPage.rate')}
            onChange={accessLevel === 'VIEW' ? undefined : handleRateChange}
          />
        )}
      </View>

      <MahjongSection
        className="justify-start"
        isLoading={isLoading}
        isError={isError}
        isRetrying={isRetrying}
        onRetry={() => void retrySection()}
      >
        <MahjongSectionHeader
          title={t('tournamentPage.sectionTournamentScore')}
          actions={
            accessLevel !== 'VIEW' && (
              <>
                <Button
                  accessibilityLabel={t('groupPage.modalCreateTournamentTitle')}
                  className="h-10 w-10 rounded-full p-0"
                  size="icon"
                  variant="ghost"
                  onPress={handleOpenAddPlayerModal}
                >
                  <Icon as={UserPlus} className="text-on-surface" size={24} />
                </Button>
                <Button
                  accessibilityLabel={t('groupPage.modalDeleteTournamentTitle')}
                  className="h-10 w-10 rounded-full p-0"
                  size="icon"
                  variant="ghost"
                  onPress={handleOpenDeletePlayerModal}
                >
                  <Icon as={UserMinus} className="text-error" size={24} />
                </Button>
              </>
            )
          }
        />
        {players?.length === 0 ? (
          <Text>{t('tournamentPage.sectionTournamentScoreEmpty')}</Text>
        ) : (
          <>
            {isChipTableNonZero(scoreMap) && (
              <View
                accessibilityRole="alert"
                className="mb-3 w-full flex-row gap-3 rounded-xl border border-warning bg-warning/10 p-3"
              >
                <Icon as={TriangleAlert} className="mt-0.5 text-warning" size={22} />
                <View className="min-w-0 flex-1 gap-1">
                  <Text className="font-bold text-warning">
                    {t('tournamentPage.chipNotZeroWarningTitle')}
                  </Text>
                  <Text className="text-sm text-on-surface">
                    {t('tournamentPage.chipNotZeroWarning')}
                  </Text>
                </View>
              </View>
            )}
            {scoreMap && <ScoreTable scoreMap={scoreMap} onClick={handleTableClick} />}
          </>
        )}
      </MahjongSection>
      <ButtonGridSection>
        <Button
          className="w-full"
          disabled={accessLevel === 'VIEW' || isCreatingTable}
          onPress={handleCreateTable}
        >
          {isCreatingTable && (
            <ActivityIndicator accessibilityLabel={t('tournamentPage.creatingTable')} />
          )}
          <Text>
            {isCreatingTable
              ? t('tournamentPage.creatingTable')
              : t('tournamentPage.buttonCreateTable')}
          </Text>
        </Button>
      </ButtonGridSection>
      {showAddPlayerModal && (
        <MultiSelectorModal
          open={showAddPlayerModal}
          title={t('tournamentPage.modalSelectPlayerTitle')}
          items={candidatePlayers ?? []}
          onConfirm={handleAddPlayer}
          onClose={() => setShowAddPlayerModal(false)}
        />
      )}

      {showDeletePlayerModal && (
        <SelectorModal
          title={t('tournamentPage.modalDeletePlayerTitle')}
          open={showDeletePlayerModal}
          items={players ?? []}
          onSelect={handleDeletePlayer}
          onClose={() => setShowDeletePlayerModal(false)}
        />
      )}

      {showEditModal && tournament && (
        <EditTournamentModal
          open={showEditModal}
          tournament={tournament}
          onConfirm={handleUpdateTournament}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </MahjongContainer>
  );
};
const EditableRate = ({
  rate,
  label,
  onChange,
}: {
  rate: number;
  label: string;
  onChange?: (rate: number) => void;
}) => {
  const [editedRate, setEditedRate] = useState<number | ''>(rate);
  const submittedRef = useRef(false);

  const handleRateChange = (text: string) => {
    if (text === '') {
      setEditedRate('');
      return;
    }

    const num = Number(text);
    if (!Number.isNaN(num)) {
      setEditedRate(num);
    }
  };

  const handleRateSubmit = () => {
    submittedRef.current = true;
    if (editedRate === '' || Number(editedRate) <= 0) {
      setEditedRate(rate);
      return;
    }
    if (editedRate === rate) {
      return;
    }
    const newRate = Number(editedRate);
    onChange?.(newRate);
  };
  const handleRateBlur = () => {
    if (submittedRef.current) {
      submittedRef.current = false;
      return;
    }
    setEditedRate(rate);
  };
  return (
    <Pressable className="w-full items-center" onPress={Keyboard.dismiss}>
      <View className="flex-row items-center gap-2">
        <Text>{label}:</Text>
        {onChange ? (
          <Input
            className="w-20 text-right"
            keyboardType="numeric"
            value={editedRate.toString()}
            onChangeText={handleRateChange}
            onBlur={() => {
              handleRateBlur();
            }}
            onSubmitEditing={handleRateSubmit}
            submitBehavior="blurAndSubmit"
          />
        ) : (
          <Text>{rate.toLocaleString()}</Text>
        )}
      </View>
    </Pressable>
  );
};
export default TournamentPage;
