import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Text, View } from 'react-native';

import { Table, TBody, Td, THead, Tr } from '@/components/common/Table';

const ExampleTable = ({ first = '短い' }: { first?: React.ReactNode }) => (
  <Table style={{ backgroundColor: 'white' }}>
    <THead>
      <Tr>
        <Td>{typeof first === 'string' ? <Text>{first}</Text> : first}</Td>
        <Td><Text>見出し2</Text></Td>
      </Tr>
    </THead>
    <TBody>
      <Tr>
        <Td><Text>本文1</Text></Td>
        <Td><Text>本文2</Text></Td>
      </Tr>
    </TBody>
  </Table>
);

describe('Table', () => {
  it('全セル計測後に列ごとの最大幅で表示する', async () => {
    await render(<ExampleTable />);

    await fireEvent(screen.getByText('短い').parent!, 'layout', {
      nativeEvent: { layout: { width: 40 } },
    });
    await fireEvent(screen.getByText('見出し2').parent!, 'layout', {
      nativeEvent: { layout: { width: 50 } },
    });
    await fireEvent(screen.getByText('本文1').parent!, 'layout', {
      nativeEvent: { layout: { width: 80 } },
    });
    await fireEvent(screen.getByText('本文2').parent!, 'layout', {
      nativeEvent: { layout: { width: 30 } },
    });

    expect(screen.getByText('本文1').parent?.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ width: 80 })]),
    );
    expect(screen.getByText('本文2').parent?.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ width: 50 })]),
    );
  });

  it('同じ列の小さい計測値を無視し、表示後のlayoutも再計測しない', async () => {
    await render(
      <Table>
        <TBody>
          <Tr>
            <Td><Text>大</Text></Td>
          </Tr>
          <Tr>
            <Td><Text>小</Text></Td>
          </Tr>
        </TBody>
      </Table>,
    );

    await fireEvent(screen.getByText('大').parent!, 'layout', {
      nativeEvent: { layout: { width: 100 } },
    });
    await fireEvent(screen.getByText('小').parent!, 'layout', {
      nativeEvent: { layout: { width: 20 } },
    });
    const visibleCell = screen.getByText('大').parent!;
    expect(visibleCell.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ width: 100 })]),
    );

    await fireEvent(visibleCell, 'layout', { nativeEvent: { layout: { width: 200 } } });
    expect(screen.getByText('大').parent?.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ width: 100 })]),
    );
  });

  it('要素nodeを安全に扱い、同じ構造の再描画では測定結果を維持する', async () => {
    const rendered = await render(<ExampleTable first={<Text>node</Text>} />);
    const cells = ['node', '見出し2', '本文1', '本文2'];
    for (const value of cells) {
      await fireEvent(screen.getByText(value).parent!, 'layout', {
        nativeEvent: { layout: { width: 40 } },
      });
    }

    await rendered.rerender(<ExampleTable first={<Text>変更後</Text>} />);
    expect(screen.getByText('変更後')).toBeTruthy();
    expect(screen.getByText('変更後').parent?.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ width: 40 })]),
    );
  });

  it('Table外のTd利用をエラーにし、表以外のchildrenはそのまま保持する', async () => {
    await expect(render(<Td><Text>孤立セル</Text></Td>)).rejects.toThrow(
      'Table components must be used inside <Table>',
    );

    await render(
      <Table>
        {null}
        <View>
          <Text>表外</Text>
        </View>
        <TBody>
          <View><Text>row以外</Text></View>
          <Tr>
            <Text>cell以外</Text>
            <Td><Text>有効セル</Text></Td>
          </Tr>
        </TBody>
      </Table>,
    );
    expect(screen.getByText('表外')).toBeTruthy();
    expect(screen.getByText('row以外')).toBeTruthy();
    expect(screen.getByText('cell以外')).toBeTruthy();
  });
});
