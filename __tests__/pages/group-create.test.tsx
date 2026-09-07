import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

import GroupCreatePage from '@/app/group/create';
import { ApiError } from '@/src/api/apiError';
import { clearGroupCreationAttempts } from '@/src/utils/groupCreationAttempt';
import { GroupKeyStorageError } from '@/src/errors/GroupKeyStorageError';

const mockReplace = jest.fn();
const mockParams = jest.fn(() => ({ token: 'valid-token' }));
const mockAddGroupKey = jest.fn();
const mockCreateGroup = jest.fn();
const mockAddListener = jest.fn(
  (_event: string, _listener: (event: { preventDefault: () => void }) => void) => jest.fn(),
);

jest.mock('expo-router', () => ({
  router: { replace: (...args: unknown[]) => mockReplace(...args) },
  useLocalSearchParams: () => mockParams(),
  useNavigation: () => ({ addListener: mockAddListener }),
}));
jest.mock('@/src/hooks/useGroups', () => ({
  useCreateGroup: () => ({ mutateAsync: mockCreateGroup }),
}));
jest.mock('@/src/storage/appStorage', () => ({
  appStorage: {
    addGroupKey: (...args: unknown[]) => mockAddGroupKey(...args),
  },
}));

describe('招待グループ作成ページ', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearGroupCreationAttempts();
    mockParams.mockReturnValue({ token: 'valid-token' });
    mockCreateGroup.mockResolvedValue({ owner_link: 'owner-key' });
    mockAddGroupKey.mockResolvedValue(undefined);
  });

  it('中央に登録中表示を出し、作成したグループへ履歴を残さず遷移する', async () => {
    await render(<GroupCreatePage />);

    expect(screen.getByText('グループを登録しています')).toBeTruthy();
    expect(screen.getByText('登録が完了するまで、この画面のままお待ちください。')).toBeTruthy();
    expect(screen.getByLabelText('グループを登録しています')).toBeTruthy();

    await waitFor(() => expect(mockCreateGroup).toHaveBeenCalledWith({ token: 'valid-token' }));
    expect(mockReplace).toHaveBeenCalledWith('/group/owner-key');
  });

  it('再レンダーされても作成APIを重複実行しない', async () => {
    let resolveRequest: (value: { owner_link: string }) => void = () => undefined;
    mockCreateGroup.mockImplementation(() => new Promise((resolve) => (resolveRequest = resolve)));
    const result = await render(<GroupCreatePage />);

    await result.rerender(<GroupCreatePage />);
    await waitFor(() => expect(mockCreateGroup).toHaveBeenCalledTimes(1));

    resolveRequest({ owner_link: 'owner-key' });
  });

  it('外部navigation resetで再マウントされても同じtokenのAPIを1回だけ実行する', async () => {
    let resolveRequest: (value: { owner_link: string }) => void = () => undefined;
    mockCreateGroup.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        }),
    );
    const firstMount = await render(<GroupCreatePage />);

    await waitFor(() => expect(mockCreateGroup).toHaveBeenCalledTimes(1));
    await firstMount.unmount();
    await render(<GroupCreatePage />);

    expect(mockCreateGroup).toHaveBeenCalledTimes(1);
    resolveRequest({ owner_link: 'owner-key' });

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/group/owner-key'));
    expect(mockCreateGroup).toHaveBeenCalledTimes(1);
  });

  it('登録中の戻る操作を抑止する', async () => {
    mockCreateGroup.mockReturnValue(new Promise(() => undefined));
    await render(<GroupCreatePage />);

    const beforeRemove = mockAddListener.mock.calls.find(
      ([event]) => event === 'beforeRemove',
    )?.[1];
    const preventDefault = jest.fn();
    expect(beforeRemove).toBeDefined();
    beforeRemove?.({ preventDefault });

    expect(preventDefault).toHaveBeenCalledTimes(1);
  });

  it('tokenがない場合は理由とホームへ戻る操作を表示する', async () => {
    mockParams.mockReturnValue({ token: '' });
    await render(<GroupCreatePage />);

    expect(
      await screen.findByText('招待リンクが無効です。リンクを確認して、もう一度開いてください。'),
    ).toBeTruthy();
    expect(screen.getByText('再試行')).toBeDisabled();
    expect(mockCreateGroup).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();

    fireEvent.press(screen.getByText('ホームへ戻る'));
    expect(mockReplace).toHaveBeenCalledWith('/');
  });

  it('通信エラーでは安全な案内を表示し、再試行できる', async () => {
    mockCreateGroup
      .mockRejectedValueOnce(
        new ApiError({
          kind: 'network',
          message: 'Network request failed: internal-host',
          url: 'https://example.com/api/groups',
          method: 'POST',
          retryable: true,
        }),
      )
      .mockResolvedValueOnce({ owner_link: 'owner-key' });
    await render(<GroupCreatePage />);

    expect(await screen.findByText(/通信できませんでした/)).toBeTruthy();
    expect(screen.queryByText(/internal-host/)).toBeNull();
    expect(mockReplace).not.toHaveBeenCalled();

    fireEvent.press(screen.getByText('再試行'));

    await waitFor(() => expect(mockCreateGroup).toHaveBeenCalledTimes(2));
    expect(mockReplace).toHaveBeenCalledWith('/group/owner-key');
  });

  it('期限切れの招待リンクでは文脈固有の案内を表示して再試行を無効化する', async () => {
    mockCreateGroup.mockRejectedValueOnce(
      new ApiError({
        kind: 'http',
        message: 'HTTP 410 Gone',
        url: 'https://example.com/api/groups',
        method: 'POST',
        status: 410,
        retryable: false,
        body: { message: 'internal invitation detail' },
      }),
    );
    await render(<GroupCreatePage />);

    expect(await screen.findByText(/招待リンクが無効です/)).toBeTruthy();
    expect(screen.getByText('再試行')).toBeDisabled();
    expect(screen.queryByText(/internal invitation detail/)).toBeNull();
  });

  it('API成功後の端末保存失敗ではAPIを再送せず保存だけを再試行する', async () => {
    mockCreateGroup.mockRejectedValueOnce(
      new GroupKeyStorageError('owner-key', new Error('secure storage unavailable')),
    );
    await render(<GroupCreatePage />);

    expect(
      await screen.findByText(
        /グループの作成は完了しましたが、この端末に登録情報を保存できませんでした/,
      ),
    ).toBeTruthy();
    expect(screen.getByText('再試行')).toBeEnabled();
    expect(mockCreateGroup).toHaveBeenCalledTimes(1);

    fireEvent.press(screen.getByText('再試行'));

    await waitFor(() => expect(mockAddGroupKey).toHaveBeenCalledWith('owner-key'));
    expect(mockCreateGroup).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith('/group/owner-key');
  });

  it('API成功レスポンスの解析失敗は保存失敗と区別し、再試行を無効化する', async () => {
    mockCreateGroup.mockRejectedValueOnce(
      new ApiError({
        kind: 'parse',
        message: 'Failed to parse JSON response',
        url: 'https://example.com/api/groups',
        method: 'POST',
        retryable: false,
      }),
    );
    await render(<GroupCreatePage />);

    expect(await screen.findByText(/受信したデータを読み込めませんでした/)).toBeTruthy();
    expect(screen.getByText('再試行')).toBeDisabled();
    expect(mockAddGroupKey).not.toHaveBeenCalled();
  });
});
