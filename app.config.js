const isDevelopmentBuild = process.env.APP_VARIANT === 'development';

export default ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    package: isDevelopmentBuild ? 'com.anonymous.mahjongmobile' : config.android?.package,
  },
});
