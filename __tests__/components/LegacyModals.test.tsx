import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { DialogPreview } from '@/components/TestDialog';
import { TextInputModal2 } from '@/components/TextInputModal2';

jest.mock('@/components/ui/dialog', () => {
  const { Text, View } = jest.requireActual('react-native');
  const DialogText = ({ children }: { children?: React.ReactNode }) => <Text>{children}</Text>;
  return {
    Dialog: View,
    DialogClose: View,
    DialogContent: View,
    DialogDescription: DialogText,
    DialogFooter: View,
    DialogHeader: View,
    DialogTitle: DialogText,
  };
});

jest.mock('@/components/TextInputModal', () => {
  const { Pressable, Text } = jest.requireActual('react-native');
  return {
    TextInputModal: (props: { open: boolean; onClose: () => void; title: string }) => (
      <Pressable accessibilityLabel="delegated-modal" onPress={props.onClose}>
        <Text>{`${props.title}:${props.open}`}</Text>
      </Pressable>
    ),
  };
});

describe('legacy modal components', () => {
  it('DialogPreviewは入力初期値と操作文言を表示する', async () => {
    const onClose = jest.fn();
    await render(<DialogPreview open onclose={onClose} />);

    expect(screen.getByDisplayValue('Pedro Duarte')).toBeTruthy();
    expect(screen.getByDisplayValue('@peduarte')).toBeTruthy();
    expect(screen.getByText('変更を保存')).toBeTruthy();
  });

  it('TextInputModal2は全propsをTextInputModalへ委譲する', async () => {
    const onClose = jest.fn();
    await render(
      <TextInputModal2 open title="名称変更" value="旧名称" onClose={onClose} onSubmit={jest.fn()} />,
    );

    expect(screen.getByText('名称変更:true')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('delegated-modal'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
