import AsyncStorage from '@react-native-async-storage/async-storage';

import { savedLinkStorage } from '@/src/storage/savedLinkStorage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
  },
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const storedValues = new Map<string, string>();

const createLink = (
  overrides: Partial<{
    type: 'tournament' | 'table';
    key: string;
    name: string;
    accessLevel: 'VIEW' | 'EDIT' | 'OWNER';
    tournamentKey: string;
    parentGroupName: string;
    parentTournamentName: string;
  }> = {},
) => ({
  type: 'tournament' as const,
  key: 'tournament-key',
  name: '大会名',
  ...overrides,
});

describe('savedLinkStorage', () => {
  beforeEach(() => {
    storedValues.clear();
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-20T00:00:00.000Z'));
    mockAsyncStorage.getItem.mockImplementation(async (key) => storedValues.get(key) ?? null);
    mockAsyncStorage.setItem.mockImplementation(async (key, value) => {
      storedValues.set(key, value);
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('空状態では空配列を返す', async () => {
    await expect(savedLinkStorage.getSavedLinks()).resolves.toEqual([]);
  });

  it('新規保存時に日時を設定して取得できる', async () => {
    const saved = await savedLinkStorage.upsertSavedLink(createLink());

    expect(saved).toEqual({
      type: 'tournament',
      key: 'tournament-key',
      name: '大会名',
      savedAt: '2026-08-20T00:00:00.000Z',
      lastOpenedAt: '2026-08-20T00:00:00.000Z',
    });
    await expect(savedLinkStorage.getSavedLink('tournament', 'tournament-key')).resolves.toEqual(
      saved,
    );
  });

  it('同じ項目を再保存しても重複させず、初回保存日時を保持する', async () => {
    const first = await savedLinkStorage.upsertSavedLink(createLink());
    jest.setSystemTime(new Date('2026-08-20T01:00:00.000Z'));

    const saved = await savedLinkStorage.upsertSavedLink(createLink({ name: '正式な大会名' }));

    expect(await savedLinkStorage.getSavedLinks()).toEqual([saved]);
    expect(saved).toMatchObject({
      name: '正式な大会名',
      savedAt: first.savedAt,
      lastOpenedAt: '2026-08-20T01:00:00.000Z',
    });
  });

  it('親リソース名を保存し、再保存時にも未指定の親リソース名を保持する', async () => {
    await savedLinkStorage.upsertSavedLink(
      createLink({
        parentGroupName: 'グループ1',
        parentTournamentName: '大会1',
      }),
    );

    const saved = await savedLinkStorage.upsertSavedLink(createLink({ name: '大会名を更新' }));

    expect(saved).toMatchObject({
      parentGroupName: 'グループ1',
      parentTournamentName: '大会1',
    });
  });

  it('アクセスレベルを保存し、再保存時にも未指定なら保持する', async () => {
    await savedLinkStorage.upsertSavedLink(createLink({ accessLevel: 'OWNER' }));

    const saved = await savedLinkStorage.upsertSavedLink(createLink({ name: '大会名を更新' }));

    expect(saved.accessLevel).toBe('OWNER');
  });

  it('不正なアクセスレベルを持つ保存データを除外する', async () => {
    storedValues.set(
      'savedLinks',
      JSON.stringify([
        {
          ...createLink(),
          accessLevel: 'ADMIN',
          savedAt: '2026-08-20T00:00:00.000Z',
          lastOpenedAt: '2026-08-20T00:00:00.000Z',
        },
      ]),
    );

    await expect(savedLinkStorage.getSavedLinks()).resolves.toEqual([]);
  });

  it('親リソース名の形式が不正な保存データを除外する', async () => {
    storedValues.set(
      'savedLinks',
      JSON.stringify([
        {
          ...createLink(),
          savedAt: '2026-08-20T00:00:00.000Z',
          lastOpenedAt: '2026-08-20T00:00:00.000Z',
          parentGroupName: 123,
        },
      ]),
    );

    await expect(savedLinkStorage.getSavedLinks()).resolves.toEqual([]);
  });

  it('大会と卓で同じキーでも別の項目として保存する', async () => {
    await savedLinkStorage.upsertSavedLink(createLink({ key: 'shared-key' }));
    await savedLinkStorage.upsertSavedLink(
      createLink({ type: 'table', key: 'shared-key', name: '卓名', tournamentKey: 'parent-key' }),
    );

    await expect(savedLinkStorage.getSavedLinks()).resolves.toEqual([
      expect.objectContaining({ type: 'tournament', key: 'shared-key' }),
      expect.objectContaining({ type: 'table', key: 'shared-key', tournamentKey: 'parent-key' }),
    ]);
  });

  it('削除、名称更新、最終表示日時更新を行える', async () => {
    await savedLinkStorage.upsertSavedLink(createLink());
    await savedLinkStorage.updateSavedLinkName('tournament', 'tournament-key', '更新後の大会名');
    jest.setSystemTime(new Date('2026-08-20T02:00:00.000Z'));
    const touched = await savedLinkStorage.touchSavedLink('tournament', 'tournament-key');

    expect(touched).toMatchObject({
      name: '更新後の大会名',
      lastOpenedAt: '2026-08-20T02:00:00.000Z',
    });

    await savedLinkStorage.removeSavedLink('tournament', 'tournament-key');
    await expect(savedLinkStorage.getSavedLinks()).resolves.toEqual([]);
  });

  it('不正なJSONを空配列へ回復する', async () => {
    storedValues.set('savedLinks', '{invalid json');

    await expect(savedLinkStorage.getSavedLinks()).resolves.toEqual([]);
    expect(storedValues.get('savedLinks')).toBe('[]');
  });

  it('異なる2件を同時に保存しても両方を保持する', async () => {
    await Promise.all([
      savedLinkStorage.upsertSavedLink(createLink({ key: 'first-key' })),
      savedLinkStorage.upsertSavedLink(createLink({ key: 'second-key' })),
    ]);

    expect(await savedLinkStorage.getSavedLinks()).toEqual([
      expect.objectContaining({ key: 'first-key' }),
      expect.objectContaining({ key: 'second-key' }),
    ]);
  });

  it('同じ項目を同時に保存しても重複させない', async () => {
    await Promise.all([
      savedLinkStorage.upsertSavedLink(createLink({ name: '最初の名前' })),
      savedLinkStorage.upsertSavedLink(createLink({ name: '最後の名前' })),
    ]);

    await expect(savedLinkStorage.getSavedLinks()).resolves.toEqual([
      expect.objectContaining({ name: '最後の名前' }),
    ]);
  });

  it('保存と削除が競合してもデータを破損しない', async () => {
    const save = savedLinkStorage.upsertSavedLink(createLink());
    const remove = savedLinkStorage.removeSavedLink('tournament', 'tournament-key');

    await Promise.all([save, remove]);

    await expect(savedLinkStorage.getSavedLinks()).resolves.toEqual([]);
  });

  it('操作が失敗しても後続の操作を実行できる', async () => {
    mockAsyncStorage.setItem.mockRejectedValueOnce(new Error('storage unavailable'));

    await expect(savedLinkStorage.upsertSavedLink(createLink())).rejects.toThrow(
      'storage unavailable',
    );
    await expect(
      savedLinkStorage.upsertSavedLink(createLink({ key: 'second-key' })),
    ).resolves.toMatchObject({ key: 'second-key' });
  });
});
