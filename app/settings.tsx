import { useRouter } from 'expo-router';
import { Check, ChevronLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import MahjongContainer from '@/components/MahjongContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { type LanguageMode, useLanguage } from '@/src/providers/LanguageProvider';
import { type ThemeMode, useTheme } from '@/src/providers/ThemeProvider';

const themeModes: ThemeMode[] = ['system', 'light', 'dark'];
const languageModes: LanguageMode[] = ['system', 'ja', 'en'];

export default function SettingsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { languageMode, setLanguageMode } = useLanguage();
  const { setThemeMode, themeMode } = useTheme();

  return (
    <MahjongContainer>
      <View className="gap-5">
        <View className="relative h-12 flex-row items-center justify-center">
          <Button
            accessibilityLabel={t('settings.back')}
            className="absolute left-0 h-12 w-12 rounded-full p-0"
            size="icon"
            variant="ghost"
            onPress={() => router.back()}
          >
            <Icon as={ChevronLeft} className="text-on-surface" size={24} />
          </Button>
          <Text className="text-center text-2xl font-bold text-on-surface">
            {t('settings.title')}
          </Text>
        </View>

        <Card className="gap-4 rounded-2xl py-5">
          <CardHeader className="gap-1 px-5">
            <CardTitle className="text-lg leading-6">{t('settings.theme.title')}</CardTitle>
            <Text className="text-sm leading-5 text-on-surface-variant">
              {t('settings.theme.description')}
            </Text>
          </CardHeader>
          <CardContent className="gap-3 px-5">
            {themeModes.map((mode) => {
              const isSelected = themeMode === mode;

              return (
                <Button
                  key={mode}
                  accessibilityState={{ selected: isSelected }}
                  className="h-auto min-h-14 w-full justify-between rounded-xl px-4 py-3"
                  variant={isSelected ? 'secondary' : 'outline'}
                  onPress={() => void setThemeMode(mode)}
                >
                  <View className="flex-1 gap-0.5">
                    <Text className="text-base font-semibold">
                      {t(`settings.theme.options.${mode}.label`)}
                    </Text>
                    <Text className="text-sm text-on-surface-variant">
                      {t(`settings.theme.options.${mode}.description`)}
                    </Text>
                  </View>
                  {isSelected && (
                    <Icon as={Check} className="text-on-primary-container" size={20} />
                  )}
                </Button>
              );
            })}
          </CardContent>
        </Card>

        <Card className="gap-4 rounded-2xl py-5">
          <CardHeader className="gap-1 px-5">
            <CardTitle className="text-lg leading-6">{t('settings.language.title')}</CardTitle>
            <Text className="text-sm leading-5 text-on-surface-variant">
              {t('settings.language.description')}
            </Text>
          </CardHeader>
          <CardContent className="gap-3 px-5">
            {languageModes.map((mode) => {
              const isSelected = languageMode === mode;

              return (
                <Button
                  key={mode}
                  accessibilityState={{ selected: isSelected }}
                  className="h-auto min-h-14 w-full justify-between rounded-xl px-4 py-3"
                  variant={isSelected ? 'secondary' : 'outline'}
                  onPress={() => void setLanguageMode(mode)}
                >
                  <Text className="flex-1 text-base font-semibold">
                    {t(`settings.language.options.${mode}`)}
                  </Text>
                  {isSelected && (
                    <Icon as={Check} className="text-on-primary-container" size={20} />
                  )}
                </Button>
              );
            })}
          </CardContent>
        </Card>
      </View>
    </MahjongContainer>
  );
}
