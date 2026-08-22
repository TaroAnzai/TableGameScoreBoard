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
});
