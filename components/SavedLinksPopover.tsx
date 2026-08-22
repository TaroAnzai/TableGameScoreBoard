import type { TriggerRef } from '@rn-primitives/popover';
import { router, usePathname } from 'expo-router';
import { Bookmark } from 'lucide-react-native';
import { type ReactElement, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, View } from 'react-native';

import { useAlertDialog } from '@/components/common/AlertDialogProvider';
import { MahjongListItem } from '@/components/MahjongListItem';
import { Icon } from '@/components/ui/icon';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Text } from '@/components/ui/text';
import { useSavedLinks } from '@/src/hooks/useSavedLinks';
import type { SavedLink } from '@/src/types/savedLink';

type SavedLinksPopoverProps = {
  trigger: ReactElement;
};

const compareByLastOpenedAt = (first: SavedLink, second: SavedLink) =>
  second.lastOpenedAt.localeCompare(first.lastOpenedAt);

const getParentNames = (link: SavedLink) =>
  [link.parentGroupName, link.parentTournamentName].filter(Boolean).join(' / ');

const getLinkPathname = (link: SavedLink) =>
  link.type === 'tournament' ? `/tournament/${link.key}` : `/table/${link.key}`;

export const SavedLinksPopover = ({ trigger }: SavedLinksPopoverProps) => {
  const triggerRef = useRef<TriggerRef>(null);
  const { t } = useTranslation();
  const { alertDialog } = useAlertDialog();
  const pathname = usePathname();
  const { savedLinks, isLoading, isError, touch, remove } = useSavedLinks();
  const sortedLinks = [...savedLinks].sort(compareByLastOpenedAt);
  const isCurrentLink = (link: SavedLink) => pathname === getLinkPathname(link);

  const closePopover = () => {
    if (typeof triggerRef.current?.close === 'function') {
      triggerRef.current.close();
    }
  };

  const handleOpenLink = (link: SavedLink) => {
    if (isCurrentLink(link)) {
      closePopover();
      return;
    }

    if (link.type === 'tournament') {
      router.push({ pathname: '/tournament/[tournamentKey]', params: { tournamentKey: link.key } });
    } else {
      router.push({ pathname: '/table/[tableKey]', params: { tableKey: link.key } });
    }

    void touch({ type: link.type, key: link.key }).catch(() => undefined);
    closePopover();
  };

  const handleRemoveLink = async (link: SavedLink) => {
    const confirmed = await alertDialog({
      title: t('savedLinks.removeConfirmTitle'),
      description: t('savedLinks.removeConfirmDescription', { name: link.name }),
      showCancelButton: true,
    });
    if (!confirmed) return;
    void remove({ type: link.type, key: link.key }).catch(() => undefined);
  };

  return (
    <Popover>
      <PopoverTrigger ref={triggerRef} asChild>
        {trigger}
      </PopoverTrigger>
      <PopoverContent align="center" side="top" className="w-80 p-3">
        <View className="mb-2 flex-row items-center gap-2">
          <Icon as={Bookmark} className="text-on-surface" size={18} />
          <Text className="font-semibold">{t('savedLinks.title')}</Text>
        </View>
        {isLoading ? (
          <View className="items-center py-6">
            <ActivityIndicator accessibilityLabel={t('Common.loading')} />
          </View>
        ) : isError ? (
          <Text className="py-4 text-center text-destructive">{t('Common.loadError')}</Text>
        ) : sortedLinks.length === 0 ? (
          <Text className="py-4 text-center text-muted-foreground">{t('savedLinks.empty')}</Text>
        ) : (
          <ScrollView className="max-h-80" contentContainerClassName="gap-1">
            <View className="flex-1 flex-wrap gap-1">
              {sortedLinks.map((link) => {
                const current = isCurrentLink(link);

                return (
                  <MahjongListItem
                    key={`${link.type}:${link.key}`}
                    title={link.name}
                    badge={t(`savedLinks.type.${link.type}`)}
                    accessories={[getParentNames(link), link.accessLevel ?? link.accessLevel]}
                    onPress={() => handleOpenLink(link)}
                    onLongPress={() => handleRemoveLink(link)}
                    selected={current}
                    className={
                      current
                        ? 'bg-primary-container active:bg-primary-container active:opacity-100'
                        : 'bg-surface-variant active:bg-primary-container active:opacity-100'
                    }
                  />
                );
              })}
            </View>
          </ScrollView>
        )}
      </PopoverContent>
    </Popover>
  );
};
