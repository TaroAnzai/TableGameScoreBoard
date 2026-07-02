import * as Clipboard from 'expo-clipboard';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Share } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { useAlertDialog } from '@/components/common/AlertDialogProvider';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Text } from '@/components/ui/text';
interface ShareModalProps {
  groupName: string; // group name
  accessLevel: string; // access level eg.'View' 'Edit'
  typeName: string; // type eg.'Group' 'Tournament'
  shareUrl: string;
  open: boolean;
  onClose: () => void;
}

const ShareModal = ({ groupName, open, shareUrl, typeName, onClose }: ShareModalProps) => {
  const { t } = useTranslation();
  const { alertDialog } = useAlertDialog();
  const sendShare = async () => {
    try {
      await Share.share({
        title: t('titleBar.shareTitle', { typeName }),
        message: `${t('titleBar.shareText', { typeName })}\n${shareUrl}`,
        url: shareUrl,
      });
    } catch (err: any) {
      try {
        await Clipboard.setStringAsync(shareUrl);

        alertDialog({
          title: t('titleBar.shareSuccessTitle'),
          description: t('titleBar.shareSuccessDescription', {
            typeName,
            url: shareUrl,
          }),
          showCancelButton: false,
        });
      } catch (clipboardErr: any) {
        alertDialog({
          title: t('titleBar.shareErrorTitle'),
          description: t('titleBar.shareErrorDescription', {
            error: clipboardErr.message,
          }),
          showCancelButton: false,
        });
      }
    }
  };
  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{groupName}</DialogTitle>
          <DialogDescription>{t('titleBar.shareText', { typeName })}</DialogDescription>
        </DialogHeader>
        <View className="flex flex-col items-center gap-4">
          <Text>{shareUrl}</Text>
          <QRCode value={shareUrl} size={200} />
          <Button onPress={sendShare}>
            <Text>Send by Other</Text>
          </Button>
        </View>
      </DialogContent>
    </Dialog>
  );
};

export default ShareModal;
