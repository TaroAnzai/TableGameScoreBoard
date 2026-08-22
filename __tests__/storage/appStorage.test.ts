import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

import type { PendingGroup } from '@/src/storage/appStorage';
import { appStorage } from '@/src/storage/appStorage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
  },
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;
const asyncStoredValues = new Map<string, string>();
const secureStoredValues = new Map<string, string>();

const createPendingGroup = (token: string): PendingGroup => ({
  token,
  groupName: `group-${token}`,
  email: `${token}@example.com`,
  expiresAt: new Date('2026-08-23T00:00:00.000Z'),
});

describe('appStorage', () => {
  beforeEach(() => {
    asyncStoredValues.clear();
    secureStoredValues.clear();
    jest.clearAllMocks();
    mockAsyncStorage.getItem.mockImplementation(async (key) => asyncStoredValues.get(key) ?? null);
    mockAsyncStorage.setItem.mockImplementation(async (key, value) => {
      asyncStoredValues.set(key, value);
    });
    mockSecureStore.getItemAsync.mockImplementation(
      async (key) => secureStoredValues.get(key) ?? null,
    );
    mockSecureStore.setItemAsync.mockImplementation(async (key, value) => {
      secureStoredValues.set(key, value);
    });
  });

  it('異なるGroup Keyを同時に追加しても両方を保持する', async () => {
    await Promise.all([appStorage.addGroupKey('first-key'), appStorage.addGroupKey('second-key')]);

    await expect(appStorage.getGroupKeys()).resolves.toEqual(['first-key', 'second-key']);
  });

  it('異なるPending Groupを同時に追加しても両方を保持する', async () => {
    await Promise.all([
      appStorage.addPendingGroupKey(createPendingGroup('first-token')),
      appStorage.addPendingGroupKey(createPendingGroup('second-token')),
    ]);

    await expect(appStorage.getPendingGroups()).resolves.toEqual([
      createPendingGroup('first-token'),
      createPendingGroup('second-token'),
    ]);
  });

  it('Group Keyの追加と削除が競合しても追加したキーを保持する', async () => {
    secureStoredValues.set('groupKeys', JSON.stringify(['existing-key']));

    await Promise.all([
      appStorage.addGroupKey('new-key'),
      appStorage.removeGroupKey('existing-key'),
    ]);

    await expect(appStorage.getGroupKeys()).resolves.toEqual(['new-key']);
  });

  it('保存に失敗しても後続のGroup Key操作を実行できる', async () => {
    mockSecureStore.setItemAsync.mockRejectedValueOnce(new Error('storage unavailable'));

    await expect(appStorage.addGroupKey('first-key')).rejects.toThrow('storage unavailable');
    await expect(appStorage.addGroupKey('second-key')).resolves.toBeUndefined();
    await expect(appStorage.getGroupKeys()).resolves.toEqual(['second-key']);
  });

  it.each([
    ['壊れたJSON', '{not-json'],
    ['配列以外', JSON.stringify({ key: 'unexpected' })],
    ['非文字列キーを含む配列', JSON.stringify(['valid-key', 1, null])],
  ])('%sのGroup Keyを空または有効なキーへ修復する', async (_label, storedValue) => {
    secureStoredValues.set('groupKeys', storedValue);

    await expect(appStorage.getGroupKeys()).resolves.toEqual(
      storedValue.includes('valid-key') ? ['valid-key'] : [],
    );
    expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
      'groupKeys',
      JSON.stringify(storedValue.includes('valid-key') ? ['valid-key'] : []),
    );
  });

  it('Pending Groupの追加と削除が競合しても追加した申請を保持する', async () => {
    asyncStoredValues.set('pendingGroupKeys', JSON.stringify([createPendingGroup('existing')]));

    await Promise.all([
      appStorage.addPendingGroupKey(createPendingGroup('new')),
      appStorage.removePendingGroupKey('existing'),
    ]);

    await expect(appStorage.getPendingGroups()).resolves.toEqual([createPendingGroup('new')]);
  });

  it('壊れたPending Group JSONを読み取り時に空配列へ修復する', async () => {
    asyncStoredValues.set('pendingGroupKeys', '{broken');

    await expect(appStorage.getPendingGroups()).resolves.toEqual([]);
    expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('pendingGroupKeys', '[]');
  });
});
