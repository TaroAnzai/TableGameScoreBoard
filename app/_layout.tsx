import '@/src/global.css';
import '@/src/i18n/i18n';

import { PortalHost } from '@rn-primitives/portal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { AlertDialogProvider } from '@/components/common/AlertDialogProvider';
import { Text } from '@/components/ui/text';
export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';
const queryClient = new QueryClient();
export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AlertDialogProvider>
        <StatusBar style="auto" />
        <SafeAreaView className="flex-1 bg-green-300 ">
          <Stack screenOptions={{ headerShown: false }} />
        </SafeAreaView>
        <PortalHost />
        <Toast />
      </AlertDialogProvider>
    </QueryClientProvider>
  );
}
