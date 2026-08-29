import { act, renderHook } from '@testing-library/react-native';
import { BackHandler, Platform } from 'react-native';

import { useBackFallback } from '@/src/hooks/useBackFallback';

let mockFocusEffect: (() => void | (() => void)) | undefined;

jest.mock('expo-router', () => ({
  useFocusEffect: (effect: () => void | (() => void)) => {
    mockFocusEffect = effect;
  },
}));

describe('useBackFallback', () => {
  const originalPlatform = Platform.OS;

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: originalPlatform });
    jest.restoreAllMocks();
    mockFocusEffect = undefined;
  });

  it('Androidのhardware backを処理し、購読解除も行う', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' });
    const remove = jest.fn();
    const addEventListener = jest
      .spyOn(BackHandler, 'addEventListener')
      .mockReturnValue({ remove } as never);
    const navigation = { canGoBack: jest.fn(() => true), back: jest.fn(), replace: jest.fn() };

    const { result } = await renderHook(() => useBackFallback(navigation));
    const cleanup = mockFocusEffect?.();
    const hardwareBackHandler = addEventListener.mock.calls[0][1];

    expect(hardwareBackHandler()).toBe(true);
    expect(navigation.back).toHaveBeenCalledTimes(1);
    expect(navigation.replace).not.toHaveBeenCalled();

    await act(async () => {
      result.current();
    });
    expect(navigation.back).toHaveBeenCalledTimes(2);

    cleanup?.();
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it('Android以外ではhardware backを購読しない', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
    const addEventListener = jest.spyOn(BackHandler, 'addEventListener');
    const navigation = { canGoBack: jest.fn(() => false), back: jest.fn(), replace: jest.fn() };

    const { result } = await renderHook(() => useBackFallback(navigation));
    expect(mockFocusEffect?.()).toBeUndefined();
    expect(addEventListener).not.toHaveBeenCalled();

    await act(async () => {
      result.current();
    });
    expect(navigation.replace).toHaveBeenCalledWith('/');
    expect(navigation.back).not.toHaveBeenCalled();
  });
});
