import '@/src/global.css';
import '@/src/i18n/i18n';

import { PortalHost } from '@rn-primitives/portal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import Toast from 'react-native-toast-message';

import { AlertDialogProvider } from '@/components/common/AlertDialogProvider';
export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';
const queryClient = new QueryClient();
export default function RootLayout() {
  const { colorScheme } = useColorScheme();

  return (
    <QueryClientProvider client={queryClient}>
      <AlertDialogProvider>
        <StatusBar style="auto" />
        <Stack />
        <PortalHost />
        <Toast />
      </AlertDialogProvider>
    </QueryClientProvider>
  );
}
