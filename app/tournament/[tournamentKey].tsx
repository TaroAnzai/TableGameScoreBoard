// src/pages/TournamentPage.jsx
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { ButtonGridSection } from '@/components/ButtonGridSection';
import { useAlertDialog } from '@/components/common/AlertDialogProvider';
import EditTournamentModal from '@/components/EditTournamentModal';
import MahjongContainer from '@/components/MahjongContainer';
import MahjongSection from '@/components/MahjongSection';
import MultiSelectorModal from '@/components/MultiSelectorModal';
import PageTitleBar from '@/components/page_parts/PageTitleBar';
import ScoreTable from '@/components/ScoreTable';
import SelectorModal from '@/components/SelectorModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useGetTournamentScore, useGetTournamentScoreMap } from '@/src//hooks/useScore';
import { useDeleteApiTournamentsTournamentKey } from '@/src/api/generated/mahjongApi';
import {
  type Player,
  type TablePlayerItem,
  TableType,
  type Tournament,
  type TournamentScoreMap,
  type TournamentUpdate,
} from '@/src/api/generated/mahjongApi.schemas';
import { useDeleteGame } from '@/src/hooks/useGames';
import { useGetPlayer } from '@/src/hooks/usePlayers';
import {
  useAddTablePlayer,
  useCreateTable,
  useDeleteChipTableWithScores,
  useDeleteTable,
  useGetTables,
} from '@/src/hooks/useTables';
import {
  useAddTournamentPlayer,
  useDeleteTounamentsPlayer,
  useDeleteTournament,
  useGetTournament,
  useGetTournamentPlayers,
  useUpdateTournament,
} from '@/src/hooks/useTournaments';
import { getAccessLevelstring } from '@/src/utils/accessLevel_utils';

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
//CHPテーブルにスコアデータが入っているか確認
const hasChipTableScore = (scoreMap: TournamentScoreMap | undefined) => {
  const chipTableIds =
    scoreMap?.tables?.filter((t) => t.type === TableType.CHIP).map((t) => t.id) ?? [];
  return chipTableIds.some((tableId) => {
    return scoreMap?.players.some((player) => {
      const score = player.scores?.[tableId] ?? 0;
      return score !== 0;
    });
  });
};

