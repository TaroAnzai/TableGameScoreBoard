import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator } from 'react-native';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Text } from '@/components/ui/text';
import { radius } from '@/src/lib/theme';

type SavePagePromptModalProps = {
  open: boolean;
  mode: 'initial' | 'navigation' | undefined;
  onSave: () => void | Promise<void>;
  onContinueWithoutSaving: () => void;
  onCancel: () => void;
  isSaving?: boolean;
};

export const SavePagePromptModal = ({
  open,
  mode,
  onSave,
  onContinueWithoutSaving,
  onCancel,
  isSaving = false,
}: SavePagePromptModalProps) => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isProcessing = isSaving || isSubmitting;

  const handleSave = async () => {
    if (isProcessing) return;

    setIsSubmitting(true);
    try {
      await onSave();
    } catch {
      // The caller presents the storage error using the app-wide feedback pattern.
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && !isProcessing && onCancel()}>
      <DialogContent
        testID="unsaved-link-dialog"
        className="bg-surface -translate-y-20"
        style={{ borderRadius: radius.xl }}
      >
        <DialogHeader>
          <DialogTitle>{t('savePagePrompt.title')}</DialogTitle>
          <DialogDescription>{t('savePagePrompt.description')}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          {mode === 'navigation' && (
            <Button
              accessibilityLabel={t('Common.Cancel')}
              className="h-auto min-h-12 rounded-xl py-3"
              variant="ghost"
              disabled={isProcessing}
              onPress={onCancel}
            >
              <Text>{t('Common.Cancel')}</Text>
            </Button>
          )}
          <Button
            accessibilityLabel={t('savePagePrompt.continue')}
            className="h-auto min-h-12 rounded-xl py-3"
            variant="outline"
            disabled={isProcessing}
            onPress={onContinueWithoutSaving}
          >
            <Text>{t('savePagePrompt.continue')}</Text>
          </Button>
          <Button
            accessibilityLabel={t('savePagePrompt.save')}
            className="h-auto min-h-12 rounded-xl py-3"
            disabled={isProcessing}
            onPress={() => void handleSave()}
          >
            {isProcessing && <ActivityIndicator color="white" />}
            <Text>{isProcessing ? t('savePagePrompt.saving') : t('savePagePrompt.save')}</Text>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
