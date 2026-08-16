import {
  ApiError,
  createHttpError,
  isApiError,
  normalizeApiError,
  shouldRetryApiRequest,
} from '@/src/api/apiError';

describe('ApiError', () => {
  it.each([
    [400, false],
    [401, false],
    [403, false],
    [404, false],
    [408, true],
    [429, true],
    [500, true],
    [502, true],
    [503, true],
    [504, true],
  ])('classifies HTTP %i retryability', (status, retryable) => {
    const error = createHttpError({
      response: new Response(null, { status }),
      body: { detail: 'error' },
      url: 'https://example.com/api/tournaments/key',
      method: 'GET',
    });

    expect(error).toMatchObject({
      name: 'ApiError',
      kind: 'http',
      status,
      retryable,
      body: { detail: 'error' },
    });
    expect(isApiError(error)).toBe(true);
  });

  it('normalizes request timeouts as retryable ApiErrors', () => {
    const error = normalizeApiError({
      error: {
        code: 'REQUEST_TIMEOUT',
        status: 408,
        statusText: 'Request timeout',
      },
      url: 'https://example.com/api/tournaments/key',
      method: 'GET',
    });

    expect(error).toMatchObject({
      kind: 'timeout',
      status: 408,
      retryable: true,
    });
  });

  it('normalizes fetch failures as retryable network errors', () => {
    const cause = new TypeError('Network request failed');
    const error = normalizeApiError({
      error: cause,
      url: 'https://example.com/api/tournaments/key',
      method: 'GET',
    });

    expect(error).toMatchObject({
      kind: 'network',
      retryable: true,
      cause,
    });
  });

  it('does not retry cancelled, parse, or unknown errors', () => {
    const cancelled = new ApiError({
      kind: 'cancelled',
      message: 'cancelled',
      url: 'https://example.com',
      method: 'GET',
      retryable: false,
    });
    const parse = new ApiError({
      kind: 'parse',
      message: 'parse failed',
      url: 'https://example.com',
      method: 'GET',
      retryable: false,
    });

    expect(shouldRetryApiRequest(0, cancelled)).toBe(false);
    expect(shouldRetryApiRequest(0, parse)).toBe(false);
    expect(shouldRetryApiRequest(0, new Error('unknown'))).toBe(false);
  });

  it('allows at most three retries for retryable errors', () => {
    const error = new ApiError({
      kind: 'network',
      message: 'offline',
      url: 'https://example.com',
      method: 'GET',
      retryable: true,
    });

    expect(shouldRetryApiRequest(0, error)).toBe(true);
    expect(shouldRetryApiRequest(1, error)).toBe(true);
    expect(shouldRetryApiRequest(2, error)).toBe(true);
    expect(shouldRetryApiRequest(3, error)).toBe(false);
  });
});
