/**
 * customFetch.ts
 * Orvalのmutator用fetchラッパー
 */
import { ApiError, createHttpError, normalizeApiError } from '@/src/api/apiError';
import { API_BASE_URL } from '@/src/api/loadEnv';
import {
  getRequestTimeoutMs,
  type RequestOptions,
  withRequestTimeout,
} from '@/src/api/requestTimeout';
interface CustomFetchConfig {
  url: string;
  method: string;
  data?: any;
  params?: Record<string, string | number | null>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

/**
 * Orvalが自動生成したfetch呼び出しを共通化
 */
export const customFetch = async <T>(
  config: CustomFetchConfig,
  options?: RequestOptions,
): Promise<T> => {
  // ✅ ベースURLを組み込む
  const fullUrl = `${API_BASE_URL}${config.url}`;
  // クエリパラメータ処理
  let urlWithParams = fullUrl;
  if (config.params) {
    const query = new URLSearchParams(
      Object.entries(config.params).map(([k, v]) => [k, String(v)]),
    );
    urlWithParams += `?${query}`;
  }

  const {
    signal: optionSignal,
    timeoutMs = getRequestTimeoutMs(config.method),
    ...requestOptions
  } = options ?? {};

  try {
    return await withRequestTimeout({
      url: urlWithParams,
      timeoutMs,
      signals: [config.signal, optionSignal],
      request: async (signal) => {
        const response = await fetch(urlWithParams, {
          ...requestOptions,
          method: config.method,
          headers: {
            'Content-Type': 'application/json',
            ...(config.headers || {}),
            ...(requestOptions.headers || {}),
          },
          body: config.data && config.method !== 'GET' ? JSON.stringify(config.data) : undefined,
          signal,
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw createHttpError({
            response,
            body: errorBody,
            url: urlWithParams,
            method: config.method,
          });
        }

        // JSON以外のレスポンスにも対応
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          try {
            return (await response.json()) as T;
          } catch (error) {
            throw new ApiError({
              kind: 'parse',
              message: 'Failed to parse JSON response',
              url: urlWithParams,
              method: config.method,
              retryable: false,
              cause: error,
            });
          }
        }
        return (await response.text()) as T;
      },
    });
  } catch (error) {
    throw normalizeApiError({
      error,
      url: urlWithParams,
      method: config.method,
      cancelled: config.signal?.aborted || optionSignal?.aborted,
    });
  }
};
