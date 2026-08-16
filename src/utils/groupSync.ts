import { postApiV2GroupsRequestLinkStatusbatch } from '@/src/api/generated/mahjongApi';
import { appStorage } from '@/src/storage/appStorage';

export const syncPendingGroups = async (): Promise<boolean> => {
  const pendingGroups = await appStorage.getPendingGroups();

  let changed = false;

  if (pendingGroups.length === 0) return false;

  try {
    const response = await postApiV2GroupsRequestLinkStatusbatch({
      items: pendingGroups.map((pending, index) => ({
        client_id: String(index),
        token: pending.token,
      })),
    });

    for (const data of response.results) {
      const pending = pendingGroups[Number(data.client_id)];
      if (!pending) continue;

      if (data.status === 'ready' && data.owner_link) {
        await appStorage.addGroupKey(data.owner_link);
        await appStorage.removePendingGroupKey(pending.token);

        changed = true;
        continue;
      }

      if (data.status === 'expired' || data.status === 'invalid_token') {
        await appStorage.removePendingGroupKey(pending.token);

        changed = true;
      }
    }
  } catch (error) {
    console.log('Failed to check pending groups:', error);
  }

  return changed;
};
