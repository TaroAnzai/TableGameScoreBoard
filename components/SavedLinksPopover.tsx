import type { TriggerRef } from '@rn-primitives/popover';
import { router } from 'expo-router';
import { Bookmark, Trash2 } from 'lucide-react-native';
import { type ReactElement,useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, View } from 'react-native';

import { Button } from '@/components/ui/button';
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

export const SavedLinksPopover = ({
  trigger,
}: SavedLinksPopoverProps) => {
  const triggerRef = useRef<TriggerRef>(null);
  const { t } = useTranslation();
  const { savedLinks, isLoading, isError, touch, remove, isRemoving } = useSavedLinks();
  const sortedLinks = [...savedLinks].sort(compareByLastOpenedAt);

  const handleOpenLink = (link: SavedLink) => {
    if (link.type === 'tournament') {
      router.push({ pathname: '/tournament/[tournamentKey]', params: { tournamentKey: link.key } });
    } else {
      router.push({ pathname: '/table/[tableKey]', params: { tableKey: link.key } });
    }

    void touch({ type: link.type, key: link.key }).catch(() => undefined);
    if (typeof triggerRef.current?.close === 'function') {
      triggerRef.current.close();
    }
  };

  const handleRemoveLink = (link: SavedLink) => {
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
            {sortedLinks.map((link) => (
              <View key={`${link.type}:${link.key}`} className="flex-row items-center gap-1">
                <Button
                  accessibilityLabel={t('savedLinks.open', { name: link.name })}
                  className="h-auto min-h-12 flex-1 justify-start rounded-lg px-3 py-2"
                  variant="ghost"
                  onPress={() => handleOpenLink(link)}
                >
                  <View className="min-w-0 flex-1 gap-0.5">
                    <Text className="text-left font-medium" numberOfLines={1}>
                      {link.name}
                    </Text>
                    <Text className="text-left text-xs text-muted-foreground">
                      {t(`savedLinks.type.${link.type}`)}
                    </Text>
                  </View>
                </Button>
                <Button
                  accessibilityLabel={t('savedLinks.remove', { name: link.name })}
                  className="h-10 w-10 rounded-full p-0"
                  disabled={isRemoving}
                  size="icon"
                  variant="ghost"
                  onPress={() => handleRemoveLink(link)}
                >
                  <Icon as={Trash2} className="text-destructive" size={18} />
                </Button>
              </View>
            ))}
          </ScrollView>
        )}
      </PopoverContent>
    </Popover>
  );
};
