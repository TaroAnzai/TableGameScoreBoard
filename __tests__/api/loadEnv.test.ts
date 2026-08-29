describe('loadEnv', () => {
  const originalDev = globalThis.__DEV__;
  const originalDevUrl = process.env.EXPO_PUBLIC_DEV_API_URL;
  const originalApiUrl = process.env.EXPO_PUBLIC_API_URL;

  afterEach(() => {
    Object.defineProperty(globalThis, '__DEV__', { configurable: true, value: originalDev });
    process.env.EXPO_PUBLIC_DEV_API_URL = originalDevUrl;
    process.env.EXPO_PUBLIC_API_URL = originalApiUrl;
    jest.resetModules();
  });

  it('developmentでは設定された開発API URLを使う', () => {
    Object.defineProperty(globalThis, '__DEV__', { configurable: true, value: true });
    process.env.EXPO_PUBLIC_DEV_API_URL = 'https://dev.example.com';

    jest.isolateModules(() => {
      expect(require('@/src/api/loadEnv').API_BASE_URL).toBe('https://dev.example.com');
    });
  });

  it('productionでは設定された本番API URLを使う', () => {
    Object.defineProperty(globalThis, '__DEV__', { configurable: true, value: false });
    process.env.EXPO_PUBLIC_API_URL = 'https://prod.example.com';

    jest.isolateModules(() => {
      expect(require('@/src/api/loadEnv').API_BASE_URL).toBe('https://prod.example.com');
    });
  });

  it('productionの設定がない場合は公開APIを既定値にする', () => {
    Object.defineProperty(globalThis, '__DEV__', { configurable: true, value: false });
    delete process.env.EXPO_PUBLIC_API_URL;

    jest.isolateModules(() => {
      expect(require('@/src/api/loadEnv').API_BASE_URL).toBe(
        'https://api.anzai-home.com/mahjong',
      );
    });
  });
});
