import React, { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import type { Tournament, TournamentUpdate } from '@/src/api/generated/mahjongApi.schemas';

import { Button } from './ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';

interface EditTournamentModalProps {
  tournament: Tournament;
  open: boolean;
  onConfirm: (updates: TournamentUpdate) => void;
  onClose: () => void;
}

const EditTournamentModal = ({
  tournament,
  open,
  onConfirm,
  onClose,
}: EditTournamentModalProps) => {
  const [name, setName] = useState(tournament.name || '');
  const [description, setDescription] = useState(tournament.description || '');
  const [startedAt, setStartedAt] = useState(
    tournament.started_at ? tournament.started_at.substring(0, 10) : '',
  );

  const handleSubmit = () => {
    onConfirm({
      name,
      description,
      started_at: startedAt ? new Date(startedAt).toISOString() : null,
    });
  };

  return (
    <Dialog open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>大会情報を編集</DialogTitle>
        </DialogHeader>

        <View className="gap-4">
          <View className="gap-1">
            <Text className="text-white">大会名：</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              className="w-full rounded-md border border-green-300/40 px-3 py-2 text-white"
              placeholderTextColor="#aaa"
            />
          </View>

          <View className="gap-1">
            <Text className="text-white">メモ：</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              multiline
              textAlignVertical="top"
              className="min-h-24 w-full rounded-md border border-green-300/40 px-3 py-2 text-white"
              placeholderTextColor="#aaa"
            />
          </View>

          <View className="gap-1">
            <Text className="text-white">開始日：</Text>
            <TextInput
              value={startedAt}
              onChangeText={setStartedAt}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#aaa"
              className="w-full rounded-md border border-green-300/40 px-3 py-2 text-white"
            />
          </View>
        </View>

        <DialogFooter>
          <Button onPress={handleSubmit}>
            <Text>保存</Text>
          </Button>

          <Button variant="outline" onPress={onClose}>
            <Text>閉じる</Text>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditTournamentModal;
