import { act, renderHook } from '@testing-library/react-native';

import { useSavedPage } from '@/src/hooks/useSavedPage';

const mockSave = jest.fn();
const mockRemove = jest.fn();
const mockTouch = jest.fn();
let mockSavedLinksState: {
  savedLinks: Array<{ type: 'tournament' | 'table'; key: string }>;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
};

jest.mock('@/src/hooks/useSavedLinks', () => ({
  useSavedLinks: () => ({
    ...mockSavedLinksState,
    save: mockSave,
    remove: mockRemove,
    touch: mockTouch,
    isSaving: false,
    isRemoving: false,
  }),
}));

describe('useSavedPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSavedLinksState = {
      savedLinks: [],
      isLoading: false,
      isError: false,
      error: null,
    };
  });

  it('ダイレクト表示の未保存ページで、名称確定後に保存案内を表示する', async () => {
    const { result } = await renderHook(() =>
      useSavedPage({
        type: 'tournament',
        key: 'tournament-key',
        name: '大会名',
        isDirectView: true,
      }),
    );

    expect(result.current.shouldPromptSave).toBe(true);
    expect(result.current.isSaved).toBe(false);
  });

  it.each([
    {
      description: '保存済み',
      state: { savedLinks: [{ type: 'tournament' as const, key: 'tournament-key' }] },
      params: { isDirectView: true, name: '大会名' },
    },
    {
      description: '通常遷移',
      state: {},
      params: { isDirectView: false, name: '大会名' },
    },
    {
      description: 'APIデータ未確定',
      state: {},
      params: { isDirectView: true, name: undefined },
    },
  ])('$descriptionの場合は保存案内を表示しない', async ({ state, params }) => {
    mockSavedLinksState = { ...mockSavedLinksState, ...state };
    const { result } = await renderHook(() =>
      useSavedPage({
        type: 'tournament',
        key: 'tournament-key',
        ...params,
      }),
    );

    expect(result.current.shouldPromptSave).toBe(false);
  });

  it('今回の表示で案内を閉じると再表示せず、別ページでは再表示する', async () => {
    const { result, unmount } = await renderHook(() =>
      useSavedPage({
        type: 'tournament',
        key: 'first-key',
        name: '大会名',
        isDirectView: true,
      }),
    );

    await act(async () => {
      result.current.dismissSavePrompt();
    });
    expect(result.current.shouldPromptSave).toBe(false);

    await unmount();
    const { result: secondPageResult, unmount: unmountSecondPage } = await renderHook(() =>
      useSavedPage({
        type: 'tournament',
        key: 'second-key',
        name: '大会名',
        isDirectView: true,
      }),
    );
    expect(secondPageResult.current.shouldPromptSave).toBe(true);
    await unmountSecondPage();
  });

  it('保存と削除を現在ページの識別子で実行する', async () => {
    mockSave.mockResolvedValue(undefined);
    mockRemove.mockResolvedValue(undefined);
    const { result } = await renderHook(() =>
      useSavedPage({
        type: 'table',
        key: 'table-key',
        name: '卓名',
        tournamentKey: 'tournament-key',
        isDirectView: true,
      }),
    );

    await act(async () => {
      await result.current.save();
      await result.current.remove();
    });

    expect(mockSave).toHaveBeenCalledWith({
      type: 'table',
      key: 'table-key',
      name: '卓名',
      tournamentKey: 'tournament-key',
    });
    expect(mockRemove).toHaveBeenCalledWith({ type: 'table', key: 'table-key' });
  });
});
