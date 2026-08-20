import { goBackOrFallback } from '@/src/utils/navigation';

describe('goBackOrFallback', () => {
  it('戻れる履歴がある場合は通常の戻る処理を行う', () => {
    const navigation = {
      canGoBack: () => true,
      back: jest.fn(),
      replace: jest.fn(),
    };

    goBackOrFallback(navigation);

    expect(navigation.back).toHaveBeenCalledTimes(1);
    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it('戻れる履歴がない場合はトップページへ置き換える', () => {
    const navigation = {
      canGoBack: () => false,
      back: jest.fn(),
      replace: jest.fn(),
    };

    goBackOrFallback(navigation);

    expect(navigation.back).not.toHaveBeenCalled();
    expect(navigation.replace).toHaveBeenCalledWith('/');
  });
});
