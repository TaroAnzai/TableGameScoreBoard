// React 関連
import { router, useLocalSearchParams } from 'expo-router';
import { UserMinus, UserPlus } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator } from 'react-native';

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
import type { Player, ScoreInput, TablePlayerItem } from '@/src/api/generated/mahjongApi.schemas';
import {
  useCreateGame,
  useDeleteGame,
  useGetTableGames,
  useUpdateGame,
} from '@/src/hooks/useGames';
import {
  useAddTablePlayer,
  useDeleteTable,
  useDeleteTablePlayer,
  useGetTable,
  useGetTablePlayer,
  useUpdateTable,
} from '@/src/hooks/useTables';
import { useGetTournamentPlayers } from '@/src/hooks/useTournaments';
import { getAccessLevelstring, getResourceKey } from '@/src/utils/accessLevel_utils';

export default function TablePage() {
  const { alertDialog } = useAlertDialog();
  const { t } = useTranslation();
  //State系フック設定
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [showDeletePlayerModal, setShowDeletePlayerModal] = useState(false);
  const [showDeleteGameModal, setShowDeleteGameModal] = useState(false);
  //Mutation系フック
  const { mutateAsync: updateTable } = useUpdateTable();
  const {
    mutateAsync: deleteTable,
    isPending: isDeletingTable,
    isSuccess: isTableDeleteSuccess,
  } = useDeleteTable();
  const { mutateAsync: addTablePlayer, isPending: isAddingTablePlayer } = useAddTablePlayer();
  const { mutateAsync: deleteTablePlayer, isPending: isDeletingTablePlayer } =
    useDeleteTablePlayer();
  const { mutateAsync: createGame } = useCreateGame();
  const { mutateAsync: updateGame } = useUpdateGame();
  const { mutateAsync: deleteGame, isPending: isDeletingGame } = useDeleteGame();
  //Query系フック設定
  const { tableKey, parentTournamentKey, parentGroupKey } = useLocalSearchParams<{
    tableKey: string;
    parentTournamentKey?: string;
    parentGroupKey?: string;
  }>();
  const { table, isLoadingTable, isErrorTable, isFetchingTable, loadTable } = useGetTable(
    tableKey ?? '',
    { enabled: !!tableKey },
  );
  const {
    players: tablePlayers,
    isLoadingPlayers: isLoadingTablePlayers,
    isErrorPlayers: isErrorTablePlayers,
    isFetchingPlayers: isFetchingTablePlayers,
    loadPlayers: loadTablePlayers,
  } = useGetTablePlayer(tableKey ?? '', { enabled: !!tableKey });
  const { games, isLoadingGames, isErrorGames, isFetchingGames, loadGames } = useGetTableGames(
    tableKey ?? '',
    { enabled: !!tableKey },
  );

  const isChipTable = table?.type === 'CHIP';
  const tournamentKey = parentTournamentKey ?? getResourceKey(table?.parent_tournament_link);
  const {
    players: tournamentPlayers,
    isLoadingPlayers,
    isErrorPlayers,
    isFetchingPlayers,
    loadPlayers: loadTournamentPlayers,
  } = useGetTournamentPlayers(tournamentKey ?? '', { enabled: !!tournamentKey });
  const remainingPlayers = tournamentPlayers?.filter(
    (p) => !tablePlayers?.find((t) => t.id === p.id),
  );

  const accessLevel = getAccessLevelstring(table?.table_links);
  const parentUrl = parentTournamentKey ? `/tournament/${parentTournamentKey}` : null;
  const navigateToTournament = useCallback(() => {
    if (!tournamentKey) return;
    router.push({
      pathname: '/tournament/[tournamentKey]',
      params: {
        tournamentKey,
        ...(parentGroupKey ? { parentGroupKey } : {}),
      },
    });
  }, [parentGroupKey, tournamentKey]);
  useEffect(() => {
    if (isTableDeleteSuccess) {
      navigateToTournament();
    }
  }, [isTableDeleteSuccess, navigateToTournament]);

  // Early retrurn
  // --- ① 不正URL対応 ---
  if (!tableKey) {
    return (
      <MahjongContainer>
        <Text>{t('tablePage.errorInvalidTableKey')}</Text>
      </MahjongContainer>
    );
  }
  const handleTableNameChange = async (newTitle: string) => {
    await updateTable({ tableKey: tableKey!, tournamentKey, tableUpdate: { name: newTitle } });
  };
  // --- ④ データが存在しない ---
  if (!table && !isLoadingTable && !isErrorTable) {
    return (
      <MahjongContainer>
        <Text>{t('tablePage.errorTableNotFound')}</Text>
      </MahjongContainer>
    );
  }

  const isSectionError =
    isErrorTable || isErrorTablePlayers || isErrorGames || (!!tournamentKey && isErrorPlayers);

  const isSectionRetrying =
    isSectionError &&
    (isFetchingTable ||
      isFetchingTablePlayers ||
      isFetchingGames ||
      (!!tournamentKey && isFetchingPlayers));

  const retrySection = async () => {
    const requests: Promise<unknown>[] = [loadTable(), loadTablePlayers(), loadGames()];
    if (tournamentKey) requests.push(loadTournamentPlayers());
    await Promise.all(requests);
  };
  const handleAddPlayer = async (selectedPlayers: Player[]) => {
    const plyerIds: TablePlayerItem[] = selectedPlayers.map((p) => ({ player_id: p.id }));
    try {
      await addTablePlayer({ tableKey: tableKey!, tablePlayersItem: plyerIds });
      setShowAddPlayerModal(false);
    } catch {
      // The mutation hook shows the error. Keep the selection open for retrying.
    }
  };

  const handleDeletePlayer = async (player: Player) => {
    try {
      await deleteTablePlayer({ tableKey: tableKey!, playerId: player.id });
      setShowDeletePlayerModal(false);
    } catch {
      // The mutation hook shows the error. Keep the selector open for retrying.
    }
  };
  const handleUpdateGame = async (gameId: number | null, newScores: ScoreInput[]) => {
    if (!tableKey) return;
    if (gameId === null) {
      const gameCreate = { scores: newScores };
      await createGame({ tableKey: tableKey, tournamentKey, gameCreate: gameCreate });
    } else {
      const data = { scores: newScores };
      await updateGame({ tableKey: tableKey, tournamentKey, gameId: gameId, gameUpdate: data });
    }
  };

  const handleDeleteTable = async () => {
    const confirmed = await alertDialog({
      title: t('tablePage.alertDeleteTableTitle'),
      description: t('tablePage.alertDeleteTableDescription'),
    });
    if (!confirmed) return;
    try {
      await deleteTable({ tableKey: tableKey! });
    } catch {
      // The mutation hook shows the error. Keep this page available for retrying.
    }
  };

  const handleDeleteGameClick = () => {
    setShowDeleteGameModal(true);
  };
  const handleDeleteGame = async (game: { id: number }) => {
    const confirmed = await alertDialog({
      title: t('tablePage.alertDeleteGameTitle'),
      description: t('tablePage.alertDeleteGameDescription'),
    });
    if (!confirmed) return;
    try {
      await deleteGame({ tableKey: tableKey!, tournamentKey, gameId: game.id! });
      setShowDeleteGameModal(false);
    } catch {
      // The mutation hook shows the error. Keep the selector open for retrying.
    }
  };

  return (
    <MahjongContainer>
      <PageTitleBar
        title={table ? table.name : t('Common.loading')}
        onTitleChange={accessLevel === 'VIEW' ? undefined : handleTableNameChange}
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
        isError={isSectionError}
        isRetrying={isSectionRetrying}
        onRetry={() => void retrySection()}
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
                  accessibilityHint={
                    remainingPlayers?.length === 0 ? t('tablePage.noPlayersToAdd') : undefined
                  }
                  className="h-10 w-10 rounded-full p-0"
                  disabled={remainingPlayers?.length === 0 || isAddingTablePlayer}
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
                  accessibilityHint={
                    tablePlayers?.length === 0 ? t('tablePage.noPlayersToDelete') : undefined
                  }
                  className="h-10 w-10 rounded-full p-0"
                  disabled={tablePlayers?.length === 0 || isDeletingTablePlayer}
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
            variant="destructive"
            disabled={accessLevel === 'VIEW' || !games?.length || isDeletingGame}
            onPress={handleDeleteGameClick}
          >
            {isDeletingGame && <ActivityIndicator color="white" />}
            <Text>{isDeletingGame ? t('Common.processing') : t('tablePage.buttonDeleteGame')}</Text>
          </Button>
          <Button
            className="w-full"
            variant="destructive"
            disabled={accessLevel === 'VIEW' || isDeletingTable}
            onPress={handleDeleteTable}
          >
            {isDeletingTable && <ActivityIndicator color="white" />}
            <Text>
              {isDeletingTable ? t('Common.processing') : t('tablePage.buttonDeleteTable')}
            </Text>
          </Button>
        </ButtonGridSection>
      )}
      {showAddPlayerModal && (
        <MultiSelectorModal
          open={showAddPlayerModal}
          title={t('tablePage.modalAddPlayerTitle')}
          items={remainingPlayers ?? []}
          emptyMessage={t('tablePage.noPlayersToAdd')}
          onConfirm={handleAddPlayer}
          onClose={() => setShowAddPlayerModal(false)}
          isPending={isAddingTablePlayer}
          pendingText={t('Common.processing')}
        />
      )}
      {showDeletePlayerModal && (
        <SelectorModal
          title={t('tablePage.modalDeletePlayerTitle')}
          open={showDeletePlayerModal}
          items={tablePlayers}
          emptyMessage={t('tablePage.noPlayersToDelete')}
          onSelect={handleDeletePlayer}
          onClose={() => setShowDeletePlayerModal(false)}
          isPending={isDeletingTablePlayer}
          pendingText={t('Common.processing')}
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
          emptyMessage={t('tablePage.noGamesToDelete')}
          onSelect={handleDeleteGame}
          onClose={() => setShowDeleteGameModal(false)}
          isPending={isDeletingGame}
          pendingText={t('Common.processing')}
        />
      )}
    </MahjongContainer>
  );
}
