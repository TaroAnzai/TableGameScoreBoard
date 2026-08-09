// src/components/PageTitleBar.tsx
import { usePathname, useRouter } from 'expo-router';
import { ChevronLeft, Share2 } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useAlertDialog } from '@/components/common/AlertDialogProvider';
import EditableTitle from '@/components/page_parts/EditableTitle';
import ShareModal from '@/components/page_parts/ShareModal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Icon } from '@/components/ui/icon';
import { Text, TextClassContext } from '@/components/ui/text';
import { cn } from '@/lib/utils';
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

  const appWebUrl = process.env.EXPO_PUBLIC_WEB_URL || 'http://localhost:3000';

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
      shareUrl: `${appWebUrl}/${type}/${shortKey}`,
    });
    setIsShareModalOpen(true);
  };

  return (
    <View className="relative min-h-12 flex-row items-center justify-center border-b border-outline bg-surface py-2 mb-2">
      <View className="absolute left-0 flex-row items-center">
        {parentUrl !== null && parentUrl !== undefined && (
          <Button
            accessibilityLabel={t('titleBar.parentPage')}
            className="h-12 w-12 rounded-full p-0"
            size="icon"
            variant="ghost"
            onPress={() => router.push(parentUrl as any)}
          >
            <Icon as={ChevronLeft} className="text-on-surface" size={24} />
          </Button>
        )}

        {showBackButton && (
          <Button
            accessibilityLabel={t('titleBar.back')}
            className="h-12 w-12 rounded-full p-0"
            size="icon"
            variant="ghost"
            onPress={() => router.back()}
          >
            <Icon as={ChevronLeft} className="text-on-surface" size={24} />
          </Button>
        )}
      </View>

      <View
        className={cn(
          'items-center justify-center',
          parentUrl !== null && parentUrl !== undefined && showBackButton
            ? 'max-w-[55%]'
            : 'max-w-[70%]',
        )}
      >
        <TextClassContext.Provider value="text-center text-2xl font-bold leading-8 text-on-surface">
          {TitleComponent ? (
            <TitleComponent onPress={onTitleClick} />
          ) : (
            <EditableTitle value={title} onChange={onTitleChange} />
          )}
        </TextClassContext.Provider>
      </View>

      {shareLinks.length > 0 && (
        <View className="absolute right-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                accessibilityLabel={t('titleBar.shareMenu')}
                className="h-12 w-12 rounded-full p-0"
                size="icon"
                variant="ghost"
              >
                <Icon as={Share2} className="text-on-surface" size={24} />
              </Button>
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
