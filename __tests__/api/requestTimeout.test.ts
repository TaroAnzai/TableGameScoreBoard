import {
  GET_REQUEST_TIMEOUT_MS,
  getRequestTimeoutMs,
  MUTATION_REQUEST_TIMEOUT_MS,
  withRequestTimeout,
} from '@/src/api/requestTimeout';

const abortablePendingRequest = (signal: AbortSignal) =>
  new Promise<never>((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
  });

describe('requestTimeout', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('uses a shorter timeout for GET requests', () => {
    expect(getRequestTimeoutMs('GET')).toBe(GET_REQUEST_TIMEOUT_MS);
    expect(getRequestTimeoutMs('get')).toBe(GET_REQUEST_TIMEOUT_MS);
    expect(getRequestTimeoutMs('POST')).toBe(MUTATION_REQUEST_TIMEOUT_MS);
    expect(getRequestTimeoutMs('DELETE')).toBe(MUTATION_REQUEST_TIMEOUT_MS);
  });

  it('rejects a pending request with a structured timeout error', async () => {
    const promise = withRequestTimeout({
      request: abortablePendingRequest,
      signals: [],
      timeoutMs: 1_000,
      url: 'https://example.com/api/groups',
    });
    const expectation = expect(promise).rejects.toMatchObject({
      code: 'REQUEST_TIMEOUT',
      status: 408,
      statusText: 'Request timeout',
      timeoutMs: 1_000,
      url: 'https://example.com/api/groups',
    });

    await jest.advanceTimersByTimeAsync(1_000);

    await expectation;
  });

  it('preserves cancellation from a caller instead of reporting a timeout', async () => {
    const callerController = new AbortController();
    const promise = withRequestTimeout({
      request: abortablePendingRequest,
      signals: [callerController.signal],
      timeoutMs: 1_000,
      url: 'https://example.com/api/groups',
    });

    callerController.abort();

    await expect(promise).rejects.toThrow('aborted');
    expect(jest.getTimerCount()).toBe(0);
  });

  it('clears its timer after the complete request operation succeeds', async () => {
    await expect(
      withRequestTimeout({
        request: async () => ({ id: 1 }),
        signals: [],
        timeoutMs: 1_000,
        url: 'https://example.com/api/groups',
      }),
    ).resolves.toEqual({ id: 1 });

    expect(jest.getTimerCount()).toBe(0);
  });
});
