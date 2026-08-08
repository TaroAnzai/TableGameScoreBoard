import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { radius } from '@/src/lib/theme';
interface TextInputModalProps {
  open: boolean;
  onclose: () => void;
}
export const DialogPreview = ({ open, onclose }: TextInputModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onclose}>
      <DialogContent className="bg-surface" style={{ borderRadius: radius.xl }}>
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>Make</DialogDescription>
        </DialogHeader>
        <View className="grid gap-4 ">
          <View className="grid gap-3">
            <Label htmlFor="name-1">Name</Label>
            <Input id="name-1" defaultValue="Pedro Duarte" />
          </View>
          <View className="grid gap-3">
            <Label htmlFor="username-1">Username</Label>
            <Input id="username-1" defaultValue="@peduarte" />
          </View>
        </View>
        <DialogFooter>
          <DialogClose asChild>
            <Button className="h-auto min-h-12 rounded-xl py-3" variant="outline">
              <Text>Cancel</Text>
            </Button>
          </DialogClose>
          <Button className="h-auto min-h-12 rounded-xl py-3">
            <Text>Save changes</Text>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
