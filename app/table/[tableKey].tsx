// React 関連
import { router, useLocalSearchParams } from 'expo-router';
import { Accessibility, UserMinus, UserPlus } from 'lucide-react-native';
import React, { use, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ButtonGridSection } from '@/components/ButtonGridSection';
import { useAlertDialog } from '@/components/common/AlertDialogProvider';
import MahjongContainer from '@/components/MahjongContainer';
import MahjongSection from '@/components/MahjongSection';
import MahjongSectionHeader from '@/components/MahjongSectionHeader';
import MultiSelectorModal from '@/components/MultiSelectorModal';
// API 関連a
// コンポーネント
import PageTitleBar from '@/components/page_parts/PageTitleBar';
import SelectorModal from '@/components/SelectorModal';
import TableScoreBoard from '@/components/TableScoreBoard';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import {
  useCreateGame,
  useDeleteGame,
  useGetTableGames,
  useUpdateGame,
} from '@/src//hooks/useGames';
import type {
  Game,
  Player,
  ScoreInput,
  TablePlayerItem,
} from '@/src/api/generated/mahjongApi.schemas';
import {
  useAddTablePlayer,
  useDeleteTable,
  useDeleteTablePlayer,
  useGetTable,
  useGetTablePlayer,
  useUpdateTable,
} from '@/src/hooks/useTables';
import { useGetTournamentPlayers } from '@/src/hooks/useTournaments';
import { getAccessLevelstring } from '@/src/utils/accessLevel_utils';

