import { postApiV2GroupsRequestLinkStatusbatch } from '@/src/api/generated/mahjongApi';
import { appStorage, type PendingGroup } from '@/src/storage/appStorage';
import { syncPendingGroups } from '@/src/utils/groupSync';

jest.mock('@/src/api/generated/mahjongApi', () => ({
  postApiV2GroupsRequestLinkStatusbatch: jest.fn(),
}));
jest.mock('@/src/storage/appStorage', () => ({
  appStorage: {
    getPendingGroups: jest.fn(),
    addGroupKey: jest.fn(),
    removePendingGroupKey: jest.fn(),
  },
}));

const api = postApiV2GroupsRequestLinkStatusbatch as jest.MockedFunction<
  typeof postApiV2GroupsRequestLinkStatusbatch
>;
const storage = appStorage as jest.Mocked<typeof appStorage>;
const pending: PendingGroup[] = ['first', 'second', 'third', 'fourth'].map((token) => ({
  token,
  groupName: token,
  email: `${token}@example.com`,
  expiresAt: new Date('2026-12-31T00:00:00.000Z'),
}));

describe('syncPendingGroups', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    storage.getPendingGroups.mockResolvedValue(pending);
    storage.addGroupKey.mockResolvedValue(undefined);
    storage.removePendingGroupKey.mockResolvedValue(undefined);
  });

  it('結果の順番に依存せず ready・expired・invalid_token だけを反映する', async () => {
    api.mockResolvedValue({
      results: [
        { client_id: '2', status: 'pending' },
        { client_id: '0', status: 'ready', owner_link: 'owner-key' },
        { client_id: '3', status: 'invalid_token' },
        { client_id: '1', status: 'expired' },
      ],
    } as never);

    await expect(syncPendingGroups()).resolves.toBe(true);
    expect(storage.addGroupKey).toHaveBeenCalledWith('owner-key');
    expect(storage.removePendingGroupKey).toHaveBeenCalledWith('first');
    expect(storage.removePendingGroupKey).toHaveBeenCalledWith('second');
    expect(storage.removePendingGroupKey).toHaveBeenCalledWith('fourth');
    expect(storage.removePendingGroupKey).not.toHaveBeenCalledWith('third');
  });

  it('不正なclient_idは無視する', async () => {
    api.mockResolvedValue({
      results: [{ client_id: 'not-a-number', status: 'ready', owner_link: 'wrong-key' }],
    } as never);

    await expect(syncPendingGroups()).resolves.toBe(false);
    expect(storage.addGroupKey).not.toHaveBeenCalled();
    expect(storage.removePendingGroupKey).not.toHaveBeenCalled();
  });

  it('APIまたはストレージ処理の失敗時は例外を外へ出さず変更なしを返す', async () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    api.mockRejectedValueOnce(new Error('offline'));
    await expect(syncPendingGroups()).resolves.toBe(false);

    api.mockResolvedValueOnce({
      results: [{ client_id: '0', status: 'ready', owner_link: 'owner-key' }],
    } as never);
    storage.addGroupKey.mockRejectedValueOnce(new Error('secure storage unavailable'));
    await expect(syncPendingGroups()).resolves.toBe(false);
    log.mockRestore();
  });
});
