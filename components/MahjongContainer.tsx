import { ReactNode } from 'react';
import { View } from 'react-native';

import { cn } from '@/lib/utils';
type Props = {
  children: ReactNode;
  className?: string;
};
const MahjongContainer = (options: Props) => {
  return (
    <View
      className={cn(
        'flex-1 bg-green-900 border-2 border-green-300 rounded-xl  p-2 m-2',
        options.className,
      )}
    >
      {options.children}
    </View>
  );
};

export default MahjongContainer;
