import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import GroupStats from '@/components/GroupStats';
import MahjongContainer from '@/components/MahjongContainer';
import PageTitleBar from '@/components/page_parts/PageTitleBar';
import { Text } from '@/components/ui/text';

const GroupPlayerStatsPage = () => {
  const { groupKey } = useLocalSearchParams<{ groupKey: string }>();
  const { t } = useTranslation();

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
      <GroupStats groupKey={groupKey} />
    </MahjongContainer>
  );
};

export default GroupPlayerStatsPage;
