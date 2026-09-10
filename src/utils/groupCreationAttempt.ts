import { isApiError } from '@/src/api/apiError';
import type { Group } from '@/src/api/generated/mahjongApi.schemas';

const attempts = new Map<string, Promise<Group>>();

export const isGroupCreationOutcomeUncertain = (error: unknown): boolean =>
  isApiError(error) && (error.kind !== 'http' || error.retryable);

export const getOrStartGroupCreationAttempt = (
  token: string,
  create: () => Promise<Group>,
): Promise<Group> => {
  const existing = attempts.get(token);
  if (existing) return existing;

  const attempt = create();
  attempts.set(token, attempt);

  void attempt.catch((error) => {
    // Only a definitive HTTP rejection proves that the create request did not
    // succeed. Transport, timeout, parse, and retryable HTTP failures may have
    // happened after the server consumed the one-time token.
    if (isApiError(error) && !isGroupCreationOutcomeUncertain(error)) {
      attempts.delete(token);
    }
  });

  return attempt;
};

export const completeGroupCreationAttempt = (token: string) => attempts.delete(token);

export const clearGroupCreationAttempts = () => attempts.clear();
