import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { Calendar } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, useWindowDimensions, View } from 'react-native';

import { useAlertDialog } from '@/components/common/AlertDialogProvider';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import type { Tournament, TournamentUpdate } from '@/src/api/generated/mahjongApi.schemas';
import { componentSize, radius } from '@/src/lib/theme';

interface EditTournamentModalProps {
  tournament: Tournament;
  open: boolean;
  onConfirm: (updates: TournamentUpdate) => void | Promise<void>;
  onClose: () => void;
  isPending?: boolean;
  pendingText?: string;
}

const parseDateInput = (value: string): Date | null => {
  if (!/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().substring(0, 10) !== value
    ? null
    : date;
};

const formatDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const EditTournamentModal = ({
  tournament,
  open,
  onConfirm,
  onClose,
  isPending = false,
  pendingText,
}: EditTournamentModalProps) => {
  const { t } = useTranslation();
  const { alertDialog } = useAlertDialog();
  const nameRef = useRef(tournament.name || '');
  const descriptionRef = useRef(tournament.description || '');
  const [hasName, setHasName] = useState(Boolean(tournament.name?.trim()));
  const [startedAt, setStartedAt] = useState(
    tournament.started_at ? tournament.started_at.substring(0, 10) : '',
  );
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isProcessing = isPending || isSubmitting;

  const handleSubmit = async () => {
    const startDate = startedAt ? parseDateInput(startedAt) : null;

    if (startedAt && !startDate) {
      await alertDialog({
        title: t('editTournamentModal.invalidDateTitle'),
        description: t('editTournamentModal.invalidDateDescription'),
        showCancelButton: false,
      });
      return;
    }

    if (isProcessing) return;
    setIsSubmitting(true);
    try {
      await onConfirm({
        name: nameRef.current,
        description: descriptionRef.current,
        started_at: startDate?.toISOString() ?? null,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const { width } = useWindowDimensions();
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && !isProcessing && onClose()}>
      <DialogContent
        className="bg-surface -translate-y-20"
        style={{
          borderRadius: radius.xl,
          width: Math.min(width - 32, componentSize.dialogMaxWidth),
        }}
      >
        <DialogHeader>
          <DialogTitle>{t('editTournamentModal.title')}</DialogTitle>
        </DialogHeader>

        <View className="gap-4">
          <View className="gap-2">
            <Label>{t('editTournamentModal.name')}</Label>
            <Input
              testID="tournament-name-input"
              defaultValue={tournament.name || ''}
              editable={!isProcessing}
              onChangeText={(text) => {
                nameRef.current = text;
                setHasName(Boolean(text.trim()));
              }}
              className="h-auto min-h-12 rounded-xl bg-surface py-3"
            />
          </View>

          <View className="gap-2">
            <Label>{t('editTournamentModal.memo')}</Label>
            <Input
              testID="tournament-description-input"
              defaultValue={tournament.description || ''}
              editable={!isProcessing}
              onChangeText={(text) => {
                descriptionRef.current = text;
              }}
              multiline
              textAlignVertical="top"
              className="h-auto min-h-24 rounded-xl bg-surface py-3"
            />
          </View>

          <View className="gap-2">
            <Label>{t('editTournamentModal.startDate')}</Label>
            <View className="flex-row gap-2">
              <Button
                accessibilityLabel={t('editTournamentModal.selectDate')}
                className="h-auto min-h-12 flex-1 justify-start rounded-xl px-3 py-3"
                variant="outline"
                disabled={isProcessing}
                onPress={() => setIsDatePickerOpen(true)}
              >
                <Icon as={Calendar} className="text-on-surface" size={20} />
                <Text className={startedAt ? 'text-on-surface' : 'text-muted-foreground'}>
                  {startedAt || t('editTournamentModal.datePlaceholder')}
                </Text>
              </Button>
            </View>

            {isDatePickerOpen && (
              <DateTimePicker
                value={parseDateInput(startedAt) ?? new Date()}
                mode="date"
                display="compact"
                presentation="dialog"
                onValueChange={(_, date) => {
                  setStartedAt(formatDateInput(date));
                  setIsDatePickerOpen(false);
                }}
                onDismiss={() => setIsDatePickerOpen(false)}
              />
            )}
          </View>
        </View>

        <DialogFooter>
          <Button
            className="h-auto min-h-12 rounded-xl py-3"
            variant="outline"
            disabled={isProcessing}
            onPress={onClose}
          >
            <Text>{t('Common.close')}</Text>
          </Button>
          <Button
            className="h-auto min-h-12 rounded-xl py-3"
            disabled={isProcessing || !hasName}
            onPress={() => void handleSubmit()}
          >
            {isProcessing && <ActivityIndicator color="white" />}
            <Text>{isProcessing ? (pendingText ?? t('Common.processing')) : t('Common.save')}</Text>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditTournamentModal;
