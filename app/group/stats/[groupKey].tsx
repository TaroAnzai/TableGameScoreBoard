import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import MahjongContainer from '@/components/MahjongContainer';
import MahjongSection from '@/components/MahjongSection';
import PageTitleBar from '@/components/page_parts/PageTitleBar';
import { PlayerStatsTable } from '@/components/PlayerStatsTable';
import { Text } from '@/components/ui/text';
import { useGetPlayerStats } from '@/src/hooks/useScore';

const GroupPlayerStatsPage = () => {
  const { groupKey } = useLocalSearchParams<{ groupKey: string }>();
  const { t } = useTranslation();
  const {
    playerStats,
    isLoadingPlayerStats,
    isErrorPlayerStats,
    isFetchingPlayerStats,
    loadPlayerStats,
  } = useGetPlayerStats(groupKey);
  if (!groupKey)
    return (
      <MahjongContainer>
        <Text>{t('statsPage.errorInvalidGroupKey')}</Text>
      </MahjongContainer>
    );
  return (
    <MahjongContainer>
      <PageTitleBar
        title={t('statsPage.pageTitle')}
        parentUrl={`/group/${groupKey}`}
      ></PageTitleBar>
      <MahjongSection
        isLoading={isLoadingPlayerStats && !isErrorPlayerStats}
        isError={isErrorPlayerStats}
        isRetrying={isErrorPlayerStats && isFetchingPlayerStats}
        onRetry={() => void loadPlayerStats()}
      >
        {playerStats?.players?.length ? (
          <PlayerStatsTable playerStatsList={playerStats.players} />
        ) : (
          <Text>{t('statsPage.empty')}</Text>
        )}
      </MahjongSection>
    </MahjongContainer>
  );
};

export default GroupPlayerStatsPage;
