export type ApiErrorKind = 'http' | 'network' | 'timeout' | 'parse' | 'cancelled';

export type ApiErrorOptions = {
  kind: ApiErrorKind;
  message: string;
  url: string;
  method: string;
  retryable: boolean;
  status?: number;
  statusText?: string;
  body?: unknown;
  cause?: unknown;
};

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly url: string;
  readonly method: string;
  readonly retryable: boolean;
  readonly status?: number;
  readonly statusText?: string;
  readonly body?: unknown;
  readonly cause?: unknown;

  constructor(options: ApiErrorOptions) {
    super(options.message);
    this.name = 'ApiError';
    this.kind = options.kind;
    this.url = options.url;
    this.method = options.method;
    this.retryable = options.retryable;
    this.status = options.status;
    this.statusText = options.statusText;
    this.body = options.body;
    this.cause = options.cause;
  }
}

export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError;

const isTimeoutError = (error: unknown): error is { status: 408; statusText: string } =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  error.code === 'REQUEST_TIMEOUT';

const isAbortError = (error: unknown) =>
  typeof error === 'object' && error !== null && 'name' in error && error.name === 'AbortError';

export const isRetryableHttpStatus = (status: number) =>
  status === 408 ||
  status === 425 ||
  status === 429 ||
  status === 500 ||
  status === 502 ||
  status === 503 ||
  status === 504;

export const createHttpError = ({
  response,
  body,
  url,
  method,
}: {
  response: Response;
  body: unknown;
  url: string;
  method: string;
}) =>
  new ApiError({
    kind: 'http',
    message: `HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ''}`,
    status: response.status,
    statusText: response.statusText,
    body,
    url,
    method,
    retryable: isRetryableHttpStatus(response.status),
  });

export const normalizeApiError = ({
  error,
  url,
  method,
  cancelled = false,
}: {
  error: unknown;
  url: string;
  method: string;
  cancelled?: boolean;
}): ApiError => {
  if (isApiError(error)) return error;

  if (isTimeoutError(error)) {
    return new ApiError({
      kind: 'timeout',
      message: error.statusText,
      status: error.status,
      statusText: error.statusText,
      url,
      method,
      retryable: true,
      cause: error,
    });
  }

  if (cancelled || isAbortError(error)) {
    return new ApiError({
      kind: 'cancelled',
      message: 'Request cancelled',
      url,
      method,
      retryable: false,
      cause: error,
    });
  }

  return new ApiError({
    kind: 'network',
    message: error instanceof Error ? error.message : 'Network request failed',
    url,
    method,
    retryable: true,
    cause: error,
  });
};

export const shouldRetryApiRequest = (failureCount: number, error: unknown) =>
  failureCount < 3 && isApiError(error) && error.retryable;
