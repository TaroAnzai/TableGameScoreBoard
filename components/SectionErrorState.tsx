import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

type SectionErrorStateProps = {
  message?: string;
  isRetrying?: boolean;
  onRetry?: () => void;
};

export const SectionErrorState = ({
  message,
  isRetrying = false,
  onRetry,
}: SectionErrorStateProps) => {
  const { t } = useTranslation();

  return (
    <View className="flex-1 items-center justify-center gap-4 p-8">
      <Text className="text-center text-muted-foreground">{message ?? t('Common.loadError')}</Text>
      {onRetry && (
        <Button disabled={isRetrying} onPress={onRetry}>
          {isRetrying && <ActivityIndicator />}
          <Text>{isRetrying ? t('Common.retrying') : t('Common.retry')}</Text>
        </Button>
      )}
    </View>
  );
};
