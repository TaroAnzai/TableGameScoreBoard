import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import {
  Dialog,
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
  onComfirm: (inputText: string, inputText2?: string) => void;
  onClose: () => void;
  value?: string;
  title?: string;
  discription?: string;
  InputLabel?: string;
  inputType?: 'text' | 'email' | 'password' | 'number';
  twoInput?: boolean;
  twoInputLabel?: string;
  twoValue?: string;
  twoInputType?: 'text' | 'email' | 'password' | 'number';
}

const getKeyboardType = (type: TextInputModalProps['inputType']) => {
  if (type === 'email') return 'email-address';
  if (type === 'number') return 'numeric';
  return 'default';
};

export const TextInputModal = ({
  open,
  onComfirm,
  onClose,
  value,
  title,
  discription,
  InputLabel,
  inputType = 'text',
  twoInput = false,
  twoInputLabel = '',
  twoValue = '',
  twoInputType = 'text',
}: TextInputModalProps) => {
  const { t } = useTranslation();

  const inputTextRef = useRef(value || '');
  const inputText2Ref = useRef(twoValue || '');

  useEffect(() => {
    if (!open) return;

    inputTextRef.current = value || '';
    inputText2Ref.current = twoValue || '';
  }, [open, twoValue, value]);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogContent
        key={`${open}-${value}-${twoValue}`}
        className="bg-surface -translate-y-20"
        style={{ borderRadius: radius.xl }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{discription}</DialogDescription>
        </DialogHeader>
        <View className="gap-4">
          <View className="gap-3">
            <Label htmlFor="primaryInput">{InputLabel}</Label>
            <Input
              defaultValue={value}
              onChangeText={(text) => {
                inputTextRef.current = text;
              }}
              keyboardType={getKeyboardType(inputType)}
              secureTextEntry={inputType === 'password'}
              autoCapitalize="none"
              autoCorrect={false}
              className="h-auto min-h-12 rounded-xl bg-surface py-3"
            />
          </View>
          <View className="gap-3">
            {twoInput && (
              <>
                <Label htmlFor="twoInput">{twoInputLabel}</Label>
                <Input
                  defaultValue={twoValue}
                  onChangeText={(text) => {
                    inputText2Ref.current = text;
                  }}
                  keyboardType={getKeyboardType(twoInputType)}
                  secureTextEntry={twoInputType === 'password'}
                  className="h-auto min-h-12 rounded-xl bg-surface py-3"
                />
              </>
            )}
          </View>
        </View>
        <DialogFooter>
          <Button className="h-auto min-h-12 rounded-xl py-3" variant="outline" onPress={onClose}>
            <Text>{t('Common.Cancel')}</Text>
          </Button>
          <Button
            className="h-auto min-h-12 rounded-xl py-3"
            onPress={() => onComfirm(inputTextRef.current, inputText2Ref.current)}
          >
            <Text>OK</Text>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
