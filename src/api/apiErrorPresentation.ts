import i18n from '@/src/i18n/i18n';

import { isApiError } from './apiError';

export type UserFacingApiErrorCategory =
  | 'network'
  | 'timeout'
  | 'unauthorized'
  | 'forbidden'
  | 'notFound'
  | 'conflict'
  | 'validation'
  | 'rateLimited'
  | 'server'
  | 'invalidResponse'
  | 'unknown';

export type UserFacingApiError = {
  category: UserFacingApiErrorCategory;
  message: string;
  canRetry: boolean;
};

export type UserFacingApiErrorOptions = {
  messageOverrides?: Partial<Record<UserFacingApiErrorCategory, string>>;
  unknownMessage?: string;
};

const getHttpCategory = (status: number | undefined): UserFacingApiErrorCategory => {
  if (status === 408) return 'timeout';
  if (status === 400 || status === 422) return 'validation';
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404 || status === 410) return 'notFound';
  if (status === 409) return 'conflict';
  if (status === 429) return 'rateLimited';
  if (status !== undefined && status >= 500 && status <= 599) return 'server';
  return 'unknown';
};

const getCategory = (error: unknown): UserFacingApiErrorCategory => {
  if (!isApiError(error)) return 'unknown';

  switch (error.kind) {
    case 'network':
      return 'network';
    case 'timeout':
      return 'timeout';
    case 'parse':
      return 'invalidResponse';
    case 'http':
      return getHttpCategory(error.status);
    case 'cancelled':
      return 'unknown';
  }
};

export const getUserFacingApiError = (
  error: unknown,
  options: UserFacingApiErrorOptions = {},
): UserFacingApiError => {
  const category = getCategory(error);
  const defaultMessage = i18n.t(`apiErrors.${category}`);

  return {
    category,
    message:
      options.messageOverrides?.[category] ??
      (category === 'unknown' ? options.unknownMessage : undefined) ??
      defaultMessage,
    canRetry: isApiError(error) && error.retryable,
  };
};
