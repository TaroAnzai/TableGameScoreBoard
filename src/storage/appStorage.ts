// src/storage/appStorage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const GROUP_KEYS_KEY = 'groupKeys';
const PENDING_GROUP_KEYS_KEY = 'pendingGroupKeys';
let mutationQueue: Promise<void> = Promise.resolve();

const runSerialized = <T>(operation: () => Promise<T>): Promise<T> => {
  const result = mutationQueue.then(operation, operation);

  // Keep the queue usable after a storage failure while returning the original
  // result to the caller.
  mutationQueue = result.then(
    () => undefined,
    () => undefined,
  );

  return result;
};

const writeGroupKeys = (groupKeys: string[]) =>
  SecureStore.setItemAsync(GROUP_KEYS_KEY, JSON.stringify(groupKeys));

const readGroupKeys = async (): Promise<{ groupKeys: string[]; needsRepair: boolean }> => {
  const value = await SecureStore.getItemAsync(GROUP_KEYS_KEY);

  if (!value) {
    return { groupKeys: [], needsRepair: false };
  }

  try {
    const parsed: unknown = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return { groupKeys: [], needsRepair: true };
    }

    const groupKeys = parsed.filter((key): key is string => typeof key === 'string');
    return { groupKeys, needsRepair: groupKeys.length !== parsed.length };
  } catch {
    return { groupKeys: [], needsRepair: true };
  }
};

const writePendingGroups = (groups: PendingGroup[]) =>
  AsyncStorage.setItem(PENDING_GROUP_KEYS_KEY, JSON.stringify(groups));

const readPendingGroups = async (): Promise<{
  groups: PendingGroup[];
  needsRepair: boolean;
}> => {
  const value = await AsyncStorage.getItem(PENDING_GROUP_KEYS_KEY);

  if (!value) {
    return { groups: [], needsRepair: false };
  }

  try {
    const parsed: unknown = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return { groups: [], needsRepair: true };
    }

    const groups = parsed.filter(isPendingGroup).map((group) => ({
      ...group,
      email: typeof group.email === 'string' ? group.email : '',
      expiresAt: new Date(group.expiresAt),
    }));

    return { groups, needsRepair: groups.length !== parsed.length };
  } catch {
    return { groups: [], needsRepair: true };
  }
};

const isPendingGroup = (value: any): boolean => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'token' in value &&
    'groupName' in value &&
    'expiresAt' in value &&
    typeof (value as PendingGroup).token === 'string' &&
    typeof (value as PendingGroup).groupName === 'string' &&
    typeof (value as PendingGroup).expiresAt === 'string'
  );
};
export type PendingGroup = {
  token: string;
  groupName: string;
  email: string;
  expiresAt: Date; // 追加: 有効期限を管理するためのフィールド
};
export const appStorage = {
  async getGroupKeys(): Promise<string[]> {
    return runSerialized(async () => {
      const { groupKeys, needsRepair } = await readGroupKeys();

      if (needsRepair) {
        await writeGroupKeys(groupKeys);
      }

      return groupKeys;
    });
  },

  async setGroupKeys(groupKeys: string[]) {
    await runSerialized(() => writeGroupKeys(groupKeys));
  },
  async addGroupKey(groupKey: string) {
    await runSerialized(async () => {
      const { groupKeys, needsRepair } = await readGroupKeys();

      if (!groupKeys.includes(groupKey)) {
        groupKeys.push(groupKey);
        await writeGroupKeys(groupKeys);
      } else if (needsRepair) {
        await writeGroupKeys(groupKeys);
      }
    });
  },
  async removeGroupKey(groupKey: string) {
    await runSerialized(async () => {
      const { groupKeys } = await readGroupKeys();
      await writeGroupKeys(groupKeys.filter((key) => key !== groupKey));
    });
  },
  //*****************************
  // Pending Group Keysの管理
  //*****************************

  async getPendingGroups(): Promise<PendingGroup[]> {
    return runSerialized(async () => {
      const { groups, needsRepair } = await readPendingGroups();

      if (needsRepair) {
        await writePendingGroups(groups);
      }

      return groups;
    });
  },

  async setPendingGroups(groups: PendingGroup[]) {
    await runSerialized(() => writePendingGroups(groups));
  },

  async setPendingGroupTokens(groupTokens: string[]) {
    const groups = groupTokens.map((token) => ({
      token,
      groupName: '',
      email: '',
      expiresAt: new Date(),
    }));

    await runSerialized(() => writePendingGroups(groups));
  },

  async addPendingGroupKey(data: PendingGroup) {
    await runSerialized(async () => {
      const { groups, needsRepair } = await readPendingGroups();

      if (!groups.some((group) => group.token === data.token)) {
        groups.push(data);
        await writePendingGroups(groups);
      } else if (needsRepair) {
        await writePendingGroups(groups);
      }
    });
  },

  async removePendingGroupKey(groupToken: string) {
    await runSerialized(async () => {
      const { groups } = await readPendingGroups();
      await writePendingGroups(groups.filter((group) => group.token !== groupToken));
    });
  },
};
