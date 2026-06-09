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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
interface TextInputModalProps {
  open: boolean;
  onclose: () => void;
}
export const DialogPreview = ({ open, onclose }: TextInputModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onclose}>
      <DialogContent className="max-w-[425px]">
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
            <Button variant="outline">
              <Text>Cancel</Text>
            </Button>
          </DialogClose>
          <Button>
            <Text>Save changes</Text>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
