import { ReactNode } from 'react';
import { View } from 'react-native';

import { cn } from '@/lib/utils';
type Props = {
  children: ReactNode;
  className?: string;
};
const MahjongSection = (options: Props) => {
  return (
    <View
      className={cn(
        'bg-green-700 mb-6 items-center justify-between rounded-2xl border border-green-300 px-2.5 py-4',
        options.className,
      )}
    >
      {options.children}
    </View>
  );
};

export default MahjongSection;
