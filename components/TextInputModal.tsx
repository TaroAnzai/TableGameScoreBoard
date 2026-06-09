import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Text, TextInput } from 'react-native';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

  const [inputText, setInputText] = useState(value || '');
  const [inputText2, setInputText2] = useState(twoValue || '');

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogContent className="w-[95%] max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title} ver6</DialogTitle>
          <DialogDescription>{discription}</DialogDescription>
        </DialogHeader>
        <View className="grid gap-4">
          <View className="grid gap-3">
            <Label htmlFor="primaryInput">{InputLabel}</Label>
            <Input
              value={inputText}
              onChangeText={setInputText}
              keyboardType={getKeyboardType(inputType)}
              secureTextEntry={inputType === 'password'}
              className="h-12 w-full rounded-md border border-gray-300 bg-white px-3 text-base text-gray-900"
            />
          </View>
          <View className="grid gap-3">
            {twoInput && (
              <>
                <Label htmlFor="twoInput">{twoInputLabel}</Label>
                <Input
                  value={inputText2}
                  onChangeText={setInputText2}
                  keyboardType={getKeyboardType(twoInputType)}
                  secureTextEntry={twoInputType === 'password'}
                  className="h-12 w-full rounded-md border border-gray-300 bg-white px-3 text-base text-gray-900"
                />
              </>
            )}
          </View>
        </View>
        <DialogFooter>
          <Button onPress={() => onClose()}>
            <Text>{t('Common.Cancel')}</Text>
          </Button>
          <Button onPress={() => onComfirm(inputText, inputText2)}>
            <Text>OK</Text>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
