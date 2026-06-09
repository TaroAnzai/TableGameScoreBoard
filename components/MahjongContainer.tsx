// components/MahjongContainer.tsx
import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { StyleSheet } from 'react-native';

type Props = {
  children: ReactNode;
};

export const MahjongContainer = ({ children }: Props) => {
  return (
    <LinearGradient colors={['rgba(34,139,34,0.15)', 'rgba(0,100,0,0.1)']} style={styles.container}>
      {children}
    </LinearGradient>
  );
};
//background: linear-gradient(145deg, rgba(34, 139, 34, 0.15), rgba(0, 100, 0, 0.1));

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 500,
    padding: 10,
    borderWidth: 2,
    borderColor: 'rgba(144,238,144,0.3)',
    borderRadius: 24,
    overflow: 'hidden',
    alignSelf: 'center',
  },
});
