import { useTranslation } from 'react-i18next';

import MahjongSection from '@/components/MahjongSection';
import { PlayerStatsTable } from '@/components/PlayerStatsTable';
import { Text } from '@/components/ui/text';
import { getUserFacingApiError } from '@/src/api/apiErrorPresentation';
import { type PlayerStatsPeriodOptions, useGetPlayerStats } from '@/src/hooks/useScore';

type GroupStatsProps = {
  groupKey: string;
} & PlayerStatsPeriodOptions;

const GroupStats = ({ groupKey, startDate, endDate }: GroupStatsProps) => {
  const {
    playerStats,
    isLoadingPlayerStats,
    isErrorPlayerStats,
    isFetchingPlayerStats,
    playerStatsError,
    loadPlayerStats,
  } = useGetPlayerStats(groupKey, { startDate, endDate });

  const { t } = useTranslation();
  const errorPresentation = getUserFacingApiError(playerStatsError, {
    messageOverrides: {
      notFound: t('groupPage.groupNotFound'),
    },
  });
  return (
    <MahjongSection
      isLoading={isLoadingPlayerStats && !isErrorPlayerStats}
      isError={isErrorPlayerStats}
      isRetrying={isErrorPlayerStats && isFetchingPlayerStats}
      errorMessage={errorPresentation.message}
      onRetry={errorPresentation.canRetry ? () => void loadPlayerStats() : undefined}
    >
      {playerStats?.players?.length ? (
        <PlayerStatsTable playerStatsList={playerStats.players} />
      ) : (
        <Text>{t('statsPage.empty')}</Text>
      )}
    </MahjongSection>
  );
};

export default GroupStats;
