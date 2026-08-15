import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import React, { type PropsWithChildren } from 'react';

import { useCreateGroup } from '@/src/hooks/useGroups';

const mockPostApiGroups = jest.fn();
const mockAddGroupKey = jest.fn();
const mockShowSuccess = jest.fn();

jest.mock('@/src/api/generated/mahjongApi', () => ({
  postApiGroups: (...args: unknown[]) => mockPostApiGroups(...args),
}));
jest.mock('@/components/common/AlertDialogProvider', () => ({
  useAlertDialog: () => ({ alertDialog: jest.fn() }),
}));
jest.mock('@/src/hooks/useMutationFeedback', () => ({
  useMutationFeedback: () => ({ showError: jest.fn(), showSuccess: mockShowSuccess }),
}));
jest.mock('@/src/storage/appStorage', () => ({
  appStorage: {
    addGroupKey: (...args: unknown[]) => mockAddGroupKey(...args),
  },
}));

describe('useCreateGroup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('グループキーの保存完了後に作成処理を完了する', async () => {
    let resolveStorage: () => void = () => undefined;
    const storagePromise = new Promise<void>((resolve) => {
      resolveStorage = resolve;
    });
    mockPostApiGroups.mockResolvedValue({ name: 'テストグループ', owner_link: 'owner-key' });
    mockAddGroupKey.mockReturnValue(storagePromise);
    const onAfterCreate = jest.fn();
    const queryClient = new QueryClient({
      defaultOptions: {
        mutations: { gcTime: Infinity, retry: false },
        queries: { gcTime: Infinity, retry: false },
      },
    });
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result, unmount } = await renderHook(() => useCreateGroup(onAfterCreate), { wrapper });
    const mutateAsync = result.current.mutateAsync;
    unmount();

    let mutationCompleted = false;
    const mutationPromise = mutateAsync({ token: 'token' }).then((value) => {
      mutationCompleted = true;
      return value;
    });

    await waitFor(() => expect(mockAddGroupKey).toHaveBeenCalledWith('owner-key'));
    expect(mutationCompleted).toBe(false);
    expect(onAfterCreate).not.toHaveBeenCalled();

    resolveStorage();
    await mutationPromise;

    expect(mutationCompleted).toBe(true);
    expect(onAfterCreate).toHaveBeenCalledTimes(1);
    queryClient.clear();
  });
});
