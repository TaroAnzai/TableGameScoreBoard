import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { radius } from '@/src/lib/theme';

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Text } from './ui/text';

interface MultiSelectorModalProps<T extends { id: number; name: string }> {
  title: string;
  open: boolean;
  items: T[];
  onConfirm: (selectedItems: T[]) => void;
  onClose: () => void;
  emptyMessage?: string;
  initialSelectedIds?: readonly number[];
}

const MultiSelectorModal = <T extends { id: number; name: string }>({
  title,
  open,
  items,
  onConfirm,
  onClose,
  emptyMessage,
  initialSelectedIds = [],
}: MultiSelectorModalProps<T>) => {
  const { t } = useTranslation();
  const initialSelectionKey = initialSelectedIds.join(',');
  const [selectedIds, setSelectedIds] = useState<number[]>([...initialSelectedIds]);
  const selectionResetKey = `${open}-${initialSelectionKey}`;
  const [previousSelectionResetKey, setPreviousSelectionResetKey] = useState(selectionResetKey);

  if (selectionResetKey !== previousSelectionResetKey) {
    setPreviousSelectionResetKey(selectionResetKey);
    if (open) setSelectedIds([...initialSelectedIds]);
  }

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleConfirm = () => {
    const selectedItems = items.filter((item) => selectedIds.includes(item.id));
    setSelectedIds([...initialSelectedIds]);
    onConfirm(selectedItems);
  };

  const handleCancel = () => {
    setSelectedIds([...initialSelectedIds]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && handleCancel()}>
      <DialogContent className="bg-surface" style={{ borderRadius: radius.xl }}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {items.length === 0 ? (
          <Text className="py-4 text-center text-on-surface-variant">
            {emptyMessage ?? t('Common.emptyMessage')}
          </Text>
        ) : (
          <ScrollView className="max-h-80 w-full">
            <View className="w-full">
              {items.map((item) => {
                const selected = selectedIds.includes(item.id);

                return (
                  <Pressable
                    key={item.id}
                    accessibilityLabel={item.name}
                    accessibilityState={{ checked: selected }}
                    role="checkbox"
                    onPress={() => toggleSelect(item.id)}
                    className="mb-2 min-h-14 w-full flex-row items-center rounded-xl border border-outline bg-surface px-4 py-3 active:bg-surface-variant"
                  >
                    <View
                      className={[
                        'mr-3 h-6 w-6 items-center justify-center rounded border',
                        selected ? 'border-primary bg-primary' : 'border-outline bg-transparent',
                      ].join(' ')}
                    >
                      {selected && <Text className="text-base font-bold text-on-primary">✓</Text>}
                    </View>

                    <Text className="text-base font-semibold text-on-surface">{item.name}</Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        )}

        <DialogFooter>
          <Button
            className="h-auto min-h-12 rounded-xl py-3"
            variant="outline"
            onPress={handleCancel}
          >
            <Text>{t('Common.Cancel')}</Text>
          </Button>
          <Button
            className="h-auto min-h-12 rounded-xl py-3"
            onPress={handleConfirm}
            disabled={selectedIds.length === 0}
          >
            <Text>{t('Common.ok')}</Text>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MultiSelectorModal;
