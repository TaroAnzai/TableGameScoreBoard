// src/storage/appStorage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const GROUP_KEYS_KEY = 'groupKeys';
const PENDING_GROUP_KEYS_KEY = 'pendingGroupKeys';
type PendingGroup = {
  groupKey: string;
  groupName: string;
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

  async getPendingGroups(): Promise<PendingGroup[]> {
    const value = await AsyncStorage.getItem(PENDING_GROUP_KEYS_KEY);
    return value ? JSON.parse(value) : [];
  },

  async getPendingGroupKeys(): Promise<string[]> {
    const groups = await this.getPendingGroups();
    return groups.map((group) => group.groupKey);
  },

  async setPendingGroups(groups: PendingGroup[]) {
    await AsyncStorage.setItem(PENDING_GROUP_KEYS_KEY, JSON.stringify(groups));
  },

  async setPendingGroupKeys(groupKeys: string[]) {
    const groups = groupKeys.map((groupKey) => ({
      groupKey,
      groupName: '',
    }));

    await this.setPendingGroups(groups);
  },

  async addPendingGroupKey(groupKey: string, groupName: string) {
    const groups = await this.getPendingGroups();

    if (!groups.some((group) => group.groupKey === groupKey)) {
      groups.push({ groupKey, groupName });
      await this.setPendingGroups(groups);
    }
  },

  async removePendingGroupKey(groupKey: string) {
    const groups = await this.getPendingGroups();
    await this.setPendingGroups(groups.filter((group) => group.groupKey !== groupKey));
  },
};
