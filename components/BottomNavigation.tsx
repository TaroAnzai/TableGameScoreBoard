import { router, usePathname } from 'expo-router';
import { Bookmark, House, Settings } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SavedLinksPopover } from '@/components/SavedLinksPopover';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

export const BottomNavigation = () => {
  const { t } = useTranslation();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const isHome = pathname === '/';
  const isSettings = pathname === '/settings';

  return (
    <View
      className="border-outline bg-surface flex-row border-t px-3 pt-2"
      style={{ paddingBottom: Math.max(insets.bottom, 8) }}
    >
      <Button
        accessibilityLabel={t('bottomNavigation.home')}
        accessibilityState={{ selected: isHome }}
        className="h-auto min-h-12 flex-1 flex-col gap-1 rounded-lg py-2"
        variant={isHome ? 'secondary' : 'ghost'}
        onPress={() => router.replace('/')}
      >
        <Icon as={House} className="text-on-surface" size={20} />
        <Text className="text-xs">{t('bottomNavigation.home')}</Text>
      </Button>
      <SavedLinksPopover
        trigger={
          <Button
            accessibilityLabel={t('bottomNavigation.savedLinks')}
            className="h-auto min-h-12 flex-1 flex-col gap-1 rounded-lg py-2"
            variant="ghost"
          >
            <Icon as={Bookmark} className="text-on-surface" size={20} />
            <Text className="text-xs">{t('bottomNavigation.savedLinks')}</Text>
          </Button>
        }
      />

      <Button
        accessibilityLabel={t('bottomNavigation.settings')}
        accessibilityState={{ selected: isSettings }}
        className="h-auto min-h-12 flex-1 flex-col gap-1 rounded-lg py-2"
        variant={isSettings ? 'secondary' : 'ghost'}
        onPress={() => router.replace('/settings')}
      >
        <Icon as={Settings} className="text-on-surface" size={20} />
        <Text className="text-xs">{t('bottomNavigation.settings')}</Text>
      </Button>
    </View>
  );
};
