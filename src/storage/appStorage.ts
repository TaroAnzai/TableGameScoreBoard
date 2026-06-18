// src/storage/appStorage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const GROUP_KEYS_KEY = 'groupKeys';
const PENDING_GROUP_KEYS_KEY = 'pendingGroupKeys';
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
  expiresAt: Date; // 追加: 有効期限を管理するためのフィールド
};
export const appStorage = {
  async getGroupKeys(): Promise<string[]> {
    const value = await SecureStore.getItemAsync(GROUP_KEYS_KEY);
    return value ? JSON.parse(value) : [];
  },

  async setGroupKeys(groupKeys: string[]) {
    await SecureStore.setItemAsync(GROUP_KEYS_KEY, JSON.stringify(groupKeys));
  },
  async addGroupKey(groupKey: string) {
    const groupKeys = await this.getGroupKeys();

    if (!groupKeys.includes(groupKey)) {
      groupKeys.push(groupKey);
      await this.setGroupKeys(groupKeys);
    }
  },
  async removeGroupKey(groupKey: string) {
    const groupKeys = await this.getGroupKeys();
    await this.setGroupKeys(groupKeys.filter((key) => key !== groupKey));
  },
  //*****************************
  // Pending Group Keysの管理
  //*****************************

  async getPendingGroups(): Promise<PendingGroup[]> {
    const value = await AsyncStorage.getItem(PENDING_GROUP_KEYS_KEY);
    console.log('Loaded pending groups from storage:', value);

    if (!value) {
      return [];
    }

    try {
      const parsed: unknown = JSON.parse(value);

      if (!Array.isArray(parsed)) {
        console.error('Invalid pending groups format: expected an array');
        await AsyncStorage.setItem(PENDING_GROUP_KEYS_KEY, JSON.stringify([]));
        return [];
      }

      const validGroups = parsed
        .filter(isPendingGroup)
        .map((group) => ({ ...group, expiresAt: new Date(group.expiresAt) }));

      if (validGroups.length !== parsed.length) {
        console.warn('Some pending groups were invalid and have been removed:', parsed);
        await AsyncStorage.setItem(PENDING_GROUP_KEYS_KEY, JSON.stringify(validGroups));
      }

      return validGroups;
    } catch (error) {
      console.error('Failed to parse pending groups:', error);

      await AsyncStorage.setItem(PENDING_GROUP_KEYS_KEY, JSON.stringify([]));
      return [];
    }
  },

  async getPendingGroupTokens(): Promise<string[]> {
    const groups = await this.getPendingGroups();
    return groups.map((group) => group.token);
  },

  async setPendingGroups(groups: PendingGroup[]) {
    await AsyncStorage.setItem(PENDING_GROUP_KEYS_KEY, JSON.stringify(groups));
  },

  async setPendingGroupTokens(groupTokens: string[]) {
    const groups = groupTokens.map((token) => ({
      token,
      groupName: '',
      expiresAt: new Date(),
    }));

    await this.setPendingGroups(groups);
  },

  async addPendingGroupKey(data: PendingGroup) {
    const groups = await this.getPendingGroups();

    if (!groups.some((group) => group.token === data.token)) {
      groups.push(data);
      console.log('Adding pending group key:', data);
      await this.setPendingGroups(groups);
    }
  },

  async removePendingGroupKey(groupToken: string) {
    const groups = await this.getPendingGroups();
    await this.setPendingGroups(groups.filter((group) => group.token !== groupToken));
  },
};
