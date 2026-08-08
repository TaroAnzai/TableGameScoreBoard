import type { ReactNode } from 'react';
import { View } from 'react-native';

import { cn } from '@/lib/utils';

type Props = {
  children: ReactNode;
  className?: string;
};

const MahjongSection = ({ children, className }: Props) => {
  return (
    <View
      className={cn(
        'mb-6 flex-1 items-center justify-between rounded-2xl border border-outline bg-surface-variant p-4',
        className,
      )}
    >
      {children}
    </View>
  );
};

export default MahjongSection;
