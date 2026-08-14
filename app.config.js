const isDevelopmentBuild = process.env.APP_VARIANT === 'development';

export default ({ config }) => ({
  ...config,
  name: isDevelopmentBuild ? '麻雀集計（開発）' : config.name,
  scheme: isDevelopmentBuild ? 'mahjongapp-dev' : config.scheme,
  android: {
    ...config.android,
    package: isDevelopmentBuild ? 'com.anzaihome.mahjongapp.dev' : config.android?.package,
  },
});
