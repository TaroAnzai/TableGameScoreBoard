import { fireEvent, render, screen } from '@testing-library/react-native';

import { SectionErrorState } from '@/components/SectionErrorState';

describe('SectionErrorState', () => {
  it('再取得ボタンからコールバックを呼ぶ', async () => {
    const onRetry = jest.fn();
    await render(<SectionErrorState onRetry={onRetry} />);

    fireEvent.press(screen.getByText('再取得'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('再取得中はボタンを無効化する', async () => {
    const onRetry = jest.fn();
    await render(<SectionErrorState isRetrying onRetry={onRetry} />);

    const button = screen.getByRole('button');
    expect(button.props.accessibilityState).toEqual(expect.objectContaining({ disabled: true }));
    fireEvent.press(button);
    expect(onRetry).not.toHaveBeenCalled();
    expect(screen.getByText('再取得中...')).toBeTruthy();
  });

  it('再取得処理中の連打を受け付けない', async () => {
    const onRetry = jest.fn();
    await render(<SectionErrorState isRetrying onRetry={onRetry} />);

    const button = screen.getByRole('button');
    fireEvent.press(button);
    fireEvent.press(button);
    fireEvent.press(button);
    expect(onRetry).not.toHaveBeenCalled();
  });
});
