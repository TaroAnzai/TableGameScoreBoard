import * as Clipboard from 'expo-clipboard';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Share } from 'react-native';

import ShareModal from '@/components/page_parts/ShareModal';

const mockAlertDialog = jest.fn();

jest.mock('@/components/common/AlertDialogProvider', () => ({
  useAlertDialog: () => ({ alertDialog: mockAlertDialog }),
}));

jest.mock('@/components/ui/dialog', () => {
  const { Pressable, Text, View } = jest.requireActual('react-native');
  const DialogText = ({ children }: { children?: React.ReactNode }) => <Text>{children}</Text>;
  return {
    Dialog: ({ children, onOpenChange }: any) => (
      <View>
        <Pressable accessibilityLabel="close-share-modal" onPress={() => onOpenChange(false)} />
        <Pressable accessibilityLabel="keep-share-modal" onPress={() => onOpenChange(true)} />
        {children}
      </View>
    ),
    DialogContent: View,
    DialogDescription: DialogText,
    DialogHeader: View,
    DialogTitle: DialogText,
  };
});

jest.mock('react-native-qrcode-svg', () => {
  const { Text } = jest.requireActual('react-native');
  return ({ value }: { value: string }) => <Text accessibilityLabel="qr-code">{value}</Text>;
});

describe('ShareModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' });
    jest.spyOn(Clipboard, 'setStringAsync').mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderModal = (onClose = jest.fn()) =>
    render(
      <ShareModal
        groupName="第1大会"
        accessLevel="VIEW"
        typeName="大会"
        shareUrl="https://example.com/t/abc"
        open
        onClose={onClose}
      />,
    );

  it('URLとQRコードを表示し、OS共有へタイトル・本文・URLを渡す', async () => {
    await renderModal();
    expect(screen.getByText('第1大会')).toBeTruthy();
    expect(screen.getByLabelText('qr-code')).toHaveTextContent('https://example.com/t/abc');

    await fireEvent.press(screen.getByRole('button'));
    expect(Share.share).toHaveBeenCalledWith({
      title: '大会への招待',
      message: 'このリンクから大会にアクセスできます\nhttps://example.com/t/abc',
      url: 'https://example.com/t/abc',
    });
    expect(Clipboard.setStringAsync).not.toHaveBeenCalled();
  });

  it('OS共有失敗時はURLをclipboardへ保存して成功dialogを表示する', async () => {
    jest.spyOn(Share, 'share').mockRejectedValueOnce(new Error('share failed'));
    await renderModal();
    await fireEvent.press(screen.getByRole('button'));

    await waitFor(() => expect(Clipboard.setStringAsync).toHaveBeenCalledWith('https://example.com/t/abc'));
    expect(mockAlertDialog).toHaveBeenCalledWith(
      expect.objectContaining({ showCancelButton: false, title: expect.any(String) }),
    );
  });

  it('共有とclipboardの両方が失敗した場合はエラー詳細をdialogへ渡す', async () => {
    jest.spyOn(Share, 'share').mockRejectedValueOnce(new Error('share failed'));
    jest.spyOn(Clipboard, 'setStringAsync').mockRejectedValueOnce(new Error('clipboard failed'));
    await renderModal();
    await fireEvent.press(screen.getByRole('button'));

    await waitFor(() =>
      expect(mockAlertDialog).toHaveBeenCalledWith(
        expect.objectContaining({ description: expect.stringContaining('clipboard failed') }),
      ),
    );
  });

  it('dialogを閉じる操作だけをonCloseへ通知する', async () => {
    const onClose = jest.fn();
    await renderModal(onClose);

    await fireEvent.press(screen.getByLabelText('keep-share-modal'));
    expect(onClose).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByLabelText('close-share-modal'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
