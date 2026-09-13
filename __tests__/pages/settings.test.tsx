import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import SettingsPage from '@/app/settings';
import i18n from '@/src/i18n/i18n';

const mockBack = jest.fn();
const mockCanGoBack = jest.fn(() => true);
const mockReplace = jest.fn();
const mockSetThemeMode = jest.fn();
const mockSetLanguageMode = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, canGoBack: mockCanGoBack, replace: mockReplace }),
}));
jest.mock('@/src/providers/ThemeProvider', () => ({
  useTheme: () => ({ themeMode: 'system', setThemeMode: mockSetThemeMode }),
}));
jest.mock('@/src/providers/LanguageProvider', () => ({
  useLanguage: () => ({ languageMode: 'ja', setLanguageMode: mockSetLanguageMode }),
}));

describe('設定ページ', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    mockCanGoBack.mockReturnValue(true);
    await i18n.changeLanguage('ja');
  });

  it('現在のテーマと言語を選択状態で表示する', async () => {
    await render(<SettingsPage />);

    const selected = screen
      .getAllByRole('button')
      .filter((button) => button.props.accessibilityState?.selected);
    expect(selected).toHaveLength(2);
  });

  it('テーマを変更する', async () => {
    await render(<SettingsPage />);
    await act(async () => {
      fireEvent.press(screen.getByText('ダーク'));
    });
    expect(mockSetThemeMode).toHaveBeenCalledWith('dark');
  });

  it('言語を変更する', async () => {
    await render(<SettingsPage />);
    await act(async () => {
      fireEvent.press(screen.getByText('English'));
    });
    expect(mockSetLanguageMode).toHaveBeenCalledWith('en');

    await act(async () => {
      fireEvent.press(screen.getByText('简体中文'));
    });
    expect(mockSetLanguageMode).toHaveBeenCalledWith('zh-CN');
  });

  it('戻るボタンで前画面へ戻る', async () => {
    await render(<SettingsPage />);
    fireEvent.press(screen.getByLabelText('前の画面に戻る'));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('履歴がない場合は戻るボタンでホームへ移動する', async () => {
    mockCanGoBack.mockReturnValue(false);
    await render(<SettingsPage />);

    fireEvent.press(screen.getByLabelText('前の画面に戻る'));

    expect(mockReplace).toHaveBeenCalledWith('/');
    expect(mockBack).not.toHaveBeenCalled();
  });
});
