import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Button } from './ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';

interface MultiSelectorModalProps<T extends { id: number; name: string }> {
  title: string;
  open: boolean;
  items: T[];
  onConfirm: (selectedItems: T[]) => void;
  onClose: () => void;
}

const MultiSelectorModal = <T extends { id: number; name: string }>({
  title,
  open,
  items,
  onConfirm,
  onClose,
}: MultiSelectorModalProps<T>) => {
  const { t } = useTranslation();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleConfirm = () => {
    const selectedItems = items.filter((item) => selectedIds.includes(item.id));
    onConfirm(selectedItems);
  };

  return (
    <Dialog open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {items.length === 0 ? (
          <Text className="py-4 text-center text-white">{t('Common.emptyMessage')}</Text>
        ) : (
          <ScrollView className="max-h-80 w-full">
            <View className="w-full">
              {items.map((item) => {
                const selected = selectedIds.includes(item.id);

                return (
                  <Pressable
                    key={item.id}
                    onPress={() => toggleSelect(item.id)}
                    className="mb-4 flex-row items-center"
                  >
                    <View
                      className={[
                        'mr-3 h-6 w-6 items-center justify-center rounded border border-white',
                        selected ? 'bg-green-500' : 'bg-transparent',
                      ].join(' ')}
                    >
                      {selected && <Text className="text-base font-bold text-white">✓</Text>}
                    </View>

                    <Text className="text-xl text-white">{item.name}</Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        )}

        <DialogFooter>
          <Button onPress={handleConfirm} disabled={selectedIds.length === 0}>
            <Text>OK</Text>
          </Button>

          <Button variant="outline" onPress={onClose}>
            <Text>{t('Common.Cancel')}</Text>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MultiSelectorModal;
