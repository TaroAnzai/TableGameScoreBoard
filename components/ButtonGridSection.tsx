import React from 'react';
import { StyleSheet, View } from 'react-native';

interface ButtonGridSectionProps {
  children?: React.ReactNode;
}

export const ButtonGridSection = ({ children }: ButtonGridSectionProps) => {
  const childArray = React.Children.toArray(children);

  return (
    <View style={styles.gridSection}>
      {childArray.map((child, index) => {
        const isLastOdd = index === childArray.length - 1 && childArray.length % 2 === 1;

        return (
          <View key={index} style={[styles.gridItem, isLastOdd && styles.gridItemFull]}>
            {child}
          </View>
        );
      })}
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
