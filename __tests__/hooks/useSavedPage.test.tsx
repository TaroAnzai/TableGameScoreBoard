import { act, renderHook } from '@testing-library/react-native';

import { useSavedPage } from '@/src/hooks/useSavedPage';

const mockSave = jest.fn();
const mockRemove = jest.fn();
const mockTouch = jest.fn();
const mockDispatch = jest.fn();
const mockAddListener = jest.fn();
let mockGlobalParams: Record<string, string>;
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

jest.mock('expo-router', () => ({
  useGlobalSearchParams: () => mockGlobalParams,
  useNavigation: () => ({
    addListener: mockAddListener,
    dispatch: mockDispatch,
  }),
}));

describe('useSavedPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAddListener.mockReturnValue(jest.fn());
    mockGlobalParams = {};
    mockSavedLinksState = {
      savedLinks: [],
      isLoading: false,
      isError: false,
      error: null,
    };
  });

  it('外部リンクの履歴リセット前は保存案内を表示しない', async () => {
    mockGlobalParams = { __externalEntry: 'external-entry' };
    const { result, rerender } = await renderHook(() =>
      useSavedPage({
        type: 'tournament',
        key: 'tournament-key',
        name: '大会名',
        isDirectView: true,
      }),
    );

    expect(result.current.shouldPromptSave).toBe(false);
    expect(result.current.savePromptMode).toBeUndefined();
    expect(mockAddListener).not.toHaveBeenCalled();

    mockGlobalParams = {};
    await rerender({});

    expect(result.current.shouldPromptSave).toBe(true);
    expect(result.current.savePromptMode).toBe('initial');
    expect(mockAddListener).toHaveBeenCalledWith('beforeRemove', expect.any(Function));
  });

  it('未保存ページからの遷移を保留し、保存確認を閉じた後に再開する', async () => {
    const { result } = await renderHook(() =>
      useSavedPage({
        type: 'table',
        key: 'table-key',
        name: '卓名',
        isDirectView: true,
      }),
    );
    const beforeRemove = mockAddListener.mock.calls.find(
      ([event]) => event === 'beforeRemove',
    )?.[1];
    const preventDefault = jest.fn();
    const action = { type: 'RESET', payload: { index: 1 } };

    await act(async () => {
      result.current.continueWithoutSaving();
    });
    expect(result.current.shouldPromptSave).toBe(false);

    await act(async () => {
      beforeRemove({ preventDefault, data: { action } });
    });

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(result.current.shouldPromptSave).toBe(true);
    expect(result.current.savePromptMode).toBe('navigation');
    expect(mockDispatch).not.toHaveBeenCalled();

    await act(async () => {
      result.current.continueWithoutSaving();
    });

    expect(mockDispatch).toHaveBeenCalledWith(action);
  });

  it('キャンセル時は保留中の遷移を破棄して画面に留まる', async () => {
    const { result } = await renderHook(() =>
      useSavedPage({
        type: 'tournament',
        key: 'tournament-key',
        name: '大会名',
        isDirectView: true,
      }),
    );
    const beforeRemove = mockAddListener.mock.calls.find(
      ([event]) => event === 'beforeRemove',
    )?.[1];
    const action = { type: 'GO_BACK' };

    await act(async () => {
      beforeRemove({ preventDefault: jest.fn(), data: { action } });
      result.current.cancelSavePrompt();
    });

    expect(result.current.shouldPromptSave).toBe(false);
    expect(mockDispatch).not.toHaveBeenCalled();
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
      description: '保存済み一覧から開いたページ',
      state: {},
      params: { isDirectView: true, suppressSavePrompt: true, name: '大会名' },
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
      result.current.continueWithoutSaving();
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
        accessLevel: 'OWNER',
        tournamentKey: 'tournament-key',
        parentGroupName: 'グループ名',
        parentTournamentName: '大会名',
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
      accessLevel: 'OWNER',
      tournamentKey: 'tournament-key',
      parentGroupName: 'グループ名',
      parentTournamentName: '大会名',
    });
    expect(mockRemove).toHaveBeenCalledWith({ type: 'table', key: 'table-key' });
  });

  it('現在ページの表示日時を更新する', async () => {
    mockTouch.mockResolvedValue(undefined);
    const { result } = await renderHook(() =>
      useSavedPage({ type: 'table', key: 'table-key', name: '卓名', isDirectView: false }),
    );
    await act(async () => result.current.touch());
    expect(mockTouch).toHaveBeenCalledWith({ type: 'table', key: 'table-key' });
  });

  it('キーがない場合は削除と表示日時更新を行わず、保存は明示的に失敗する', async () => {
    const { result } = await renderHook(() =>
      useSavedPage({ type: 'table', name: '卓名', isDirectView: true }),
    );
    await act(async () => {
      await result.current.remove();
      await result.current.touch();
    });
    await expect(result.current.save()).rejects.toThrow('A saved page requires a key and name.');
    expect(mockRemove).not.toHaveBeenCalled();
    expect(mockTouch).not.toHaveBeenCalled();
    expect(mockSave).not.toHaveBeenCalled();
  });

  it('保存完了後に保留中の遷移を再開し、その直後のbeforeRemoveは通過させる', async () => {
    const { result } = await renderHook(() =>
      useSavedPage({ type: 'tournament', key: 'key', name: '大会', isDirectView: true }),
    );
    const beforeRemove = mockAddListener.mock.calls.find(
      ([event]) => event === 'beforeRemove',
    )?.[1];
    const action = { type: 'GO_BACK' };
    const firstPreventDefault = jest.fn();
    await act(async () => beforeRemove({ preventDefault: firstPreventDefault, data: { action } }));
    await act(async () => result.current.completeSavePrompt());
    expect(mockDispatch).toHaveBeenCalledWith(action);

    const secondPreventDefault = jest.fn();
    await act(async () => beforeRemove({ preventDefault: secondPreventDefault, data: { action } }));
    expect(secondPreventDefault).not.toHaveBeenCalled();
  });

  it.each([
    ['保存情報の読み込み中', { isLoading: true }],
    ['保存情報の読み込み失敗', { isError: true, error: new Error('load failed') }],
  ])('%sは保存案内を表示しない', async (_, state) => {
    mockSavedLinksState = { ...mockSavedLinksState, ...state };
    const { result } = await renderHook(() =>
      useSavedPage({ type: 'table', key: 'key', name: '卓', isDirectView: true }),
    );
    expect(result.current.shouldPromptSave).toBe(false);
    expect(mockAddListener).not.toHaveBeenCalled();
  });
});
