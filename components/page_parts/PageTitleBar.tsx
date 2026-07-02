// src/components/PageTitleBar.tsx
import { usePathname, useRouter } from 'expo-router';
import { ChevronLeft, ChevronsUp, Share2 } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useAlertDialog } from '@/components/common/AlertDialogProvider';
import EditableTitle from '@/components/page_parts/EditableTitle';
import ShareModal from '@/components/page_parts/ShareModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Text } from '@/components/ui/text';
import type { ShareLink } from '@/src/api/generated/mahjongApi.schemas';
import { getAccessLevelstring } from '@/src/utils/accessLevel_utils';

interface PageTitleBarProps {
  title: string;
  shareLinks?: readonly ShareLink[];
  TitleComponent?: React.ComponentType<{ onPress?: () => void }> | null;
  onTitleClick?: () => void;
  onTitleChange?: (newTitle: string) => void;
  parentUrl?: string | null;
  showBackButton?: boolean;
}
interface shareDataType {
  groupName: string;
  accessLevel: string;
  typeName: string;
  shareUrl: string;
}
export default function PageTitleBar({
  title,
  shareLinks = [],
  TitleComponent = null,
  onTitleClick,
  onTitleChange,
  parentUrl,
  showBackButton = false,
}: PageTitleBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const { alertDialog } = useAlertDialog();
  const [isShareModalOpen, setIsShareModalOpen] = React.useState(false);
  const [shareData, setShareData] = React.useState<shareDataType>();

  const pathSegments = pathname.split('/').filter(Boolean);

  const typeNameMap = {
    group: t('titleBar.group'),
    tournament: t('titleBar.tournament'),
    table: t('titleBar.table'),
  };

  const type = pathSegments[0] as keyof typeof typeNameMap;
  const typeName = typeNameMap[type] ?? t('titleBar.undefined');

  const accessLevel = useMemo(() => {
    return getAccessLevelstring(shareLinks);
  }, [shareLinks]);

  const handleShareUrl = (accessType: string) => {
    const shortKey = shareLinks.find((l) => l.access_level === accessType)?.short_key;
    if (!shortKey) {
      alertDialog({
        title: t('titleBar.noLink', { accessType }),
        showCancelButton: false,
      });
      return;
    }

    setShareData({
      groupName: title,
      accessLevel: accessType,
      typeName: typeName,
      shareUrl: `mahjongapp://${type}/${shortKey}`,
    });
    setIsShareModalOpen(true);
  };

  return (
    <View className="relative h-12 flex-row items-center justify-center px-4">
      <View className="absolute left-4 flex-row items-center gap-3">
        {parentUrl !== null && parentUrl !== undefined && (
          <ChevronsUp size={24} color="white" onPress={() => router.push(parentUrl as any)} />
        )}

        {showBackButton && <ChevronLeft size={24} color="white" onPress={() => router.back()} />}
      </View>

      <View className="max-w-[70%] items-center justify-center">
        {TitleComponent ? (
          <TitleComponent onPress={onTitleClick} />
        ) : (
          <EditableTitle
            value={title}
            onChange={onTitleChange}
            className="text-center text-lg font-bold text-white"
          />
        )}
      </View>

      {shareLinks.length > 0 && (
        <View className="absolute right-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Share2 size={24} color="white" />
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuItem onPress={() => handleShareUrl('VIEW')}>
                <Text>{t('titleBar.shareViewLink')}</Text>
              </DropdownMenuItem>

              {accessLevel !== 'VIEW' && (
                <DropdownMenuItem onPress={() => handleShareUrl('EDIT')}>
                  <Text>{t('titleBar.shareEditLink')}</Text>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </View>
      )}
      {shareData && isShareModalOpen && (
        <ShareModal
          groupName={shareData.groupName}
          accessLevel={shareData.accessLevel}
          typeName={shareData.typeName}
          shareUrl={shareData.shareUrl}
          open={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
        />
      )}
    </View>
  );
}
