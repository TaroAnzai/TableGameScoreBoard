import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import React, { type PropsWithChildren } from 'react';

import { SAVED_LINKS_QUERY_KEY, useSavedLinks } from '@/src/hooks/useSavedLinks';
import { useSavedPage } from '@/src/hooks/useSavedPage';
import { savedLinkStorage } from '@/src/storage/savedLinkStorage';
import type { SavedLink } from '@/src/types/savedLink';

jest.mock('@/src/storage/savedLinkStorage', () => ({
  savedLinkStorage: {
    getSavedLinks: jest.fn(),
    upsertSavedLink: jest.fn(),
    removeSavedLink: jest.fn(),
    touchSavedLink: jest.fn(),
    updateSavedLinkName: jest.fn(),
  },
}));

const mockSavedLinkStorage = savedLinkStorage as jest.Mocked<typeof savedLinkStorage>;

const createLink = (overrides: Partial<SavedLink> = {}): SavedLink => ({
  type: 'tournament',
  key: 'tournament-key',
  name: '大会名',
  savedAt: '2026-08-20T00:00:00.000Z',
  lastOpenedAt: '2026-08-20T00:00:00.000Z',
  ...overrides,
});

const renderSavedLinksHook = async (initialLinks: SavedLink[] = []) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { gcTime: Infinity, retry: false },
      queries: { gcTime: Infinity, retry: false, staleTime: Infinity },
    },
  });
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  queryClient.setQueryData(SAVED_LINKS_QUERY_KEY, initialLinks);

  return { ...(await renderHook(() => useSavedLinks(), { wrapper })), queryClient };
};

describe('useSavedLinks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('保存成功後に新規リンクをキャッシュへ即時追加する', async () => {
    const savedLink = createLink();
    mockSavedLinkStorage.upsertSavedLink.mockResolvedValue(savedLink);
    const { result, queryClient, unmount } = await renderSavedLinksHook();

    await act(async () => {
      await result.current.save({ type: savedLink.type, key: savedLink.key, name: savedLink.name });
    });

    expect(queryClient.getQueryData(SAVED_LINKS_QUERY_KEY)).toEqual([savedLink]);
    await waitFor(() => expect(result.current.savedLinks).toEqual([savedLink]));
    unmount();
    queryClient.clear();
  });

  it('保存直後に useSavedPage の isSaved を更新する', async () => {
    const savedLink = createLink();
    mockSavedLinkStorage.upsertSavedLink.mockResolvedValue(savedLink);
    const queryClient = new QueryClient({
      defaultOptions: {
        mutations: { gcTime: Infinity, retry: false },
        queries: { gcTime: Infinity, retry: false, staleTime: Infinity },
      },
    });
    queryClient.setQueryData(SAVED_LINKS_QUERY_KEY, []);
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result, unmount } = await renderHook(
      () =>
        useSavedPage({
          type: savedLink.type,
          key: savedLink.key,
          name: savedLink.name,
          isDirectView: true,
        }),
      { wrapper },
    );

    expect(result.current.isSaved).toBe(false);
    await act(async () => {
      await result.current.save();
    });

    await waitFor(() => expect(result.current.isSaved).toBe(true));
    unmount();
    queryClient.clear();
  });

  it('同じ type と key の保存はキャッシュ内の項目を置換し、重複させない', async () => {
    const existing = createLink();
    const updated = createLink({ name: '更新後の大会名', lastOpenedAt: '2026-08-20T01:00:00.000Z' });
    mockSavedLinkStorage.upsertSavedLink.mockResolvedValue(updated);
    const { result, queryClient, unmount } = await renderSavedLinksHook([existing]);

    await act(async () => {
      await result.current.save({ type: updated.type, key: updated.key, name: updated.name });
    });

    await waitFor(() => expect(result.current.savedLinks).toEqual([updated]));
    unmount();
    queryClient.clear();
  });

  it('削除成功後に対象をキャッシュから即時削除する', async () => {
    const removed = createLink();
    const retained = createLink({ type: 'table', key: 'table-key', name: '卓名' });
    mockSavedLinkStorage.removeSavedLink.mockResolvedValue(undefined);
    const { result, queryClient, unmount } = await renderSavedLinksHook([removed, retained]);

    await act(async () => {
      await result.current.remove({ type: removed.type, key: removed.key });
    });

    await waitFor(() => expect(result.current.savedLinks).toEqual([retained]));
    unmount();
    queryClient.clear();
  });

  it('touch成功後に最終表示日時をキャッシュへ即時反映する', async () => {
    const existing = createLink();
    const touched = createLink({ lastOpenedAt: '2026-08-20T01:00:00.000Z' });
    mockSavedLinkStorage.touchSavedLink.mockResolvedValue(touched);
    const { result, queryClient, unmount } = await renderSavedLinksHook([existing]);

    await act(async () => {
      await result.current.touch({ type: touched.type, key: touched.key });
    });

    await waitFor(() => expect(result.current.savedLinks).toEqual([touched]));
    unmount();
    queryClient.clear();
  });

  it('名称更新成功後にキャッシュの名称を即時更新する', async () => {
    const existing = createLink();
    const renamed = createLink({ name: '名称変更後の大会' });
    mockSavedLinkStorage.updateSavedLinkName.mockResolvedValue(renamed);
    const { result, queryClient, unmount } = await renderSavedLinksHook([existing]);

    await act(async () => {
      await result.current.updateName({ type: renamed.type, key: renamed.key, name: renamed.name });
    });

    await waitFor(() => expect(result.current.savedLinks).toEqual([renamed]));
    unmount();
    queryClient.clear();
  });

  it('touch が undefined を返す場合はキャッシュを変更しない', async () => {
    const existing = createLink();
    mockSavedLinkStorage.touchSavedLink.mockResolvedValue(undefined);
    const { result, queryClient, unmount } = await renderSavedLinksHook([existing]);

    await act(async () => {
      await result.current.touch({ type: existing.type, key: existing.key });
    });

    await waitFor(() => expect(result.current.savedLinks).toEqual([existing]));
    expect(queryClient.getQueryData(SAVED_LINKS_QUERY_KEY)).toEqual([existing]);
    unmount();
    queryClient.clear();
  });

  it('名称更新が undefined を返す場合はキャッシュを変更しない', async () => {
    const existing = createLink();
    mockSavedLinkStorage.updateSavedLinkName.mockResolvedValue(undefined);
    const { result, queryClient, unmount } = await renderSavedLinksHook([existing]);

    await act(async () => {
      await result.current.updateName({
        type: existing.type,
        key: existing.key,
        name: '更新されない名称',
      });
    });

    await waitFor(() => expect(result.current.savedLinks).toEqual([existing]));
    expect(queryClient.getQueryData(SAVED_LINKS_QUERY_KEY)).toEqual([existing]);
    unmount();
    queryClient.clear();
  });
});
