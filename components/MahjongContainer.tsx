import { ReactNode } from 'react';
import { View } from 'react-native';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
type Props = {
  children: ReactNode;
};
export const MahjongContainer = ({ children }: Props) => {
  return (
    <Card>
      <CardHeader className="flex-row">
        <View className="flex-1 gap-1.5">
          <CardTitle>Subscribe to our newsletter</CardTitle>
          <CardDescription>Enter your details to receive updates and tips</CardDescription>
        </View>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
};
