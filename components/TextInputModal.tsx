import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';

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
  isPending?: boolean;
  pendingText?: string;
}

const getKeyboardType = (type: TextInputModalProps['inputType']) => {
  if (type === 'email') return 'email-address';
  if (type === 'number') return 'numeric';
  return 'default';
};

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

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
  isPending = false,
  pendingText,
}: TextInputModalProps) => {
  const { t } = useTranslation();

  const inputTextRef = useRef(value || '');
  const inputText2Ref = useRef(twoValue || '');
  const [inputError, setInputError] = useState(false);
  const [input2Error, setInput2Error] = useState(false);
  const resetKey = `${open}-${value ?? ''}-${twoValue}`;
  const [previousResetKey, setPreviousResetKey] = useState(resetKey);

  if (resetKey !== previousResetKey) {
    setPreviousResetKey(resetKey);
    setInputError(false);
    setInput2Error(false);
  }

  useEffect(() => {
    if (!open) return;

    inputTextRef.current = value || '';
    inputText2Ref.current = twoValue || '';
  }, [open, twoValue, value]);

  const handleConfirm = () => {
    const hasInputError = inputType === 'email' && !isValidEmail(inputTextRef.current);
    const hasInput2Error =
      twoInput && twoInputType === 'email' && !isValidEmail(inputText2Ref.current);

    setInputError(hasInputError);
    setInput2Error(hasInput2Error);
    if (hasInputError || hasInput2Error) return;

    onComfirm(inputTextRef.current, inputText2Ref.current);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !isPending) onClose();
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
                if (inputError) setInputError(false);
              }}
              keyboardType={getKeyboardType(inputType)}
              secureTextEntry={inputType === 'password'}
              autoCapitalize="none"
              autoCorrect={false}
              aria-invalid={inputError}
              className="h-auto min-h-12 rounded-xl bg-surface py-3"
            />
            {inputError && (
              <Text className="text-sm text-destructive">{t('Common.invalidEmail')}</Text>
            )}
          </View>
          <View className="gap-3">
            {twoInput && (
              <>
                <Label htmlFor="twoInput">{twoInputLabel}</Label>
                <Input
                  defaultValue={twoValue}
                  onChangeText={(text) => {
                    inputText2Ref.current = text;
                    if (input2Error) setInput2Error(false);
                  }}
                  keyboardType={getKeyboardType(twoInputType)}
                  secureTextEntry={twoInputType === 'password'}
                  autoCapitalize="none"
                  autoCorrect={false}
                  aria-invalid={input2Error}
                  className="h-auto min-h-12 rounded-xl bg-surface py-3"
                />
                {input2Error && (
                  <Text className="text-sm text-destructive">{t('Common.invalidEmail')}</Text>
                )}
              </>
            )}
          </View>
        </View>
        <DialogFooter>
          <Button
            className="h-auto min-h-12 rounded-xl py-3"
            variant="outline"
            disabled={isPending}
            onPress={onClose}
          >
            <Text>{t('Common.Cancel')}</Text>
          </Button>
          <Button
            className="h-auto min-h-12 rounded-xl py-3"
            disabled={isPending}
            onPress={handleConfirm}
          >
            {isPending && <ActivityIndicator color="white" />}
            <Text>{isPending ? (pendingText ?? t('Common.processing')) : t('Common.ok')}</Text>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
