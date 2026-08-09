import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { radius } from '@/src/lib/theme';
interface TextInputModalProps {
  open: boolean;
  onclose: () => void;
}
export const DialogPreview = ({ open, onclose }: TextInputModalProps) => {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={onclose}>
      <DialogContent className="bg-surface" style={{ borderRadius: radius.xl }}>
        <DialogHeader>
          <DialogTitle>{t('dialogPreview.title')}</DialogTitle>
          <DialogDescription>{t('dialogPreview.description')}</DialogDescription>
        </DialogHeader>
        <View className="grid gap-4 ">
          <View className="grid gap-3">
            <Label htmlFor="name-1">{t('dialogPreview.name')}</Label>
            <Input id="name-1" defaultValue="Pedro Duarte" />
          </View>
          <View className="grid gap-3">
            <Label htmlFor="username-1">{t('dialogPreview.username')}</Label>
            <Input id="username-1" defaultValue="@peduarte" />
          </View>
        </View>
        <DialogFooter>
          <DialogClose asChild>
            <Button className="h-auto min-h-12 rounded-xl py-3" variant="outline">
              <Text>{t('Common.Cancel')}</Text>
            </Button>
          </DialogClose>
          <Button className="h-auto min-h-12 rounded-xl py-3">
            <Text>{t('dialogPreview.saveChanges')}</Text>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
