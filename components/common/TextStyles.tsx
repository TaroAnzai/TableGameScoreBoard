import React from 'react';
import { ScrollView, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

type HeadingProps = {
  children: React.ReactNode;
  className?: string;
};

export const MahjongSubTitle = ({ children, className }: HeadingProps) => {
  return <Text className={cn('text-lg', className)}>{children}</Text>;
};

type MahjongListProps = {
  children: React.ReactNode;
  className?: string;
  columns?: number;
};

export const MahjongList = ({ children, className, columns = 1 }: MahjongListProps) => {
  const width = `${100 / Math.max(columns, 1)}%` as `${number}%`;

  return (
    <ScrollView className="min-h-0 w-full flex-1">
      <View className={cn('w-full flex-row flex-wrap', className)}>
        {React.Children.map(children, (child) => (
          <View style={{ width: width }} className="p-1">
            {child}
          </View>
        ))}
      </View>
    </ScrollView>
  );
};
