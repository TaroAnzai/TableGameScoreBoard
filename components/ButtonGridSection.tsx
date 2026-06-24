import React from 'react';
import { StyleSheet, View } from 'react-native';

interface ButtonGridSectionProps {
  children?: React.ReactNode;
}

export const ButtonGridSection = ({ children }: ButtonGridSectionProps) => {
  const items = React.Children.toArray(children);

  return (
    <View className="bg-green-700 mb-6 items-center justify-between rounded-2xl border border-green-300 px-2.5 py-4">
      <View className="w-full gap-3">
        {items.reduce<React.ReactNode[]>((rows, child, index) => {
          if (index % 2 === 0) {
            const isLastOdd = index === items.length - 1;

            rows.push(
              <View key={index} className="flex-row gap-3">
                <View className="flex-1 items-center">{child}</View>

                {!isLastOdd && items[index + 1] && (
                  <View className="flex-1 items-center">{items[index + 1]}</View>
                )}
              </View>,
            );
          }

          return rows;
        }, [])}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  gridSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: '48%',
    alignItems: 'center',
  },
  gridItemFull: {
    width: '100%',
  },
});
