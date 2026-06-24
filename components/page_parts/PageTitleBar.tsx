// src/components/PageTitleBar.tsx
import * as Clipboard from 'expo-clipboard';
import { usePathname, useRouter } from 'expo-router';
import { ChevronLeft, ChevronsUp, Share2 } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Share, View } from 'react-native';

import { useAlertDialog } from '@/components/common/AlertDialogProvider';
import EditableTitle from '@/components/page_parts/EditableTitle';
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

  const handleShareUrl = async (accessType: string) => {
    const shortKey = shareLinks.find((l) => l.access_level === accessType)?.short_key;

    if (!shortKey) {
      alertDialog({
        title: t('titleBar.noLink', { accessType }),
        showCancelButton: false,
      });
      return;
    }

    // Web版の window.location.origin の代わり。
    // 実際のURLはアプリの仕様に合わせて調整してください。
    const shareUrl = `mahjongapp://${type}/${shortKey}`;

    try {
      await Share.share({
        title: t('titleBar.shareTitle', { typeName }),
        message: `${t('titleBar.shareText', { typeName })}\n${shareUrl}`,
        url: shareUrl,
      });
    } catch (err: any) {
      try {
        await Clipboard.setStringAsync(shareUrl);

        alertDialog({
          title: t('titleBar.shareSuccessTitle'),
          description: t('titleBar.shareSuccessDescription', {
            typeName,
            url: shareUrl,
          }),
          showCancelButton: false,
        });
      } catch (clipboardErr: any) {
        alertDialog({
          title: t('titleBar.shareErrorTitle'),
          description: t('titleBar.shareErrorDescription', {
            error: clipboardErr.message,
          }),
          showCancelButton: false,
        });
      }
    }
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
    </View>
  );
}
