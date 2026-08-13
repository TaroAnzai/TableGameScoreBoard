import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

interface MahjongListItemProps {
  title: string;
  badge?: string;
  accessories?: ReactNode[];
  leading?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  className?: string;
}

export const MahjongListItem = ({
  title,
  badge,
  accessories = [],
  leading,
  trailing,
  onPress,
  disabled = false,
  className,
}: MahjongListItemProps) => {
  const content = (
    <View
      className={cn(
        'flex-row items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3',
        disabled && 'opacity-50',
        className,
      )}
    >
      {leading && <View className="shrink-0">{leading}</View>}

      <View className="w-full">
        <View className="flex-row gap-3 justify-between">
          <Text className="grow font-semibold text-foreground" numberOfLines={1}>
            {title}
          </Text>

          {badge && (
            <Badge variant="outline">
              <Text>{badge}</Text>
            </Badge>
          )}
        </View>

        {accessories.length > 0 && (
          <View className="mt-1.5 flex-row flex-wrap items-center gap-x-4 gap-y-1">
            {accessories.map((accessory, index) => (
              <View key={index} className="flex-row items-center">
                {typeof accessory === 'string' || typeof accessory === 'number' ? (
                  <Text className="text-sm text-on-surface-variant">{accessory}</Text>
                ) : (
                  accessory
                )}
              </View>
            ))}
          </View>
        )}
      </View>

      {trailing && <View className="shrink-0">{trailing}</View>}
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className="active:opacity-70"
      accessibilityRole="button"
    >
      {content}
    </Pressable>
  );
};
