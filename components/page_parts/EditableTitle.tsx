// src/components/EditableTitle.jsx
import { Pencil } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

interface EditableTitleProps {
  value: string;
  onChange?: (newValue: string) => void | Promise<void>;
  onLongPress?: () => void;
  className?: string;
}
const EditableTitle = ({ value, onChange, onLongPress, className = '' }: EditableTitleProps) => {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const isSavingRef = useRef(false);

  const handleStartEdit = () => {
    setTempValue(value);
    setEditing(true);
  };

  const handleFinishEdit = async () => {
    if (isSavingRef.current) return;
    const nextValue = tempValue.trim();
    if (!nextValue || nextValue === value) {
      setEditing(false);
      return;
    }

    isSavingRef.current = true;
    setIsSaving(true);
    try {
      await onChange?.(nextValue);
      setEditing(false);
    } catch {
      // The mutation hook shows the error. Keep the draft open for retrying.
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  };

  if (!onChange && !onLongPress) {
    return <Text className={className}>{value}</Text>;
  }

  if (editing) {
    return (
      <View className="flex-row items-center gap-2">
        <Input
          value={tempValue}
          editable={!isSaving}
          onChangeText={setTempValue}
          onBlur={() => void handleFinishEdit()}
          onSubmitEditing={() => void handleFinishEdit()}
          autoFocus
        />
        {isSaving && <ActivityIndicator accessibilityLabel={t('Common.processing')} />}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityLabel={onChange ? t('Common.editTitle', { title: value }) : value}
      className={cn(
        'flex-row items-center gap-2 rounded-md px-2 py-1 active:bg-surface-variant',
        className,
      )}
      accessibilityRole="button"
      onLongPress={onLongPress}
      onPress={onChange ? handleStartEdit : undefined}
    >
      <Text>{value}</Text>
      {onChange && <Icon as={Pencil} className="text-on-surface-variant" size={18} />}
    </Pressable>
  );
};

export default EditableTitle;
