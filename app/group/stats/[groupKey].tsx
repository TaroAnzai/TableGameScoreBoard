import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import MahjongContainer from '@/components/MahjongContainer';
import MahjongSection from '@/components/MahjongSection';
import PageTitleBar from '@/components/page_parts/PageTitleBar';
import { PlayerStatsTable } from '@/components/PlayerStatsTable';
import { useGetPlayerStats } from '@/src/hooks/useScore';

const GroupPlayerStatsPage = () => {
  const { groupKey } = useLocalSearchParams<{ groupKey: string }>();
  const { t } = useTranslation();
  const { playerStats, isLoadingPlayerStats } = useGetPlayerStats(groupKey);
  if (!groupKey)
    return <div className="mahjong-container">{t('statsPage.errorInvalidGroupKey')}</div>;
  return (
    <MahjongContainer>
      <PageTitleBar
        title={t('statsPage.pageTitle')}
        parentUrl={`/group/${groupKey}`}
      ></PageTitleBar>
      <MahjongSection isLoading={isLoadingPlayerStats || !playerStats?.players}>
        {playerStats?.players && <PlayerStatsTable playerStatsList={playerStats.players} />}
      </MahjongSection>
    </MahjongContainer>
  );
};

export default GroupPlayerStatsPage;
