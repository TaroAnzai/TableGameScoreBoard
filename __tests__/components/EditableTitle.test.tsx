import { render, screen } from '@testing-library/react-native';
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
});
