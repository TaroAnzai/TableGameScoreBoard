import type { ReactNode } from 'react';
import { View } from 'react-native';

import { MahjongSubTitle } from '@/components/common/TextStyles';

type Props = {
  actions?: ReactNode;
  title: ReactNode;
};

const MahjongSectionHeader = ({ actions, title }: Props) => {
  return (
    <View className="relative mb-2 h-10 w-full flex-row items-center justify-center">
      <View className="mx-20 min-w-0 flex-1 items-center">
        <MahjongSubTitle>{title}</MahjongSubTitle>
      </View>
      {actions && (
        <View className="absolute inset-y-0 right-0 flex-row items-center gap-1">{actions}</View>
      )}
    </View>
  );
};

export default MahjongSectionHeader;
