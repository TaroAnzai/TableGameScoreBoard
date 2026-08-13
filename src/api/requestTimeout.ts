export const GET_REQUEST_TIMEOUT_MS = 15_000;
export const MUTATION_REQUEST_TIMEOUT_MS = 30_000;

export type RequestOptions = RequestInit & {
  timeoutMs?: number;
};

export type RequestTimeoutError = {
  code: 'REQUEST_TIMEOUT';
  status: 408;
  statusText: 'Request timeout';
  timeoutMs: number;
  url: string;
  cause: unknown;
};

export const getRequestTimeoutMs = (method: string) =>
  method.toUpperCase() === 'GET' ? GET_REQUEST_TIMEOUT_MS : MUTATION_REQUEST_TIMEOUT_MS;

type AbortSource = 'caller' | 'timeout' | null;

/**
 * Runs an entire request, including reading its response body, with a timeout.
 * Caller-provided signals remain effective so React Query can still cancel GET requests.
 */
export const withRequestTimeout = async <T>({
  request,
  signals,
  timeoutMs,
  url,
}: {
  request: (signal: AbortSignal) => Promise<T>;
  signals: Array<AbortSignal | null | undefined>;
  timeoutMs: number;
  url: string;
}): Promise<T> => {
  const controller = new AbortController();
  const activeSignals = [...new Set(signals.filter((signal): signal is AbortSignal => !!signal))];
  let abortSource: AbortSource = null;

  const abortFromCaller = () => {
    abortSource ??= 'caller';
    controller.abort();
  };

  for (const signal of activeSignals) {
    if (signal.aborted) {
      abortFromCaller();
      break;
    }
    signal.addEventListener('abort', abortFromCaller, { once: true });
  }

  const timeoutId = setTimeout(() => {
    abortSource ??= 'timeout';
    controller.abort();
  }, timeoutMs);

  try {
    return await request(controller.signal);
  } catch (error) {
    if (abortSource === 'timeout') {
      throw {
        code: 'REQUEST_TIMEOUT',
        status: 408,
        statusText: 'Request timeout',
        timeoutMs,
        url,
        cause: error,
      } satisfies RequestTimeoutError;
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
    for (const signal of activeSignals) {
      signal.removeEventListener('abort', abortFromCaller);
    }
  }
};
