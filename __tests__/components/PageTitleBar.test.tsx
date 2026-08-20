import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import PageTitleBar from '@/components/page_parts/PageTitleBar';

const mockBack = jest.fn();
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockCanGoBack = jest.fn(() => false);

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
  useAlertDialog: () => ({ alertDialog: jest.fn() }),
}));

jest.mock('@/components/page_parts/EditableTitle', () => {
  const { Text } = jest.requireActual('react-native');
  const MockEditableTitle = ({ value }: { value: string }) => <Text>{value}</Text>;
  return MockEditableTitle;
});

jest.mock('@/components/page_parts/ShareModal', () => () => null);

jest.mock('@/components/ui/dropdown-menu', () => {
  const { View } = jest.requireActual('react-native');
  return {
    DropdownMenu: View,
    DropdownMenuContent: View,
    DropdownMenuItem: View,
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

    fireEvent.press(screen.getByLabelText('上の階層へ移動'));

    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('parentUrlがnullの場合は親ページ操作を表示しない', async () => {
    await render(<PageTitleBar title="大会1" parentUrl={null} />);

    expect(screen.queryByLabelText('上の階層へ移動')).toBeNull();
  });

  it('親ページ指定がなくても履歴があれば戻る操作を表示する', async () => {
    mockCanGoBack.mockReturnValue(true);
    await render(<PageTitleBar title="大会1" parentUrl={null} />);

    fireEvent.press(screen.getByLabelText('戻る'));

    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('親ページ指定も履歴もない場合はトップページへ戻る操作を表示する', async () => {
    await render(<PageTitleBar title="大会1" parentUrl={null} />);

    fireEvent.press(screen.getByLabelText('戻る'));

    expect(mockReplace).toHaveBeenCalledWith('/');
  });
});
