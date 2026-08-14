// src/components/EditableTitle.jsx
import { Pencil } from 'lucide-react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

interface EditableTitleProps {
  value: string;
  onChange?: (newValue: string) => void;
  className?: string;
}
const EditableTitle = ({ value, onChange, className = '' }: EditableTitleProps) => {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  const handleStartEdit = () => {
    setTempValue(value);
    setEditing(true);
  };

  const handleFinishEdit = () => {
    setEditing(false);
    if (tempValue.trim() && tempValue !== value) {
      onChange?.(tempValue.trim());
    }
  };

  if (!onChange) {
    return <Text className={className}>{value}</Text>;
  }

  if (editing) {
    return (
      <Input
        value={tempValue}
        onChangeText={setTempValue}
        onBlur={handleFinishEdit}
        onSubmitEditing={handleFinishEdit}
        autoFocus
      />
    );
  }

  return (
    <Pressable
      accessibilityLabel={t('Common.editTitle', { title: value })}
      className={cn(
        'flex-row items-center gap-2 rounded-md px-2 py-1 active:bg-surface-variant',
        className,
      )}
      role="button"
      onPress={handleStartEdit}
    >
      <Text>{value}</Text>
      <Icon as={Pencil} className="text-on-surface-variant" size={18} />
    </Pressable>
  );
};

export default EditableTitle;
