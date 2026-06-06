import React from 'react';
import { View } from 'react-native';
interface ButtonGridSectionProps {
  children?: React.ReactNode;
}
export const ButtonGridSection = ({ children }: ButtonGridSectionProps) => {
  return (
    <View>
      {React.Children.map(children, (child, index) => (
        <View key={index}>{child}</View>
      ))}
    </View>
  );
};
