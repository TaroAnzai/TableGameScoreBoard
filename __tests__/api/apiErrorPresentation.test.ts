import { ApiError } from '@/src/api/apiError';
import { getUserFacingApiError } from '@/src/api/apiErrorPresentation';

const createError = ({
  kind = 'http',
  status,
  retryable = false,
  body,
}: Partial<ConstructorParameters<typeof ApiError>[0]> = {}) =>
  new ApiError({
    kind,
    message: 'Technical error message',
    url: 'https://example.com/api/resource',
    method: 'GET',
    status,
    retryable,
    body,
  });

describe('getUserFacingApiError', () => {
  it.each([
    [400, 'validation'],
    [401, 'unauthorized'],
    [403, 'forbidden'],
    [404, 'notFound'],
    [408, 'timeout'],
    [409, 'conflict'],
    [410, 'notFound'],
    [422, 'validation'],
    [429, 'rateLimited'],
    [500, 'server'],
    [503, 'server'],
    [418, 'unknown'],
  ] as const)('maps HTTP %i to %s', (status, category) => {
    expect(getUserFacingApiError(createError({ status }))).toMatchObject({ category });
  });

  it.each([
    ['network', 'network'],
    ['timeout', 'timeout'],
    ['parse', 'invalidResponse'],
    ['cancelled', 'unknown'],
  ] as const)('maps %s errors to %s', (kind, category) => {
    expect(getUserFacingApiError(createError({ kind }))).toMatchObject({ category });
  });

  it('uses retryability from ApiError', () => {
    expect(getUserFacingApiError(createError({ status: 503, retryable: true })).canRetry).toBe(
      true,
    );
    expect(getUserFacingApiError(createError({ status: 404, retryable: false })).canRetry).toBe(
      false,
    );
  });

  it('does not expose technical messages or response bodies', () => {
    const result = getUserFacingApiError(
      createError({
        status: 500,
        body: { message: 'SQL connection failed at db.internal:5432' },
      }),
    );

    expect(result.message).not.toContain('Technical error message');
    expect(result.message).not.toContain('SQL connection');
  });

  it('allows a context-specific message override by category', () => {
    const result = getUserFacingApiError(createError({ status: 404 }), {
      messageOverrides: {
        notFound: '大会が見つかりませんでした。',
      },
    });

    expect(result).toMatchObject({
      category: 'notFound',
      message: '大会が見つかりませんでした。',
      canRetry: false,
    });
  });

  it('uses a caller fallback only for unknown errors', () => {
    expect(
      getUserFacingApiError(new Error('unexpected'), { unknownMessage: '再試行してください' }),
    ).toMatchObject({
      category: 'unknown',
      message: '再試行してください',
      canRetry: false,
    });
  });
});
