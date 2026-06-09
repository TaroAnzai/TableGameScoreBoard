// src/storage/appStorage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const GROUP_KEYS_KEY = 'groupKeys';

export const appStorage = {
  async getGroupKeys(): Promise<string[]> {
    const value = await AsyncStorage.getItem(GROUP_KEYS_KEY);
    return value ? JSON.parse(value) : [];
  },

  async setGroupKeys(groupKeys: string[]) {
    await AsyncStorage.setItem(GROUP_KEYS_KEY, JSON.stringify(groupKeys));
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
};
