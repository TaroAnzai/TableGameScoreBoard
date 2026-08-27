import '@/src/global.css';
import '@/src/i18n/i18n';

import { PortalHost } from '@rn-primitives/portal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useGlobalSearchParams, useNavigation, useSegments } from 'expo-router';
import { CommonActions } from 'expo-router/react-navigation';
import { StatusBar } from 'expo-status-bar';
import type { PropsWithChildren } from 'react';
import { useEffect, useRef } from 'react';
import { Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { BottomNavigation } from '@/components/BottomNavigation';
import { AlertDialogProvider } from '@/components/common/AlertDialogProvider';
import { shouldRetryApiRequest } from '@/src/api/apiError';
import { LanguageProvider } from '@/src/providers/LanguageProvider';
import { ThemeProvider, useTheme } from '@/src/providers/ThemeProvider';
import { EXTERNAL_ENTRY_PARAM } from '@/src/utils/externalNavigation';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: shouldRetryApiRequest,
    },
  },
});

const ExternalNavigationReset = ({ children }: PropsWithChildren) => {
  const navigation = useNavigation();
  const segments = useSegments();
  const params = useGlobalSearchParams();
  const handledEntry = useRef<string | null>(null);
  const externalEntry = params[EXTERNAL_ENTRY_PARAM];
  const routeName = segments.join('/');

  useEffect(() => {
    if (
      typeof externalEntry !== 'string' ||
      !routeName ||
      handledEntry.current === externalEntry
    ) {
      return;
    }

    handledEntry.current = externalEntry;
    const routeParams = Object.fromEntries(
      Object.entries(params).filter(([key]) => key !== EXTERNAL_ENTRY_PARAM),
    );

    navigation.dispatch(
      CommonActions.reset({
        index: 1,
        routes: [{ name: 'index' }, { name: routeName, params: routeParams }],
      }),
    );

  }, [externalEntry, navigation, params, routeName]);

  return <>{children}</>;
};

const RootContent = () => {
  const { resolvedTheme } = useTheme();

  return (
    <AlertDialogProvider>
      <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
      <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
        <View className="flex-1">
          <Stack
            screenLayout={({ children }) => (
              <ExternalNavigationReset>{children}</ExternalNavigationReset>
            )}
            screenOptions={{ headerShown: false }}
          />
        </View>
        {Platform.OS !== 'web' && <BottomNavigation />}
      </SafeAreaView>
      <PortalHost />
      <Toast />
    </AlertDialogProvider>
  );
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <LanguageProvider>
            <RootContent />
          </LanguageProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
