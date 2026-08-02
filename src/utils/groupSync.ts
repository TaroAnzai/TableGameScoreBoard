import { postApiGroupsRequestLinkStatus } from '@/src/api/generated/mahjongApi';
import { appStorage } from '@/src/storage/appStorage';

export const syncPendingGroups = async (): Promise<boolean> => {
  const pendingGroups = await appStorage.getPendingGroups();

  let changed = false;

  const results = await Promise.allSettled(
    pendingGroups.map(async (pending) => {
      const data = await postApiGroupsRequestLinkStatus({
        token: pending.token,
      });

      if (data.status === 'ready' && data.owner_link) {
        await appStorage.addGroupKey(data.owner_link);
        await appStorage.removePendingGroupKey(pending.token);

        return true;
      }

      if (data.status === 'expired' || data.status === 'invalid_token') {
        await appStorage.removePendingGroupKey(pending.token);

        return true;
      }

      return false;
    }),
  );

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      changed = true;
    }

    if (result.status === 'rejected') {
      console.error('Failed to check pending group:', result.reason);
    }
  }

  return changed;
};
