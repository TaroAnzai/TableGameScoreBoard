export const redirectSystemPath = ({ path }: { path: string; initial: boolean }) => {
  try {
    const url = new URL(path, 'https://anzai-home.com');

    const pathname = url.pathname.replace(/^\/mahjong(?=\/|$)/, '');

    return `${pathname || '/'}${url.search}${url.hash}`;
  } catch (error) {
    console.error('Deep Link変換エラー:', error);
    return '/';
  }
};
