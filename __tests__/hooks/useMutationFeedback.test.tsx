import { act, renderHook } from '@testing-library/react-native';
import Toast from 'react-native-toast-message';

import { getMutationErrorMessage, useMutationFeedback } from '@/src/hooks/useMutationFeedback';

const mockAlertDialog = jest.fn();

jest.mock('@/components/common/AlertDialogProvider', () => ({
  useAlertDialog: () => ({ alertDialog: mockAlertDialog }),
}));

jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
}));

describe('useMutationFeedback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('成功メッセージと詳細を画面下部のToastへ渡す', async () => {
    const { result } = await renderHook(() => useMutationFeedback());

    await act(async () => {
      result.current.showSuccess('保存しました', '大会名を更新しました');
    });

    expect(Toast.show).toHaveBeenCalledWith({
      type: 'success',
      text1: '保存しました',
      text2: '大会名を更新しました',
      position: 'bottom',
    });
  });

  it('APIエラーを利用者向け文言へ変換し、キャンセルなしのdialogを表示する', async () => {
    const { result } = await renderHook(() => useMutationFeedback());

    await act(async () => {
      result.current.showError({
        title: '保存できませんでした',
        error: new Error('internal detail'),
        fallback: '時間をおいて再試行してください',
      });
    });

    expect(mockAlertDialog).toHaveBeenCalledWith({
      title: '保存できませんでした',
      description: '時間をおいて再試行してください',
      showCancelButton: false,
    });
  });

  it('指定メッセージをAPIエラーやfallbackより優先する', () => {
    expect(getMutationErrorMessage(new Error('internal'), 'fallback', '入力を確認してください')).toBe(
      '入力を確認してください',
    );
  });
});
