export type BackNavigation = {
  canGoBack: () => boolean;
  back: () => void;
  replace: (href: '/') => void;
};

export const goBackOrFallback = (navigation: BackNavigation) => {
  if (navigation.canGoBack()) {
    navigation.back();
    return;
  }

  navigation.replace('/');
};
