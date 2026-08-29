import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import React, { type PropsWithChildren } from 'react';

import i18n from '@/src/i18n/i18n';
import { LanguageProvider, useLanguage } from '@/src/providers/LanguageProvider';

let mockLanguageCode: string | null = 'en';
const mockStorage = new Map<string, string>();

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    clear: jest.fn(async () => mockStorage.clear()),
    getItem: jest.fn(async (key: string) => mockStorage.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => mockStorage.set(key, value)),
  },
}));

jest.mock('expo-localization', () => ({
  useLocales: () => [{ languageCode: mockLanguageCode }],
}));

const wrapper = ({ children }: PropsWithChildren) => (
  <LanguageProvider>{children}</LanguageProvider>
);

describe('LanguageProvider', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    mockLanguageCode = 'en';
    mockStorage.clear();
    Object.defineProperty(i18n, 'resolvedLanguage', { configurable: true, value: 'ja' });
    jest.spyOn(i18n, 'changeLanguage').mockResolvedValue(i18n as never);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('systemモードでは端末言語を解決し、i18nへ反映する', async () => {
    const { result, unmount } = await renderHook(() => useLanguage(), { wrapper });

    expect(result.current.languageMode).toBe('system');
    expect(result.current.resolvedLanguage).toBe('en');
    await waitFor(() => expect(i18n.changeLanguage).toHaveBeenCalledWith('en'));
    await unmount();
  });

  it('保存済み言語を復元し、言語変更を永続化する', async () => {
    mockStorage.set('languageMode', 'ja');
    const { result, unmount } = await renderHook(() => useLanguage(), { wrapper });

    await waitFor(() => expect(result.current.languageMode).toBe('ja'));
    expect(result.current.resolvedLanguage).toBe('ja');

    await act(async () => {
      await result.current.setLanguageMode('en');
    });
    expect(mockStorage.get('languageMode')).toBe('en');
    expect(result.current.resolvedLanguage).toBe('en');
    await unmount();
  });

  it('不正な保存値とストレージ読込失敗ではsystemモードを維持する', async () => {
    mockStorage.set('languageMode', 'unsupported');
    const invalid = await renderHook(() => useLanguage(), { wrapper });
    await waitFor(() => expect(invalid.result.current.languageMode).toBe('system'));
    await invalid.unmount();

    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('storage failed'));
    const failed = await renderHook(() => useLanguage(), { wrapper });
    await waitFor(() => expect(failed.result.current.languageMode).toBe('system'));
    await failed.unmount();
  });

  it('Provider外で利用すると利用方法を示すエラーになる', async () => {
    await expect(renderHook(() => useLanguage())).rejects.toThrow(
      'useLanguage must be used within a LanguageProvider',
    );
  });
});