export default function TablePage() {
  const { alertDialog } = useAlertDialog();
  const { t } = useTranslation();
  //State系フック設定
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [showDeletePlayerModal, setShowDeletePlayerModal] = useState(false);
  const [showDeleteGameModal, setShowDeleteGameModal] = useState(false);
  //Mutation系フック
  const { mutate: updateTable } = useUpdateTable();
  const { mutate: deleteTable, isSuccess: isTableDeleteSuccess } = useDeleteTable();
  const { mutate: addTablePlayer } = useAddTablePlayer();
  const { mutate: deleteTablePlayer } = useDeleteTablePlayer();
  const { mutate: createGame } = useCreateGame();
  const { mutate: updateGame } = useUpdateGame();
  const { mutate: deleteGame } = useDeleteGame();
  //Query系フック設定
  const { tableKey } = useLocalSearchParams<{ tableKey: string }>();
  const { table, isLoadingTable, loadTable } = useGetTable(tableKey ?? '', { enabled: !!tableKey });
  const { players: tablePlayers, isLoadingPlayers: isLoadingTablePlayers } = useGetTablePlayer(
    tableKey ?? '',
    { enabled: !!tableKey },
  );
  const { games, isLoadingGames } = useGetTableGames(tableKey ?? '', { enabled: !!tableKey });

  const isChipTable = table?.type === 'CHIP';
  const tournamentKey =
    table?.parent_tournament_link.edit_link ?? table?.parent_tournament_link.view_link ?? undefined;
  const { players: tournamentPlayers, isLoadingPlayers } = useGetTournamentPlayers(
    tournamentKey ?? '',
    { enabled: !!tournamentKey },
  );
  const remainingPlayers = tournamentPlayers?.filter(
    (p) => !tablePlayers?.find((t) => t.id === p.id),
  );

  const accessLevel = getAccessLevelstring(table?.table_links);
  const parentUrl = `/tournament/${tournamentKey}`;
  useEffect(() => {
    if (isTableDeleteSuccess) {
      router.push(`/tournament/${tournamentKey}`);
    }
  }, [isTableDeleteSuccess]);

  // Early retrurn
  // --- ① 不正URL対応 ---
  if (!tableKey) {
    return <div>{t('tablePage.errorInvalidTableKey')}</div>;
  }
  const handleTableNameChange = (newTitle: string) => {
    updateTable({ tableKey: tableKey!, tableUpdate: { name: newTitle } });
  };
  // --- ④ データが存在しない ---
  if (!table && !isLoadingTable) {
    return <div>{t('tablePage.errorTableNotFound')}</div>;
  }
  const handleAddPlayer = (selectedPlayers: Player[]) => {
    const plyerIds: TablePlayerItem[] = selectedPlayers.map((p) => ({ player_id: p.id }));
    addTablePlayer({ tableKey: tableKey!, tablePlayersItem: plyerIds });
    setShowAddPlayerModal(false);
  };

  const handleDeletePlayer = (player: Player) => {
    deleteTablePlayer({ tableKey: tableKey!, playerId: player.id });
    setShowDeletePlayerModal(false);
  };
  const handleUpdateGame = (gameId: number | null, newScores: ScoreInput[]) => {
    if (!tableKey) return;
    if (gameId === null) {
      const gameCreate = { scores: newScores };
      createGame({ tableKey: tableKey, gameCreate: gameCreate });
    } else {
      const data = { scores: newScores };
      updateGame({ tableKey: tableKey, gameId: gameId, gameUpdate: data });
    }
  };

  const handleDeleteTable = async () => {
    const confirmed = await alertDialog({
      title: t('tablePage.alertDeleteGameTitle'),
      description: t('tablePage.alertDeleteGameDescription'),
    });
    if (!confirmed) return;
    deleteTable({ tableKey: tableKey! });
  };

  const handleDeleteGameClick = () => {
    setShowDeleteGameModal(true);
  };
  const handleDeleteGame = async (game: { id: number }) => {
    const confirmed = await alertDialog({
      title: t('tablePage.alertDeleteGameTitle'),
      description: t('tablePage.alertDeleteGameDescription'),
    });
    if (confirmed) deleteGame({ tableKey: tableKey!, gameId: game.id! });
    setShowDeleteGameModal(false);
  };

  return (
    <MahjongContainer>
      <PageTitleBar
        title={table ? table.name : t('Common.loading')}
        onTitleChange={handleTableNameChange}
        shareLinks={table ? table.table_links : []}
        parentUrl={parentUrl}
      />

      <MahjongSection
        isLoading={
          isLoadingTable ||
          isLoadingGames ||
          isLoadingTablePlayers ||
          (!!tournamentKey && isLoadingPlayers)
        }
      >
        <MahjongSectionHeader
          title={
            table ? t('tablePage.scoreSheetTitle', { tableName: table.name }) : t('Common.loading')
          }
          actions={
            accessLevel !== 'VIEW' && (
              <>
                <Button
                  accessibilityLabel={t('tablePage.buttonAddPlayer')}
                  className="h-10 w-10 rounded-full p-0"
                  size="icon"
                  variant="ghost"
                  onPress={() => {
                    setShowAddPlayerModal(true);
                  }}
                >
                  <Icon as={UserPlus} className="text-on-surface" size={24} />
                </Button>
                <Button
                  accessibilityLabel={t('tablePage.buttonDeletePlayer')}
                  className="h-10 w-10 rounded-full p-0"
                  size="icon"
                  variant="ghost"
                  onPress={() => setShowDeletePlayerModal(true)}
                >
                  <Icon as={UserMinus} className="text-error" size={24} />
                </Button>
              </>
            )
          }
        />
        {table && (
          <TableScoreBoard
            table={table}
            players={tablePlayers ?? []}
            games={games ?? []}
            onUpdateGame={handleUpdateGame}
            disabled={accessLevel === 'VIEW'}
          />
        )}
      </MahjongSection>
      {!isChipTable && (
        <ButtonGridSection>
          <Button
            className="w-full"
            disabled={accessLevel === 'VIEW'}
            onPress={handleDeleteGameClick}
          >
            <Text>{t('tablePage.buttonDeleteGame')}</Text>
          </Button>
          <Button className="w-full" disabled={accessLevel === 'VIEW'} onPress={handleDeleteTable}>
            <Text>{t('tablePage.buttonDeleteTable')}</Text>
          </Button>
        </ButtonGridSection>
      )}
      {showAddPlayerModal && (
        <MultiSelectorModal
          open={showAddPlayerModal}
          title={t('tablePage.modalAddPlayerTitle')}
          items={remainingPlayers ?? []}
          onConfirm={handleAddPlayer}
          onClose={() => setShowAddPlayerModal(false)}
        />
      )}
      {showDeletePlayerModal && (
        <SelectorModal
          title={t('tablePage.modalDeletePlayerTitle')}
          open={showDeletePlayerModal}
          items={tablePlayers}
          onSelect={handleDeletePlayer}
          onClose={() => setShowDeletePlayerModal(false)}
        />
      )}
      {showDeleteGameModal && (
        <SelectorModal
          title={t('tablePage.modalDeleteGameTitle')}
          open={showDeleteGameModal}
          items={games
            ?.filter((g): g is typeof g & { id: number } => g.id !== undefined)
            .map((g, index) => ({
              id: g.id,
              name: t('tablePage.gameLabel', { index: index + 1 }),
            }))}
          onSelect={handleDeleteGame}
          onClose={() => setShowDeleteGameModal(false)}
        />
      )}
    </MahjongContainer>
  );
}
