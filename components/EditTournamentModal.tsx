import React, { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import type { Tournament, TournamentUpdate } from '@/src/api/generated/mahjongApi.schemas';
import { radius } from '@/src/lib/theme';

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
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="bg-surface" style={{ borderRadius: radius.xl }}>
        <DialogHeader>
          <DialogTitle>大会情報を編集</DialogTitle>
        </DialogHeader>

        <View className="gap-4">
          <View className="gap-2">
            <Label>大会名</Label>
            <Input
              value={name}
              onChangeText={setName}
              className="h-auto min-h-12 rounded-xl bg-surface py-3"
            />
          </View>

          <View className="gap-2">
            <Label>メモ</Label>
            <Input
              value={description}
              onChangeText={setDescription}
              multiline
              textAlignVertical="top"
              className="min-h-24 rounded-xl bg-surface py-3"
            />
          </View>

          <View className="gap-2">
            <Label>開始日</Label>
            <Input
              value={startedAt}
              onChangeText={setStartedAt}
              placeholder="YYYY-MM-DD"
              className="h-auto min-h-12 rounded-xl bg-surface py-3"
            />
          </View>
        </View>

        <DialogFooter>
          <Button className="h-auto min-h-12 rounded-xl py-3" onPress={handleSubmit}>
            <Text>保存</Text>
          </Button>

          <Button className="h-auto min-h-12 rounded-xl py-3" variant="outline" onPress={onClose}>
            <Text>閉じる</Text>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditTournamentModal;
