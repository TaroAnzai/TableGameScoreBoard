import type { PropsWithChildren } from 'react';
import { View } from 'react-native';

import { cn } from '@/lib/utils';

type Props = PropsWithChildren<{
  className?: string;
}>;

const MahjongContainer = ({ children, className }: Props) => {
  return (
    <View className="flex-1 bg-background">
      <View className={cn('w-full max-w-[720px] flex-1 self-center px-5 py-4', className)}>
        {children}
      </View>
    </View>
  );
};

export default MahjongContainer;
