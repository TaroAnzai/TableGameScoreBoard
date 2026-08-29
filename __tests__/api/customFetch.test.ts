import { customFetch } from '@/src/api/customFetch';
import { customFetchAdmin } from '@/src/api/customFetchAdmin';

jest.mock('@/src/api/loadEnv', () => ({
  API_BASE_URL: 'https://api.example.com',
}));

const successfulResponse = {
  ok: true,
  headers: { get: () => 'application/json' },
  json: async () => ({ ok: true }),
};

describe.each([
  ['customFetch', customFetch],
  ['customFetchAdmin', customFetchAdmin],
])('%s', (_name, request) => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    fetchMock.mockResolvedValue(successfulResponse);
    globalThis.fetch = fetchMock as typeof fetch;
  });

  it('nullとundefinedのクエリ値を送信しない', async () => {
    await request({
      url: '/api/groups',
      method: 'GET',
      params: { start_date: null, end_date: undefined, page: 0, keyword: '' },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/api/groups?page=0&keyword=',
      expect.any(Object),
    );
  });

  it('有効なクエリ値がない場合は末尾に?を付けない', async () => {
    await request({
      url: '/api/groups',
      method: 'GET',
      params: { start_date: null, end_date: undefined },
    });

    expect(fetchMock).toHaveBeenCalledWith('https://api.example.com/api/groups', expect.any(Object));
  });

  it('既存クエリがあるURLには&でクエリを追加する', async () => {
    await request({ url: '/api/groups?sort=name', method: 'GET', params: { page: 2 } });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/api/groups?sort=name&page=2',
      expect.any(Object),
    );
  });

  it('204 No ContentはJSON解析せずundefinedを返す', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 204,
      headers: { get: () => null },
    });

    await expect(request({ url: '/api/groups/1', method: 'DELETE' })).resolves.toBeUndefined();
  });

  it('呼び出し側のheadersがContent-Typeを上書きする', async () => {
    await request({
      url: '/api/groups',
      method: 'POST',
      headers: { 'Content-Type': 'text/plain', 'X-Request': 'config' },
    }, { headers: { 'X-Request': 'options' } });

    const requestInit = fetchMock.mock.calls.at(-1)?.[1] as RequestInit;
    expect(requestInit.headers).toMatchObject({
      'Content-Type': 'text/plain',
      'X-Request': 'options',
    });
  });

  it('POSTデータをJSON bodyとして送信し、JSONレスポンスを返す', async () => {
    await expect(
      request<{ ok: boolean }>({ url: '/api/groups', method: 'POST', data: { name: 'group' } }),
    ).resolves.toEqual({ ok: true });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/api/groups',
      expect.objectContaining({ body: JSON.stringify({ name: 'group' }) }),
    );
  });

  it('JSON以外の成功レスポンスはtextとして返す', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => 'text/plain' },
      text: async () => 'plain response',
    });

    await expect(request<string>({ url: '/health', method: 'GET' })).resolves.toBe(
      'plain response',
    );
  });

  it('JSON解析失敗をparse種別のAPIエラーとして返す', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json; charset=utf-8' },
      json: async () => Promise.reject(new SyntaxError('invalid json')),
    });

    await expect(request({ url: '/broken-json', method: 'GET' })).rejects.toMatchObject({
      kind: 'parse',
      message: 'Failed to parse JSON response',
      retryable: false,
    });
  });

  it('HTTPエラー本文がJSONでなくてもステータス情報を保持する', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
      headers: { get: () => 'text/html' },
      json: async () => Promise.reject(new SyntaxError('not json')),
    });

    await expect(request({ url: '/unavailable', method: 'GET' })).rejects.toMatchObject({
      kind: 'http',
      status: 503,
    });
  });
});
