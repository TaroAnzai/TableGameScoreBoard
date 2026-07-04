import React, { useEffect, useRef, useState } from 'react';
import { type LayoutChangeEvent, View, type ViewStyle } from 'react-native';

type ElementWithChildren = React.ReactElement<{
  children?: React.ReactNode;
}>;

const isElement = (node: React.ReactNode): node is ElementWithChildren => {
  return React.isValidElement(node);
};

type TableContextValue = {
  measuring: boolean;
  columnWidths: Record<number, number>;
  onCellLayout: (rowIndex: number, columnIndex: number, width: number) => void;
};

const TableContext = React.createContext<TableContextValue | null>(null);

const useTableContext = () => {
  const context = React.useContext(TableContext);
  if (!context) {
    throw new Error('Table components must be used inside <Table>');
  }
  return context;
};

type TableProps = {
  children: React.ReactNode;
  style?: ViewStyle;
};

export const Table = ({ children, style }: TableProps) => {
  const indexedChildren = attachIndexes(children);
  const totalCellCount = countCells(children);

  const [measuring, setMeasuring] = useState(true);
  const [columnWidths, setColumnWidths] = useState<Record<number, number>>({});

  const measuredCells = useRef(new Set<string>());

  // --- 修正①: children の"内容"を表すキーを作り、変化を検知して再計測する ---
  // セル数だけでなく、テキスト内容も含めることで
  // 「行数は同じだがテキストが変わった」ケースも検知できるようにする。
  const contentKey = React.useMemo(() => buildContentKey(children), [children]);
  const prevContentKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (prevContentKeyRef.current === contentKey) {
      return;
    }
    prevContentKeyRef.current = contentKey;

    measuredCells.current.clear();
    setColumnWidths({});
    setMeasuring(true);
  }, [contentKey]);

  const handleCellLayout = (rowIndex: number, columnIndex: number, width: number) => {
    const key = `${rowIndex}-${columnIndex}`;
    measuredCells.current.add(key);

    setColumnWidths((prev) => {
      const current = prev[columnIndex] ?? 0;

      if (width <= current) return prev;

      return {
        ...prev,
        [columnIndex]: width,
      };
    });

    if (measuredCells.current.size >= totalCellCount) {
      setMeasuring(false);
    }
  };

  return (
    <TableContext.Provider
      value={{
        measuring,
        columnWidths,
        onCellLayout: handleCellLayout,
      }}
    >
      {measuring ? (
        // --- 修正②: 非表示の計測用コンテナがタッチを奪わないように pointerEvents="none" を追加 ---
        <View style={{ position: 'absolute', opacity: 0 }} pointerEvents="none">
          {indexedChildren}
        </View>
      ) : (
        <View style={style}>{indexedChildren}</View>
      )}
    </TableContext.Provider>
  );
};

type SectionProps = {
  children: React.ReactNode;
  style?: ViewStyle;
};

export const THead = ({ children, style }: SectionProps) => {
  return <View style={style}>{children}</View>;
};

export const TBody = ({ children, style }: SectionProps) => {
  return <View style={style}>{children}</View>;
};

type TrProps = {
  children: React.ReactNode;
  style?: ViewStyle;
};

export const Tr = ({ children, style }: TrProps) => {
  return <View style={[{ flexDirection: 'row' }, style]}>{children}</View>;
};

type TdProps = {
  children: React.ReactNode;
  rowIndex?: number;
  columnIndex?: number;
  style?: ViewStyle;
};

export const Td = ({ children, rowIndex = 0, columnIndex = 0, style }: TdProps) => {
  const { measuring, columnWidths, onCellLayout } = useTableContext();

  const handleLayout = (e: LayoutChangeEvent) => {
    if (!measuring) return;

    onCellLayout(rowIndex, columnIndex, e.nativeEvent.layout.width);
  };

  return (
    <View
      onLayout={handleLayout}
      style={[
        {
          borderWidth: 1,
          borderColor: '#ccc',
          paddingHorizontal: 8,
          paddingVertical: 6,
          justifyContent: 'center',
        },
        !measuring && {
          width: columnWidths[columnIndex],
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const attachIndexes = (children: React.ReactNode) => {
  let rowIndex = 0;

  return React.Children.map(children, (section) => {
    if (!isElement(section)) return section;
    if (section.type !== THead && section.type !== TBody) return section;

    return React.cloneElement(section as React.ReactElement<SectionProps>, {
      children: React.Children.map(section.props.children, (row) => {
        if (!isElement(row) || row.type !== Tr) return row;

        const currentRowIndex = rowIndex;
        rowIndex += 1;

        return React.cloneElement(row as React.ReactElement<TrProps>, {
          children: React.Children.map(row.props.children, (cell, columnIndex) => {
            if (!isElement(cell) || cell.type !== Td) return cell;

            return React.cloneElement(cell as React.ReactElement<TdProps>, {
              rowIndex: currentRowIndex,
              columnIndex,
            });
          }),
        });
      }),
    });
  });
};

const countCells = (children: React.ReactNode) => {
  let count = 0;

  React.Children.forEach(children, (section) => {
    if (!isElement(section)) return;
    if (section.type !== THead && section.type !== TBody) return;

    React.Children.forEach(section.props.children, (row) => {
      if (!isElement(row) || row.type !== Tr) return;

      React.Children.forEach(row.props.children, (cell) => {
        if (!isElement(cell) || cell.type !== Td) return;
        count += 1;
      });
    });
  });

  return count;
};

// --- 修正①のためのヘルパー ---
// children ツリーを歩いて、内容を表す文字列キーを作る。
// Td の children がプリミティブ(string/number)であればそれを利用し、
// 要素であれば構造上の位置情報だけを使う(完全な内容比較ではないが、
// 一般的なテーブル用途 = 文字列/数値セル であれば十分に機能する)。
const buildContentKey = (children: React.ReactNode): string => {
  const parts: string[] = [];

  React.Children.forEach(children, (section) => {
    if (!isElement(section)) return;
    if (section.type !== THead && section.type !== TBody) return;

    React.Children.forEach(section.props.children, (row) => {
      if (!isElement(row) || row.type !== Tr) return;

      React.Children.forEach(row.props.children, (cell) => {
        if (!isElement(cell) || cell.type !== Td) return;

        const cellChildren = (cell.props as TdProps).children;
        if (typeof cellChildren === 'string' || typeof cellChildren === 'number') {
          parts.push(String(cellChildren));
        } else {
          // 文字列以外(カスタム要素など)の場合は内容比較を諦め、
          // 存在したことだけをマークする。必要に応じて key prop を
          // 利用した比較に差し替えてください。
          parts.push('[node]');
        }
      });
    });
  });

  return parts.join('|');
};