const TournamentPage = () => {
  const { t } = useTranslation();
  const { alertDialog } = useAlertDialog();
  const { tournamentKey } = useLocalSearchParams<{ tournamentKey: string }>();
  //Query系フック設定
  const { tournament, isLoadingTournament, loadTournament } = useGetTournament(tournamentKey);
  const groupKey =
    tournament?.parent_group_link.edit_link ?? tournament?.parent_group_link.view_link ?? '';
  const { players, isLoadingPlayers, loadPlayers } = useGetTournamentPlayers(tournamentKey);
  const { tables, isLoadingTables, loadTables } = useGetTables(tournamentKey);
  const { scoreMap, isLoadingScoreMap, loadScoreMap } = useGetTournamentScoreMap(tournamentKey);
  const { players: groupPlayers, isLoadingPlayers: isLoadingGroupPlayers } = useGetPlayer(groupKey);
  //Mutation系フック
  const { mutateAsync: addTournamentPlayer } = useAddTournamentPlayer();
  const { mutateAsync: deleteTournamentPlayer } = useDeleteTounamentsPlayer();
  const { mutate: createTable } = useCreateTable();
  const { mutate: updateTournament } = useUpdateTournament();
  const { mutate: deleteTournament } = useDeleteTournament();
  const { mutate: addTablePlayer } = useAddTablePlayer();
  const { mutateAsync: deleteChipTable } = useDeleteChipTableWithScores();

  //ローカルステート

  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);

  const [showDeletePlayerModal, setShowDeletePlayerModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const accessLevel = getAccessLevelstring(tournament?.tournament_links);
  const parentPageUrl = `/group/${groupKey}`;

  const handleOpenAddPlayerModal = async () => {
    if (!groupPlayers || groupPlayers.length === 0) {
      alert(t('tournamentPage.alertNoPlayersToAdd'));
      return;
    }
    setShowAddPlayerModal(true);
  };

  const handleAddPlayer = async (selectedPlayers: Player[]) => {
    setShowAddPlayerModal(false);
    const result = await addTournamentPlayer({
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
    // 既存の卓名から使用済み番号を抽出
    const existingNames = tables?.map((t) => t.name);
    let index = 1;
    let newName = t('tournamentPage.tableName', { index: index });
    while (existingNames?.includes(newName)) {
      index++;
      newName = t('tournamentPage.tableName', { index: index });
    }

    // 卓を作成
    const newTable = createTable({
      tournamentKey: tournamentKey,
      tableCreate: {
        name: newName,
      },
    });
  };

  const handleOpenDeletePlayerModal = () => {
    if (!players?.length) {
      alertDialog({
        title: 'Error Delete Player',
        description: t('tournamentPage.alertNoPlayersToDelete'),
      });
      return;
    }
    setShowDeletePlayerModal(true);
  };
  const handleDeletePlayer = async (player: Player) => {
    const confirmed = await alertDialog({
      title: 'Delete Player',
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
    const result = updateTournament({ tournamentKey: tournamentKey!, tournament: updates });
    setShowEditModal(false);
  };
  const handleRateCange = (newRate: number) => {
    updateTournament({
      tournamentKey: tournamentKey!,
      tournament: { rate: newRate },
    });
  };
  const handleTableClick = (table_id: number) => {
    if (!tables) return;
    const table = tables.find((t) => t.id === table_id);
    if (!table) return;
    const table_key = table.edit_link ?? table.view_link ?? '';
    router.push(`/table/${table_key}`);
  };
  const TitleWithModal = ({ onPress }: { onPress?: () => void }) => (
    <Pressable className="mahjong-editable-title" onPress={onPress}>
      <Text>{tournament?.name}</Text>
    </Pressable>
  );
  const handleDeleteTournament = async () => {
    //テーブルがあればエラーにする。
    const nomalTables = tables?.filter((t) => t.type === TableType.NORMAL);
    if (nomalTables && nomalTables.length > 0) {
      alertDialog({
        title: 'Error deleting tournament',
        description: t('tournamentPage.alertDeleteTournamentErrorDescription'),
        showCancelButton: false,
      });
      return;
    }
    //CHIPテーブルにデータが入っていたら確認後に削除する。
    const chipTables = tables?.filter((t) => t.type === TableType.CHIP);
    if (hasChipTableScore(scoreMap)) {
      const chipTableConfirmed = await alertDialog({
        title: t('tournamentPage.alertChipTableScoreTitle'),
        description: t('tournamentPage.alertChipTableScoreDescription'),
      });
      if (!chipTableConfirmed) return;
    }
    const confirmed = await alertDialog({
      title: t('tournamentPage.alertDeleteTournamentTitle'),
      description: t('tournamentPage.alertDeleteTournamentDescription'),
    });
    if (!confirmed) return;

    //CHIPテーブルのスコアデータとテーブル自体を削除
    if (chipTables && chipTables.length > 0) {
      for (const table of chipTables) {
        const tableKey = table.edit_link;
        if (tableKey) {
          await deleteChipTable(tableKey);
        }
      }
    }
    await deleteTournament({ tournamentKey: tournamentKey! });
    router.push(`/group/${groupKey}`);
  };

  return (
    <MahjongContainer>
      <PageTitleBar
        title={tournament ? tournament.name : 'Loading...'}
        shareLinks={tournament?.tournament_links}
        onTitleClick={() => setShowEditModal(true)}
        onTitleChange={handleTitleChange}
        TitleComponent={TitleWithModal}
        parentUrl={parentPageUrl}
      />
      <View className="flex-row items-center justify-center">
        <EditableRate
          rate={tournament?.rate}
          label={t('tournamentPage.rate')}
          onChange={handleRateCange}
        />
      </View>
      <ButtonGridSection>
        <Button
          className="w-full"
          disabled={accessLevel === 'VIEW'}
          onPress={handleOpenAddPlayerModal}
        >
          <Text>{t('tournamentPage.buttonAddPlayer')}</Text>
        </Button>
        <Button
          className="w-full"
          disabled={accessLevel === 'VIEW'}
          onPress={handleOpenDeletePlayerModal}
        >
          <Text>{t('tournamentPage.buttonDeletePlayer')}</Text>
        </Button>
        <Button className="w-full" disabled={accessLevel === 'VIEW'} onPress={handleCreateTable}>
          <Text>{t('tournamentPage.buttonCreateTable')}</Text>
        </Button>
        <Button
          className="w-full"
          disabled={accessLevel === 'VIEW'}
          onPress={handleDeleteTournament}
        >
          <Text>{t('tournamentPage.buttonDeleteTournament')}</Text>
        </Button>
      </ButtonGridSection>

      <MahjongSection>
        <Text>{t('tournamentPage.sectionTournamentScore')}</Text>
        {isChipTableNonZero(scoreMap) && <Text>{t('tournamentPage.chipNotZeroWarning')}</Text>}
        {scoreMap ? (
          <ScoreTable scoreMap={scoreMap} onClick={handleTableClick} />
        ) : (
          <View className="flex items-center justify-center gap-2">
            <ActivityIndicator size="large" />
            <Text>Loading...</Text>
          </View>
        )}
      </MahjongSection>

      {showAddPlayerModal && (
        <MultiSelectorModal
          open={showAddPlayerModal}
          title={t('tournamentPage.modalSelectPlayerTitle')}
          items={groupPlayers ?? []}
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
  rate?: number;
  label: string;
  onChange: (rate: number) => void;
}) => {
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [editedRate, setEditedRate] = useState<number | ''>(rate ?? 1);

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

  const handleRateBlur = () => {
    console.log('handleRateBlur');
    setIsEditingRate(false);

    if (editedRate === '' || Number(editedRate) <= 0) {
      setEditedRate(rate ?? 1);
      return;
    }

    const newRate = Number(editedRate);
    onChange(newRate);
  };

  return (
    <View className="flex-row items-center gap-2">
      <Text>{label}</Text>
      {isEditingRate ? (
        <Input
          className="w-20"
          keyboardType="numeric"
          value={editedRate.toString()}
          onChangeText={handleRateChange}
          onBlur={(e) => {
            console.log('Input onBlur');
            handleRateBlur();
          }}
          onSubmitEditing={handleRateBlur}
          blurOnSubmit
          autoFocus
        />
      ) : (
        <Pressable onPress={() => setIsEditingRate(true)}>
          <Text>{editedRate}</Text>
        </Pressable>
      )}
    </View>
  );
};
export default TournamentPage;
