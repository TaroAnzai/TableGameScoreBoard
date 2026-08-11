import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import SettingsPage from '@/app/settings';

const mockBack = jest.fn();
const mockSetThemeMode = jest.fn();
const mockSetLanguageMode = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack }),
}));
jest.mock('@/src/providers/ThemeProvider', () => ({
  useTheme: () => ({ themeMode: 'system', setThemeMode: mockSetThemeMode }),
}));
jest.mock('@/src/providers/LanguageProvider', () => ({
  useLanguage: () => ({ languageMode: 'ja', setLanguageMode: mockSetLanguageMode }),
}));

describe('設定ページ', () => {
  beforeEach(() => jest.clearAllMocks());

  it('現在のテーマと言語を選択状態で表示する', async () => {
    await render(<SettingsPage />);

    const selected = screen
      .getAllByRole('button')
      .filter((button) => button.props.accessibilityState?.selected);
    expect(selected).toHaveLength(2);
  });

  it('テーマを変更する', async () => {
    await render(<SettingsPage />);
    fireEvent.press(screen.getByText('ダーク'));
    expect(mockSetThemeMode).toHaveBeenCalledWith('dark');
  });

  it('言語を変更する', async () => {
    await render(<SettingsPage />);
    fireEvent.press(screen.getByText('English'));
    expect(mockSetLanguageMode).toHaveBeenCalledWith('en');
  });

  it('戻るボタンで前画面へ戻る', async () => {
    await render(<SettingsPage />);
    fireEvent.press(screen.getByLabelText('前の画面に戻る'));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
