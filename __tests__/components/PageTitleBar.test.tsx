import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import PageTitleBar from '@/components/page_parts/PageTitleBar';

const mockBack = jest.fn();
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockCanGoBack = jest.fn(() => false);
const mockAlertDialog = jest.fn();

jest.mock('expo-router', () => ({
  usePathname: () => '/tournament/tournament-key',
  useRouter: () => ({
    back: mockBack,
    canGoBack: mockCanGoBack,
    push: mockPush,
    replace: mockReplace,
  }),
}));

jest.mock('@/components/common/AlertDialogProvider', () => ({
  useAlertDialog: () => ({ alertDialog: mockAlertDialog }),
}));

jest.mock('@/components/page_parts/EditableTitle', () => {
  const { Pressable, Text } = jest.requireActual('react-native');
  const MockEditableTitle = ({ value, onChange, onLongPress }: any) => (
    <Pressable
      accessibilityLabel="mock-editable-title"
      onPress={() => onChange?.('変更後')}
      onLongPress={onLongPress}
    >
      <Text>{value}</Text>
    </Pressable>
  );
  return MockEditableTitle;
});

jest.mock('@/components/page_parts/ShareModal', () => {
  const { Pressable, Text } = jest.requireActual('react-native');
  return (props: any) => (
    <Pressable accessibilityLabel="share-modal-close" onPress={props.onClose}>
      <Text>{props.shareUrl}</Text>
    </Pressable>
  );
});

jest.mock('@/components/ui/dropdown-menu', () => {
  const { Pressable, View } = jest.requireActual('react-native');
  return {
    DropdownMenu: View,
    DropdownMenuContent: View,
    DropdownMenuItem: Pressable,
    DropdownMenuTrigger: View,
  };
});

describe('PageTitleBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCanGoBack.mockReturnValue(false);
  });

  it('親ページ操作では履歴を追加せず前の画面へ戻る', async () => {
    await render(<PageTitleBar title="大会1" parentUrl="/group/group-key" />);

    await fireEvent.press(screen.getByLabelText('戻る'));

    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('parentUrlがnullの場合は汎用の戻る操作だけを表示する', async () => {
    await render(<PageTitleBar title="大会1" parentUrl={null} />);

    expect(screen.getAllByLabelText('戻る')).toHaveLength(1);
  });

  it('親ページ指定がなくても履歴があれば戻る操作を表示する', async () => {
    mockCanGoBack.mockReturnValue(true);
    await render(<PageTitleBar title="大会1" parentUrl={null} />);

    await fireEvent.press(screen.getByLabelText('戻る'));

    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('親ページ指定も履歴もない場合はトップページへ戻る操作を表示する', async () => {
    await render(<PageTitleBar title="大会1" parentUrl={null} />);

    await fireEvent.press(screen.getByLabelText('戻る'));

    expect(mockReplace).toHaveBeenCalledWith('/');
  });

  it('親ページ用と汎用の戻るcallbackをそれぞれ優先する', async () => {
    const onParentPress = jest.fn();
    const onBackPress = jest.fn();
    await render(
      <PageTitleBar
        title="大会1"
        parentUrl="/group/key"
        showBackButton
        onParentPress={onParentPress}
        onBackPress={onBackPress}
      />,
    );

    const buttons = screen.getAllByLabelText('戻る');
    await fireEvent.press(buttons[0]);
    await fireEvent.press(buttons[1]);
    expect(onParentPress).toHaveBeenCalledTimes(1);
    expect(onBackPress).toHaveBeenCalledTimes(1);
    expect(mockBack).not.toHaveBeenCalled();
  });

  it('編集可能タイトルへ変更・長押しcallbackを渡す', async () => {
    const onTitleChange = jest.fn();
    const onTitleLongPress = jest.fn();
    await render(
      <PageTitleBar
        title="大会1"
        onTitleChange={onTitleChange}
        onTitleLongPress={onTitleLongPress}
      />,
    );

    const title = screen.getByLabelText('mock-editable-title');
    await fireEvent.press(title);
    await fireEvent(title, 'longPress');
    expect(onTitleChange).toHaveBeenCalledWith('変更後');
    expect(onTitleLongPress).toHaveBeenCalledTimes(1);
  });

  it('カスタムタイトルへクリック・長押しcallbackを渡す', async () => {
    const onTitleClick = jest.fn();
    const onTitleLongPress = jest.fn();
    const CustomTitle = ({ onPress, onLongPress }: any) => {
      const { Pressable, Text } = require('react-native');
      return (
        <Pressable accessibilityLabel="custom-title" onPress={onPress} onLongPress={onLongPress}>
          <Text>custom</Text>
        </Pressable>
      );
    };
    await render(
      <PageTitleBar
        title="大会1"
        TitleComponent={CustomTitle}
        onTitleClick={onTitleClick}
        onTitleLongPress={onTitleLongPress}
      />,
    );

    const title = screen.getByLabelText('custom-title');
    await fireEvent.press(title);
    await fireEvent(title, 'longPress');
    expect(onTitleClick).toHaveBeenCalledTimes(1);
    expect(onTitleLongPress).toHaveBeenCalledTimes(1);
  });

  it('共有リンクを選ぶとURLを組み立て、閉じるとmodalを消す', async () => {
    await render(
      <PageTitleBar
        title="大会1"
        shareLinks={[{ access_level: 'VIEW', short_key: 'view-short' }] as never}
      />,
    );

    await fireEvent.press(screen.getByText('閲覧リンクを共有'));
    expect(screen.getByText('http://localhost:3000/tournament/view-short')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('share-modal-close'));
    expect(screen.queryByLabelText('share-modal-close')).toBeNull();
  });

  it('選択した権限の共有リンクがなければ警告する', async () => {
    await render(
      <PageTitleBar
        title="大会1"
        shareLinks={[{ access_level: 'OWNER', short_key: 'owner-short' }] as never}
      />,
    );

    await fireEvent.press(screen.getByText('閲覧リンクを共有'));
    expect(mockAlertDialog).toHaveBeenCalledWith(expect.objectContaining({ showCancelButton: false }));
  });
});
