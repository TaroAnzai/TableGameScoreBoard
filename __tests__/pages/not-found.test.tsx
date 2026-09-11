import { fireEvent, render, screen } from '@testing-library/react-native';

import NotFoundPage from '@/app/+not-found';

const mockDismissTo = jest.fn();

jest.mock('expo-router', () => ({
  router: { dismissTo: (...args: unknown[]) => mockDismissTo(...args) },
}));

describe('NotFoundPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('無効なリンクの案内を表示してホームへ戻れる', async () => {
    await render(<NotFoundPage />);

    expect(screen.getByText('リンクを開けませんでした')).toBeTruthy();
    expect(
      screen.getByText('リンクが無効か、ページが削除されています。URLを確認してください。'),
    ).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'ホームに戻る' }));

    expect(mockDismissTo).toHaveBeenCalledWith('/');
  });
});
