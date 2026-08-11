import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

type Props = {
  className?: string;
  text?: string;
};

export const LoadingIndicator = ({ className, text }: Props) => {
  const { t } = useTranslation();
  const loadingText = text ?? t('Common.loading');

  return (
    <View className={cn('flex-1 items-center justify-center gap-3 p-8', className)}>
      <ActivityIndicator accessibilityLabel={loadingText} size="large" />
      <Text className="text-muted-foreground">{loadingText}</Text>
    </View>
  );
};
