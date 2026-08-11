import type { ReactNode } from 'react';
import { View } from 'react-native';

import { LoadingIndicator } from '@/components/LoadingIndicator';
import { cn } from '@/lib/utils';

export type MahjongSectionProps = {
  children: ReactNode;
  className?: string;
  isLoading?: boolean;
};

const MahjongSection = ({ children, className, isLoading = false }: MahjongSectionProps) => {
  return (
    <View
      className={cn(
        'mb-6 flex-1 items-center justify-between rounded-2xl border border-outline bg-surface-variant p-4',
        className,
      )}
    >
      {isLoading ? <LoadingIndicator /> : children}
    </View>
  );
};

export default MahjongSection;
