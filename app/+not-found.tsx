import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import MahjongContainer from '@/components/MahjongContainer';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

export default function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <MahjongContainer>
      <View className="flex-1 items-center justify-center gap-4 px-4">
        <Text className="text-center text-2xl font-bold text-on-surface">
          {t('notFound.title')}
        </Text>
        <Text className="text-center text-on-surface-variant">{t('notFound.description')}</Text>
        <Button className="mt-2" onPress={() => router.replace('/')}>
          <Text>{t('notFound.toHome')}</Text>
        </Button>
      </View>
    </MahjongContainer>
  );
}
