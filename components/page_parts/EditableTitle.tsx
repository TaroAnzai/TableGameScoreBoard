// src/components/EditableTitle.jsx
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';

interface EditableTitleProps {
  value: string;
  onChange?: (newValue: string) => void;
  className?: string;
}
const EditableTitle = ({ value, onChange, className = '' }: EditableTitleProps) => {
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

  return (
    <View>
      <Pressable onPress={handleStartEdit} className={className}>
        {editing ? (
          <Input
            value={tempValue}
            onChangeText={setTempValue}
            onBlur={handleFinishEdit}
            onSubmitEditing={handleFinishEdit}
            autoFocus
          />
        ) : (
          <Text>{value}</Text>
        )}
      </Pressable>
    </View>
  );
};

export default EditableTitle;
