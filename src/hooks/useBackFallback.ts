import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { BackHandler, Platform } from 'react-native';

import { type BackNavigation,goBackOrFallback } from '@/src/utils/navigation';

export const useBackFallback = (navigation: BackNavigation) => {
  const goBack = useCallback(() => goBackOrFallback(navigation), [navigation]);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') {
        return;
      }

      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        goBack();
        return true;
      });

      return () => subscription.remove();
    }, [goBack]),
  );

  return goBack;
};
