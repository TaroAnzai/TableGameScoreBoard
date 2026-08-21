// src/pages/TournamentPage.jsx
import { router, useLocalSearchParams } from 'expo-router';
import { Pencil, TriangleAlert, UserMinus, UserPlus } from 'lucide-react-native';
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
import { SavePagePromptModal } from '@/components/SavePagePromptModal';
import { ScoreTable } from '@/components/ScoreTable';
import { SectionErrorState } from '@/components/SectionErrorState';
import SelectorModal from '@/components/SelectorModal';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { getUserFacingApiError } from '@/src/api/apiErrorPresentation';
import {
  type Player,
  TableType,
  type TournamentScoreMap,
  type TournamentUpdate,
} from '@/src/api/generated/mahjongApi.schemas';
import { useBackFallback } from '@/src/hooks/useBackFallback';
import { useMutationFeedback } from '@/src/hooks/useMutationFeedback';
import { useSavedPage } from '@/src/hooks/useSavedPage';
import { useCreateTable } from '@/src/hooks/useTables';
import {
  useAddTournamentPlayer,
  useDeleteTounamentsPlayer,
  useGetTournamentDashboard,
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
  const { showError, showSuccess } = useMutationFeedback();
  const handleBack = useBackFallback(router);
  const { tournamentKey, parentGroupKey } = useLocalSearchParams<{
    tournamentKey: string;
    parentGroupKey?: string;
  }>();
  //Query系フック設定
  const {
    dashboard,
    isLoadingDashboard,
    isErrorDashboard,
    isFetchingDashboard,
    dashboardError,
    loadDashboard,
  } = useGetTournamentDashboard(tournamentKey);
  const tournament = dashboard?.tournament;
  const players = dashboard?.participants;
  const tables = dashboard?.tables;
  const scoreMap = dashboard?.score_map;
  const candidatePlayers = dashboard?.available_group_players;

  //Mutation系フック
  const { mutateAsync: addTournamentPlayer, isPending: isAddingTournamentPlayer } =
    useAddTournamentPlayer();
  const { mutateAsync: deleteTournamentPlayer, isPending: isDeletingTournamentPlayer } =
    useDeleteTounamentsPlayer();
  const { mutate: createTable, isPending: isCreatingTable } = useCreateTable();
  const { mutateAsync: updateTournament, isPending: isUpdatingTournament } = useUpdateTournament();

  //ローカルステート

  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);

  const [showDeletePlayerModal, setShowDeletePlayerModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const isCreatingTableRef = useRef(false);

  const accessLevel = getAccessLevelstring(tournament?.tournament_links);
  const parentPageUrl = parentGroupKey ? `/group/${parentGroupKey}` : null;
  const {
    save: savePage,
    isSaving: isSavingPage,
    shouldPromptSave,
    dismissSavePrompt,
  } = useSavedPage({
    type: 'tournament',
    key: tournamentKey,
    name: tournament?.name,
    accessLevel,
    parentGroupName: dashboard?.parent?.group?.name,
    isDirectView: !parentGroupKey,
  });

  const tournamentErrorPresentation = getUserFacingApiError(dashboardError, {
    messageOverrides: {
      notFound: t('tournamentPage.tournamentNotFound'),
    },
    unknownMessage: t('tournamentPage.tournamentLoadError'),
  });
  const sectionErrorPresentation = getUserFacingApiError(dashboardError);

  const retrySection = async () => {
    await loadDashboard();
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
    try {
      await addTournamentPlayer({
        tournamentKey: tournamentKey!,
        players: selectedPlayers,
      });
      setShowAddPlayerModal(false);
    } catch {
      // The mutation hooks show the error. Keep the selection open for retrying.
    }
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
    try {
      await deleteTournamentPlayer(payload);
      setShowDeletePlayerModal(false);
    } catch {
      // The mutation hook shows the error. Keep the selector open for retrying.
    }
  };
  const handleTitleChange = async (newName: string) => {
    await updateTournament({
      tournamentKey,
      groupKey: parentGroupKey,
      tournament: { name: newName },
    });
  };
  const handleUpdateTournament = async (updates: TournamentUpdate) => {
    try {
      await updateTournament({
        tournamentKey: tournamentKey!,
        groupKey: parentGroupKey,
        tournament: updates,
      });
      setShowEditModal(false);
    } catch {
      // The mutation hook shows the error. Keep the form open for retrying.
    }
  };
  const handleRateChange = async (newRate: number) => {
    await updateTournament({
      tournamentKey: tournamentKey!,
      groupKey: parentGroupKey,
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
        ...(parentGroupKey ? { parentGroupKey } : {}),
      },
    });
  };
  const saveTournamentPage = async () => {
    try {
      await savePage();
      showSuccess(t('savedLinks.saveSuccess', { pageType: t('titleBar.tournament') }));
    } catch (error) {
      showError({
        title: t('savedLinks.saveErrorTitle'),
        error,
        fallback: t('savedLinks.saveError'),
      });
      throw error;
    }
  };

  const TitleWithModal = ({
    onPress,
    onLongPress,
  }: {
    onPress?: () => void;
    onLongPress?: () => void;
  }) =>
    onPress || onLongPress ? (
      <Pressable
        accessibilityLabel={
          onPress ? t('Common.editTitle', { title: tournament?.name }) : tournament?.name
        }
        className="mahjong-editable-title flex-row items-center gap-2"
        onLongPress={onLongPress}
        onPress={onPress}
      >
        <Text>{tournament?.name}</Text>
        {onPress && <Icon as={Pencil} className="text-on-surface-variant" size={18} />}
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

  if (isLoadingDashboard) {
    return (
      <MahjongContainer>
        <LoadingIndicator text={t('tournamentPage.loading')} />
      </MahjongContainer>
    );
  }

  if (isErrorDashboard || !tournament) {
    return (
      <MahjongContainer>
        <SectionErrorState
          message={tournamentErrorPresentation.message}
          isRetrying={isFetchingDashboard}
          onRetry={tournamentErrorPresentation.canRetry ? () => void loadDashboard() : undefined}
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
        onTitleLongPress={() => void saveTournamentPage().catch(() => undefined)}
        TitleComponent={TitleWithModal}
        onBackPress={handleBack}
        parentUrl={parentPageUrl}
      />
      <SavePagePromptModal
        open={shouldPromptSave}
        isSaving={isSavingPage}
        onSave={saveTournamentPage}
        onClose={dismissSavePrompt}
      />
      <View className="mb-2 flex-row items-center justify-center">
        {tournament && (
          <EditableRate
            key={`${tournament.id}-${tournament.rate}`}
            rate={tournament.rate ?? 1}
            label={t('tournamentPage.rate')}
            onChange={accessLevel === 'VIEW' ? undefined : handleRateChange}
          />
        )}
      </View>

      <MahjongSection
        className="justify-start"
        isLoading={isLoadingDashboard}
        isError={isErrorDashboard}
        isRetrying={isErrorDashboard && isFetchingDashboard}
        errorMessage={sectionErrorPresentation.message}
        onRetry={sectionErrorPresentation.canRetry ? () => void retrySection() : undefined}
      >
        <MahjongSectionHeader
          title={t('tournamentPage.sectionTournamentScore')}
          actions={
            accessLevel !== 'VIEW' && (
              <>
                <Button
                  accessibilityLabel={t('groupPage.modalCreateTournamentTitle')}
                  className="h-10 w-10 rounded-full p-0"
                  disabled={isAddingTournamentPlayer}
                  size="icon"
                  variant="ghost"
                  onPress={handleOpenAddPlayerModal}
                >
                  <Icon as={UserPlus} className="text-on-surface" size={24} />
                </Button>
                <Button
                  accessibilityLabel={t('groupPage.modalDeleteTournamentTitle')}
                  className="h-10 w-10 rounded-full p-0"
                  disabled={isDeletingTournamentPlayer}
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
          isPending={isAddingTournamentPlayer}
          pendingText={t('Common.processing')}
        />
      )}

      {showDeletePlayerModal && (
        <SelectorModal
          title={t('tournamentPage.modalDeletePlayerTitle')}
          open={showDeletePlayerModal}
          items={players ?? []}
          onSelect={handleDeletePlayer}
          onClose={() => setShowDeletePlayerModal(false)}
          isPending={isDeletingTournamentPlayer}
          pendingText={t('Common.processing')}
        />
      )}

      {showEditModal && tournament && (
        <EditTournamentModal
          open={showEditModal}
          tournament={tournament}
          onConfirm={handleUpdateTournament}
          onClose={() => setShowEditModal(false)}
          isPending={isUpdatingTournament}
          pendingText={t('Common.processing')}
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
  onChange?: (rate: number) => void | Promise<void>;
}) => {
  const { t } = useTranslation();
  const [editedRate, setEditedRate] = useState<number | ''>(rate);
  const [isSaving, setIsSaving] = useState(false);
  const submittedRef = useRef(false);
  const isSavingRef = useRef(false);

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

  const handleRateSubmit = async () => {
    if (isSavingRef.current) return;
    submittedRef.current = true;
    if (editedRate === '' || Number(editedRate) <= 0) {
      setEditedRate(rate);
      return;
    }
    if (editedRate === rate) {
      return;
    }
    const newRate = Number(editedRate);
    isSavingRef.current = true;
    setIsSaving(true);
    try {
      await onChange?.(newRate);
    } catch {
      // The mutation hook shows the error. Keep the edited value for retrying.
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
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
            testID="tournament-rate-input"
            className="w-20 text-right"
            keyboardType="numeric"
            value={editedRate.toString()}
            editable={!isSaving}
            selectTextOnFocus
            onChangeText={handleRateChange}
            onBlur={() => {
              handleRateBlur();
            }}
            onSubmitEditing={() => void handleRateSubmit()}
            submitBehavior="blurAndSubmit"
          />
        ) : (
          <Text>{rate.toLocaleString()}</Text>
        )}
        {isSaving && <ActivityIndicator accessibilityLabel={t('Common.processing')} />}
      </View>
    </Pressable>
  );
};
export default TournamentPage;
