import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import {
  AlertDialogProvider,
  useAlertDialog,
} from '@/components/common/AlertDialogProvider';

let mockOnOpenChange: ((open: boolean) => void) | undefined;

jest.mock('@/components/ui/alert-dialog', () => {
  const ReactNative = jest.requireActual('react-native');
  return {
    AlertDialog: ({ onOpenChange, ...props }: { onOpenChange?: (open: boolean) => void }) => {
      mockOnOpenChange = onOpenChange;
      return <ReactNative.View {...props} />;
    },
    AlertDialogContent: ReactNative.View,
    AlertDialogDescription: ReactNative.Text,
    AlertDialogFooter: ReactNative.View,
    AlertDialogHeader: ReactNative.View,
    AlertDialogTitle: ReactNative.Text,
    AlertDialogAction: ReactNative.Pressable,
    AlertDialogCancel: ReactNative.Pressable,
  };
});

const Harness = ({ onResult }: { onResult: (value: boolean) => void }) => {
  const { alertDialog } = useAlertDialog();
  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="custom-dialog"
        onPress={() => {
          void alertDialog({
              title: '削除確認',
              description: '大会を削除します',
              text1: '元に戻せません',
              text2: '',
              text3: '続行しますか',
              confirmText: '削除する',
              cancelText: '戻る',
            }).then(onResult);
        }}
      >
        <Text>custom</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="info-dialog"
        onPress={() => {
          void alertDialog({ description: '保存しました', showCancelButton: false }).then(onResult);
        }}
      >
        <Text>info</Text>
      </Pressable>
    </View>
  );
};

describe('AlertDialogProvider', () => {
  beforeEach(() => {
    mockOnOpenChange = undefined;
  });

  it('確認内容を表示し、キャンセル結果falseを呼出元へ返す', async () => {
    const onResult = jest.fn();
    await render(
      <AlertDialogProvider>
        <Harness onResult={onResult} />
      </AlertDialogProvider>,
    );

    await fireEvent.press(screen.getByLabelText('custom-dialog'));
    expect(screen.getByText('削除確認')).toBeTruthy();
    expect(screen.getByText('大会を削除します\n元に戻せません\n続行しますか')).toBeTruthy();
    await fireEvent.press(screen.getByText('戻る'));
    expect(onResult).toHaveBeenCalledWith(false);
  });

  it('キャンセルなしdialogでは既定タイトルと確定文言を使い、trueを返す', async () => {
    const onResult = jest.fn();
    await render(
      <AlertDialogProvider>
        <Harness onResult={onResult} />
      </AlertDialogProvider>,
    );

    await fireEvent.press(screen.getByLabelText('info-dialog'));
    expect(screen.getByText('確認')).toBeTruthy();
    expect(screen.queryByText('キャンセル')).toBeNull();
    await act(async () => {
      mockOnOpenChange?.(false);
      fireEvent.press(screen.getByText('OK'));
      await Promise.resolve();
    });
    expect(onResult).toHaveBeenCalledTimes(1);
    expect(onResult).toHaveBeenCalledWith(true);
  });

  it('Android Back相当の外部閉鎖をキャンセルとして呼出元へ返す', async () => {
    const onResult = jest.fn();
    await render(
      <AlertDialogProvider>
        <Harness onResult={onResult} />
      </AlertDialogProvider>,
    );

    await fireEvent.press(screen.getByLabelText('custom-dialog'));
    await act(async () => {
      mockOnOpenChange?.(false);
      await Promise.resolve();
    });

    expect(onResult).toHaveBeenCalledTimes(1);
    expect(onResult).toHaveBeenCalledWith(false);
  });

  it('Provider外の利用を明示的なエラーにする', async () => {
    await expect(render(<Harness onResult={jest.fn()} />)).rejects.toThrow(
      'useAlertDialog must be used within AlertDialogProvider',
    );
  });
});
