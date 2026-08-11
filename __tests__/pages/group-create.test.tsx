import { render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

import GroupCreatePage from '@/app/group/create';

const mockPush = jest.fn();
const mockParams = jest.fn(() => ({ token: 'valid-token' }));
const mockCreateGroup = jest.fn();
const mockAlertDialog = jest.fn(() => Promise.resolve(true));

jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
  useLocalSearchParams: () => mockParams(),
}));
jest.mock('@/src/hooks/useGroups', () => ({
  useCreateGroup: () => ({ mutateAsync: mockCreateGroup }),
}));
jest.mock('@/components/common/AlertDialogProvider', () => ({
  useAlertDialog: () => ({ alertDialog: mockAlertDialog }),
}));

describe('招待グループ作成ページ', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams.mockReturnValue({ token: 'valid-token' });
    mockCreateGroup.mockResolvedValue({ owner_link: 'owner-key' });
  });

  it('作成中表示後、作成したグループへ遷移する', async () => {
    await render(<GroupCreatePage />);
    expect(screen.getByText('グループを作成中...')).toBeTruthy();

    await waitFor(() => expect(mockCreateGroup).toHaveBeenCalledWith({ token: 'valid-token' }));
    expect(mockPush).toHaveBeenCalledWith('/group/owner-key');
  });

  it('再レンダーされても作成APIを重複実行しない', async () => {
    const result = await render(<GroupCreatePage />);
    await result.rerender(<GroupCreatePage />);

    await waitFor(() => expect(mockCreateGroup).toHaveBeenCalledTimes(1));
  });

  it('tokenがない場合はエラーを表示してホームへ戻る', async () => {
    mockParams.mockReturnValue({ token: '' });
    await render(<GroupCreatePage />);

    await waitFor(() => expect(mockAlertDialog).toHaveBeenCalled());
    expect(mockCreateGroup).not.toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('APIエラー時はホームへ戻る', async () => {
    mockCreateGroup.mockRejectedValue(new TypeError('Network request failed'));
    await render(<GroupCreatePage />);

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/'));
  });
});
