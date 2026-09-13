import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

import { registerExternalNavigationBlock } from '@/src/utils/externalNavigationGuard';

export const useExternalNavigationGuard = (blocked: boolean) => {
  useFocusEffect(
    useCallback(() => {
      if (!blocked) return;

      return registerExternalNavigationBlock();
    }, [blocked]),
  );
};
