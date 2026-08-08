// src/components/SelectorModal.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { radius } from '@/src/lib/theme';

import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Text } from './ui/text';

type SelectorItem = {
  id: string | number;
  name: string;
};

interface SelectorModalProps<T extends SelectorItem> {
  title: string;
  open: boolean;
  items?: readonly T[];
  onSelect: (item: T) => void;
  onClose: () => void;
  plusDisplayItem?: keyof T | null;
  emptyMessage?: string;
}

const SelectorModal = <T extends SelectorItem>({
  title,
  items,
  open,
  onSelect,
  onClose,
  plusDisplayItem = null,
  emptyMessage,
}: SelectorModalProps<T>) => {
  const { t } = useTranslation();
  const msg = emptyMessage ?? t('Common.emptyMessage');

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="bg-surface" style={{ borderRadius: radius.xl }}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{t('Common.Select')}</DialogDescription>
        </DialogHeader>

        {!items || items.length === 0 ? (
          <View className="py-4">
            <Text className="text-center text-muted-foreground">{msg}</Text>
          </View>
        ) : (
          <ScrollView className="max-h-80">
            <View className="w-full gap-2">
              {items.map((item) => (
                <Button
                  key={String(item.id)}
                  onPress={() => onSelect(item)}
                  className="h-auto min-h-14 w-full items-start rounded-xl border border-outline bg-surface px-4 py-3"
                  variant="ghost"
                >
                  <Text className="text-base font-semibold text-on-surface">{item.name}</Text>

                  {plusDisplayItem && item[plusDisplayItem] !== null && (
                    <Text className="text-sm text-on-surface-variant">
                      {String(item[plusDisplayItem])}
                    </Text>
                  )}
                </Button>
              ))}
            </View>
          </ScrollView>
        )}

        <DialogFooter>
          <Button className="h-auto min-h-12 rounded-xl py-3" onPress={onClose}>
            <Text>{t('Common.close')}</Text>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SelectorModal;
