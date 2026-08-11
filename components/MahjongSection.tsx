import type { ReactNode } from 'react';
import { View } from 'react-native';

import { LoadingIndicator } from '@/components/LoadingIndicator';
import { SectionErrorState } from '@/components/SectionErrorState';
import { cn } from '@/lib/utils';

export type MahjongSectionProps = {
  children: ReactNode;
  className?: string;
  isLoading?: boolean;
  isError?: boolean;
  isRetrying?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
};

const MahjongSection = ({
  children,
  className,
  isLoading = false,
  isError = false,
  isRetrying = false,
  errorMessage,
  onRetry,
}: MahjongSectionProps) => {
  return (
    <View
      className={cn(
        'mb-6 flex-1 items-center justify-between rounded-2xl border border-outline bg-surface-variant p-4',
        className,
      )}
    >
      {isLoading ? (
        <LoadingIndicator />
      ) : isError ? (
        <SectionErrorState message={errorMessage} isRetrying={isRetrying} onRetry={onRetry} />
      ) : (
        children
      )}
    </View>
  );
};

export default MahjongSection;
