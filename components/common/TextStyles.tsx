import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

type HeadingProps = {
  children: React.ReactNode;
  className?: string;
};
type ListItemProps = {
  children: string;
  className?: string;
};

export const MahjongSubTitle = ({ children, className }: HeadingProps) => {
  return <Text className={cn('text-lg', className)}>{children}</Text>;
};

export const MahjongList = ({ children, className }: HeadingProps) => {
  return <View className={cn('gap-2', className)}>{children}</View>;
};
export const MahjongListItem = ({ children, className }: ListItemProps) => {
  return (
    <View>
      <Text className={cn('', className)}>{children}</Text>
    </View>
  );
};
