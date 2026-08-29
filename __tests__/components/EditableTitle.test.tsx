import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

import EditableTitle from '@/components/page_parts/EditableTitle';

describe('EditableTitle', () => {
  it('onChangeがない場合は読み取り専用テキストとして表示する', async () => {
    await render(<EditableTitle value="読み取り専用" />);

    expect(screen.getByText('読み取り専用')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('編集可能な場合は編集操作であることを見た目とアクセシビリティで示す', async () => {
    const onChange = jest.fn();
    await render(<EditableTitle value="大会名" onChange={onChange} />);

    const editButton = screen.getByRole('button', { name: '大会名を編集' });
    expect(editButton).toBeTruthy();
  });

  it('長押し操作だけを有効にでき、通常タップでは既存の編集を開始しない', async () => {
    const onLongPress = jest.fn();
    await render(<EditableTitle value="保存対象の大会" onLongPress={onLongPress} />);

    const title = screen.getByRole('button', { name: '保存対象の大会' });
    fireEvent.press(title);
    fireEvent(title, 'longPress');

    expect(onLongPress).toHaveBeenCalledTimes(1);
    expect(screen.queryByDisplayValue('保存対象の大会')).toBeNull();
  });

  it('前後の空白を除いて変更を保存し、編集を終了する', async () => {
    const onChange = jest.fn().mockResolvedValue(undefined);
    await render(<EditableTitle value="大会名" onChange={onChange} />);

    await act(async () => {
      fireEvent.press(screen.getByRole('button'));
    });
    const input = screen.getByDisplayValue('大会名');
    await act(async () => {
      fireEvent.changeText(input, '  新しい大会名  ');
    });
    await fireEvent(input, 'submitEditing');

    await waitFor(() => expect(onChange).toHaveBeenCalledWith('新しい大会名'));
    await waitFor(() => expect(screen.queryByDisplayValue('  新しい大会名  ')).toBeNull());
  });

  it.each([
    ['空文字', '   '],
    ['変更なし', ' 大会名 '],
  ])('%sではonChangeを呼ばず編集を終了する', async (_label, nextValue) => {
    const onChange = jest.fn();
    await render(<EditableTitle value="大会名" onChange={onChange} />);

    await act(async () => {
      fireEvent.press(screen.getByRole('button'));
    });
    const input = screen.getByDisplayValue('大会名');
    await act(async () => {
      fireEvent.changeText(input, nextValue);
    });
    await fireEvent(input, 'blur');

    await waitFor(() => expect(screen.queryByDisplayValue(nextValue)).toBeNull());
    expect(onChange).not.toHaveBeenCalled();
  });

  it('保存失敗時は入力内容を保って再試行できる', async () => {
    const onChange = jest.fn().mockRejectedValue(new Error('save failed'));
    await render(<EditableTitle value="大会名" onChange={onChange} />);

    await act(async () => {
      fireEvent.press(screen.getByRole('button'));
    });
    const input = screen.getByDisplayValue('大会名');
    await act(async () => {
      fireEvent.changeText(input, '再試行する名称');
    });
    await act(async () => {
      fireEvent(input, 'submitEditing');
    });

    await waitFor(() => expect(onChange).toHaveBeenCalledWith('再試行する名称'));
    expect(screen.getByDisplayValue('再試行する名称')).toBeTruthy();
  });

  it('保存中のblurとsubmitの重複発火では一度だけ保存する', async () => {
    let resolveSave!: () => void;
    const onChange = jest.fn(
      () => new Promise<void>((resolve) => {
        resolveSave = resolve;
      }),
    );
    await render(<EditableTitle value="大会名" onChange={onChange} />);
    await act(async () => {
      fireEvent.press(screen.getByRole('button'));
    });
    const input = screen.getByDisplayValue('大会名');
    await act(async () => {
      fireEvent.changeText(input, '保存中の名称');
    });
    fireEvent(input, 'submitEditing');

    await waitFor(() => expect(screen.getByLabelText(/処理中/)).toBeTruthy());
    fireEvent(input, 'blur');
    expect(onChange).toHaveBeenCalledTimes(1);
    await act(async () => resolveSave());
  });
});
