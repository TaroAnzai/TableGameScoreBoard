import { isApiError } from '@/src/api/apiError';
import type { Group } from '@/src/api/generated/mahjongApi.schemas';
import { isGroupKeyStorageError } from '@/src/errors/GroupKeyStorageError';

const attempts = new Map<string, Promise<Group>>();

export const getOrStartGroupCreationAttempt = (
  token: string,
  create: () => Promise<Group>,
): Promise<Group> => {
  const existing = attempts.get(token);
  if (existing) return existing;

  const attempt = create();
  attempts.set(token, attempt);

  void attempt.catch((error) => {
    // API failures are safe to retry because the server did not return a
    // successful creation result. A persistence failure must stay cached:
    // the group already exists and retrying the token would duplicate POST.
    if (isApiError(error) && !isGroupKeyStorageError(error)) {
      attempts.delete(token);
    }
  });

  return attempt;
};

export const clearGroupCreationAttempts = () => attempts.clear();
