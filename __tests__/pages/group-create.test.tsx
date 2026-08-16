import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

import GroupCreatePage from '@/app/group/create';
import { ApiError } from '@/src/api/apiError';

const mockReplace = jest.fn();
const mockParams = jest.fn(() => ({ token: 'valid-token' }));
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

describe('招待グループ作成ページ', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams.mockReturnValue({ token: 'valid-token' });
    mockCreateGroup.mockResolvedValue({ owner_link: 'owner-key' });
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
});
