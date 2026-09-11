import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import React, { type PropsWithChildren } from 'react';
import * as ReactNative from 'react-native';

import { ThemeProvider, useTheme } from '@/src/providers/ThemeProvider';

let mockColorScheme: 'light' | 'dark' | 'unspecified' = 'light';
const mockStorage = new Map<string, string>();

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    clear: jest.fn(async () => mockStorage.clear()),
    getItem: jest.fn(async (key: string) => mockStorage.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => mockStorage.set(key, value)),
  },
}));

const wrapper = ({ children }: PropsWithChildren) => <ThemeProvider>{children}</ThemeProvider>;

describe('ThemeProvider', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    mockColorScheme = 'light';
    mockStorage.clear();
    jest.spyOn(ReactNative, 'useColorScheme').mockImplementation(() => mockColorScheme);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each([
    ['light', 'light'],
    ['dark', 'dark'],
    ['unspecified', 'light'],
  ] as const)('systemモードで端末配色 %s を %s として解決する', async (scheme, expected) => {
    mockColorScheme = scheme;
    const { result, unmount } = await renderHook(() => useTheme(), { wrapper });

    expect(result.current.themeMode).toBe('system');
    expect(result.current.resolvedTheme).toBe(expected);
    await unmount();
  });

  it('保存済みテーマを復元し、明示的なテーマ変更を永続化する', async () => {
    mockStorage.set('themeMode', 'dark');
    const { result, unmount } = await renderHook(() => useTheme(), { wrapper });

    await waitFor(() => expect(result.current.resolvedTheme).toBe('dark'));
    await act(async () => {
      await result.current.setThemeMode('light');
    });

    expect(mockStorage.get('themeMode')).toBe('light');
    expect(result.current.resolvedTheme).toBe('light');
    await unmount();
  });

  it('不正な保存値と読込失敗ではsystemモードを維持する', async () => {
    mockStorage.set('themeMode', 'sepia');
    const invalid = await renderHook(() => useTheme(), { wrapper });
    await waitFor(() => expect(invalid.result.current.themeMode).toBe('system'));
    await invalid.unmount();

    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('storage failed'));
    const failed = await renderHook(() => useTheme(), { wrapper });
    await waitFor(() => expect(failed.result.current.themeMode).toBe('system'));
    await failed.unmount();
  });

  it('Provider外で利用すると利用方法を示すエラーになる', async () => {
    await expect(renderHook(() => useTheme())).rejects.toThrow(
      'useTheme must be used within a ThemeProvider',
    );
  });
});
