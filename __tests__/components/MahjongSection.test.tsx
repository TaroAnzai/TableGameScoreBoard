import { fireEvent, render, screen } from '@testing-library/react-native';

import MahjongSection from '@/components/MahjongSection';
import { Text } from '@/components/ui/text';

describe('MahjongSection', () => {
  it('通常時は子要素を表示する', async () => {
    await render(
      <MahjongSection>
        <Text>通常コンテンツ</Text>
      </MahjongSection>,
    );

    expect(screen.getByText('通常コンテンツ')).toBeTruthy();
  });

  it('ローディング中は子要素を隠してローディングを表示する', async () => {
    await render(
      <MahjongSection isLoading>
        <Text>通常コンテンツ</Text>
      </MahjongSection>,
    );

    expect(screen.getByText('読み込み中...')).toBeTruthy();
    expect(screen.queryByText('通常コンテンツ')).toBeNull();
  });

  it('エラー時は子要素を隠してエラーと再取得ボタンを表示する', async () => {
    const onRetry = jest.fn();
    await render(
      <MahjongSection isError onRetry={onRetry}>
        <Text>通常コンテンツ</Text>
      </MahjongSection>,
    );

    expect(screen.getByText(/データを取得できませんでした/)).toBeTruthy();
    expect(screen.queryByText('通常コンテンツ')).toBeNull();
    fireEvent.press(screen.getByText('再取得'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('ローディングとエラーが同時の場合はローディングを優先する', async () => {
    await render(
      <MahjongSection isLoading isError>
        <Text>通常コンテンツ</Text>
      </MahjongSection>,
    );

    expect(screen.getByText('読み込み中...')).toBeTruthy();
    expect(screen.queryByText(/データを取得できませんでした/)).toBeNull();
  });

  it('指定されたエラーメッセージを表示する', async () => {
    await render(
      <MahjongSection isError errorMessage="独自エラー">
        <Text>通常コンテンツ</Text>
      </MahjongSection>,
    );

    expect(screen.getByText('独自エラー')).toBeTruthy();
    expect(screen.queryByText('再取得')).toBeNull();
  });
});
