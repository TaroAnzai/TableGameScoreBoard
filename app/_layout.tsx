import '@/src/global.css';
import '@/src/i18n/i18n';

import { PortalHost } from '@rn-primitives/portal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { BottomNavigation } from '@/components/BottomNavigation';
import { AlertDialogProvider } from '@/components/common/AlertDialogProvider';
import { shouldRetryApiRequest } from '@/src/api/apiError';
import { LanguageProvider } from '@/src/providers/LanguageProvider';
import { ThemeProvider, useTheme } from '@/src/providers/ThemeProvider';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: shouldRetryApiRequest,
    },
  },
});

const RootContent = () => {
  const { resolvedTheme } = useTheme();

  return (
    <AlertDialogProvider>
      <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
      <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
        <View className="flex-1">
          <Stack screenOptions={{ headerShown: false }} />
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
