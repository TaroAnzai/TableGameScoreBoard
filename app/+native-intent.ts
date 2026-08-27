import { EXTERNAL_ENTRY_PARAM } from '@/src/utils/externalNavigation';

let externalEntrySequence = 0;

export const redirectSystemPath = ({ path, initial }: { path: string; initial: boolean }) => {
  try {
    const url = new URL(path, 'https://anzai-home.com');
    const isAppScheme = url.protocol === 'mahjongapp:' || url.protocol === 'mahjongapp-dev:';
    const pathParts = isAppScheme ? [url.hostname, url.pathname] : [url.pathname];
    const incomingPath = `/${pathParts
      .filter(Boolean)
      .map((part) => part.replace(/^\/+|\/+$/g, ''))
      .join('/')
      .replace(/\/+$/g, '')}`;
    const pathname = incomingPath.replace(/^\/mahjong(?=\/|$)/, '') || '/';
    const routePath = pathname === '/create' ? '/group/create' : pathname;

    const normalizedUrl = new URL(`${routePath}${url.search}${url.hash}`, 'https://app.local');

    if (!initial) {
      externalEntrySequence += 1;
      normalizedUrl.searchParams.set(
        EXTERNAL_ENTRY_PARAM,
        `${Date.now()}-${externalEntrySequence}`,
      );
    }

    return `${normalizedUrl.pathname}${normalizedUrl.search}${normalizedUrl.hash}`;
  } catch (error) {
    console.error('Deep Link変換エラー:', error);
    return '/';
  }
};
