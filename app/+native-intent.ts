export const redirectSystemPath = ({ path }: { path: string; initial: boolean }) => {
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

    return `${routePath}${url.search}${url.hash}`;
  } catch (error) {
    console.error('Deep Link変換エラー:', error);
    return '/';
  }
};
