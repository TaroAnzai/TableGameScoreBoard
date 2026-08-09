// src/pages/TournamentPage.jsx
import { router, useLocalSearchParams } from 'expo-router';
import { UserMinus, UserPlus } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Keyboard, Pressable, View } from 'react-native';

import { ButtonGridSection } from '@/components/ButtonGridSection';
import { useAlertDialog } from '@/components/common/AlertDialogProvider';
import EditTournamentModal from '@/components/EditTournamentModal';
import MahjongContainer from '@/components/MahjongContainer';
import MahjongSection from '@/components/MahjongSection';
import MahjongSectionHeader from '@/components/MahjongSectionHeader';
import MultiSelectorModal from '@/components/MultiSelectorModal';
import PageTitleBar from '@/components/page_parts/PageTitleBar';
import { ScoreTable } from '@/components/ScoreTable';
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
import {
  useAddTablePlayer,
  useCreateTable,
  useDeleteChipTableWithScores,
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
  const { tournamentKey, parentGroupKey } = useLocalSearchParams<{
    tournamentKey: string;
    parentGroupKey?: string;
  }>();
  //Query系フック設定
  const { tournament, isLoadingTournament } = useGetTournament(tournamentKey);
  const groupKey =
    tournament?.parent_group_link.edit_link ?? tournament?.parent_group_link.view_link ?? '';
  const { players, isLoadingPlayers } = useGetTournamentPlayers(tournamentKey);
  const { tables, isLoadingTables } = useGetTables(tournamentKey);
  const { scoreMap, isLoadingScoreMap } = useGetTournamentScoreMap(tournamentKey);
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

  const handleOpenAddPlayerModal = async () => {
    if (!groupPlayers || groupPlayers.length === 0) {
      alert(t('tournamentPage.alertNoPlayersToAdd'));
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
    // 既存の卓名から使用済み番号を抽出
    const existingNames = tables?.map((t) => t.name);
    let index = 1;
    let newName = t('tournamentPage.tableName', { index: index });
    while (existingNames?.includes(newName)) {
      index++;
      newName = t('tournamentPage.tableName', { index: index });
    }

    // 卓を作成
    createTable({
      tournamentKey: tournamentKey,
      tableCreate: {
        name: newName,
      },
    });
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
        title: t('tournamentPage.alertDeleteTournamentErrorTitle'),
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
    router.push({
      pathname: '/group/[groupKey]',
      params: { groupKey: parentGroupKey ?? groupKey },
    });
  };

  if (!tournamentKey) {
    return (
      <MahjongContainer>
        <View className="flex-1 items-center justify-center">
          <Text>{t('tournamentPage.tournamentKeyMissing')}</Text>
        </View>
      </MahjongContainer>
    );
  }

  if (isLoading) {
    return (
      <MahjongContainer>
        <View className="flex-1 items-center justify-center gap-3">
          <ActivityIndicator accessibilityLabel={t('tournamentPage.loading')} size="large" />
          <Text>{t('tournamentPage.loading')}</Text>
        </View>
      </MahjongContainer>
    );
  }

  return (
    <MahjongContainer>
      <PageTitleBar
        title={tournament?.name ?? ''}
        shareLinks={tournament?.tournament_links}
        onTitleClick={() => setShowEditModal(true)}
        onTitleChange={handleTitleChange}
        TitleComponent={TitleWithModal}
        parentUrl={parentPageUrl}
      />
      <View className="mb-2 flex-row items-center justify-center">
        {tournament && (
          <EditableRate
            key={`${tournament.id}-${tournament.rate}`}
            rate={tournament.rate}
            label={t('tournamentPage.rate')}
            onChange={handleRateChange}
          />
        )}
      </View>

      <MahjongSection className="justify-start">
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
            {isChipTableNonZero(scoreMap) && <Text>{t('tournamentPage.chipNotZeroWarning')}</Text>}
            {scoreMap && <ScoreTable scoreMap={scoreMap} onClick={handleTableClick} />}
          </>
        )}
      </MahjongSection>
      <ButtonGridSection>
        <Button className="w-full" disabled={accessLevel === 'VIEW'} onPress={handleCreateTable}>
          <Text>{t('tournamentPage.buttonCreateTable')}</Text>
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
  onChange: (rate: number) => void;
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
    onChange(newRate);
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
      </View>
    </Pressable>
  );
};
export default TournamentPage;
