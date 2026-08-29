import { render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Platform } from 'react-native';

import RootLayout from '@/app/_layout';
import { EXTERNAL_ENTRY_PARAM } from '@/src/utils/externalNavigation';

const mockDispatch = jest.fn();
const mockReset = jest.fn((state) => ({ type: 'RESET', payload: state }));
let mockParams: Record<string, unknown> = {};
let mockSegments: string[] = [];
let mockResolvedTheme: 'light' | 'dark' = 'light';

jest.mock('@/src/global.css', () => ({}));

jest.mock('expo-router', () => {
  const { Text, View } = jest.requireActual('react-native');
  return {
    ErrorBoundary: () => null,
    Stack: ({ screenLayout }: any) => (
      <View>{screenLayout({ children: <Text>route-content</Text> })}</View>
    ),
    useGlobalSearchParams: () => mockParams,
    useNavigation: () => ({ dispatch: mockDispatch }),
    useSegments: () => mockSegments,
  };
});

jest.mock('expo-router/react-navigation', () => ({
  CommonActions: { reset: (...args: unknown[]) => mockReset(...args) },
}));

jest.mock('expo-status-bar', () => {
  const { Text } = jest.requireActual('react-native');
  return { StatusBar: ({ style }: { style: string }) => <Text>{`status:${style}`}</Text> };
});

jest.mock('@rn-primitives/portal', () => {
  const { Text } = jest.requireActual('react-native');
  return { PortalHost: () => <Text>portal-host</Text> };
});

jest.mock('react-native-toast-message', () => {
  const { Text } = jest.requireActual('react-native');
  return () => <Text>toast-host</Text>;
});

jest.mock('react-native-gesture-handler', () => {
  const { View } = jest.requireActual('react-native');
  return { GestureHandlerRootView: View };
});

jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');
  return { SafeAreaView: View };
});

jest.mock('@/components/BottomNavigation', () => {
  const { Text } = jest.requireActual('react-native');
  return { BottomNavigation: () => <Text>bottom-navigation</Text> };
});

jest.mock('@/components/common/AlertDialogProvider', () => {
  const React = jest.requireActual('react');
  return { AlertDialogProvider: ({ children }: React.PropsWithChildren) => <>{children}</> };
});

jest.mock('@/src/providers/LanguageProvider', () => {
  const React = jest.requireActual('react');
  return { LanguageProvider: ({ children }: React.PropsWithChildren) => <>{children}</> };
});

jest.mock('@/src/providers/ThemeProvider', () => {
  const React = jest.requireActual('react');
  return {
    ThemeProvider: ({ children }: React.PropsWithChildren) => <>{children}</>,
    useTheme: () => ({ resolvedTheme: mockResolvedTheme }),
  };
});

describe('RootLayout', () => {
  const originalPlatform = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = {};
    mockSegments = [];
    mockResolvedTheme = 'light';
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
  });

  afterAll(() => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: originalPlatform });
  });

  it('各Providerとホストを構成し、lightテーマではdark status barを表示する', async () => {
    await render(<RootLayout />);

    expect(screen.getByText('route-content')).toBeTruthy();
    expect(screen.getByText('status:dark')).toBeTruthy();
    expect(screen.getByText('bottom-navigation')).toBeTruthy();
    expect(screen.getByText('portal-host')).toBeTruthy();
    expect(screen.getByText('toast-host')).toBeTruthy();
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('外部entryではentry用パラメータを除外してnavigation stateをresetする', async () => {
    mockResolvedTheme = 'dark';
    mockSegments = ['tournament', '[tournamentKey]'];
    mockParams = {
      [EXTERNAL_ENTRY_PARAM]: 'entry-1',
      tournamentKey: 'tournament-key',
      access: 'VIEW',
    };
    const rendered = await render(<RootLayout />);

    expect(screen.getByText('status:light')).toBeTruthy();
    await waitFor(() => expect(mockDispatch).toHaveBeenCalledTimes(1));
    expect(mockReset).toHaveBeenCalledWith({
      index: 1,
      routes: [
        { name: 'index' },
        {
          name: 'tournament/[tournamentKey]',
          params: { tournamentKey: 'tournament-key', access: 'VIEW' },
        },
      ],
    });

    await rendered.rerender(<RootLayout />);
    expect(mockDispatch).toHaveBeenCalledTimes(1);
  });

  it('webではbottom navigationを表示せず、route未確定ならresetしない', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
    mockParams = { [EXTERNAL_ENTRY_PARAM]: 'entry-2' };
    mockSegments = [];
    await render(<RootLayout />);

    expect(screen.queryByText('bottom-navigation')).toBeNull();
    expect(mockDispatch).not.toHaveBeenCalled();
  });
});
