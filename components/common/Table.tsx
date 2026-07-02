import React, { createContext, useContext, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';

type TableContextType = {
  columnWidths: Record<number, number>;
  reportWidth: (columnIndex: number, width: number) => void;
};

const TableContext = createContext<TableContextType | null>(null);

export const Table = ({ children }: { children?: React.ReactNode }) => {
  // 計測済みの列幅（null の間は計測フェーズ）
  const [columnWidths, setColumnWidths] = useState<number[] | null>(null);
  const measuredWidths = useRef<number[]>(new Array(columnCount).fill(0));
  const measuredCount = useRef(0);

  const reportWidth = (columnIndex: number, width: number) => {
    setColumnWidths((prev) => {
      if ((prev[columnIndex] ?? 0) >= width) return prev;
      return {
        ...prev,
        [columnIndex]: width,
      };
    });
  };
  // --- フェーズ1: 画面外での幅計測パス ---
  if (!columnWidths) {
    return (
      <View style={styles.measureContainer} pointerEvents="none">
        {children}
      </View>
    );
  }
  // --- フェーズ2: 計測済み幅を使った本番描画 ---
  return (
    <TableContext.Provider value={{ columnWidths, reportWidth }}>
      <View style={styles.table}>{children}</View>
    </TableContext.Provider>
  );
};

export const TableRow = ({ children }: { children: React.ReactNode }) => {
  return <View className="flex-row">{children}</View>;
};

type TableCellProps = {
  children: React.ReactNode;
  columnIndex: number;
  header?: boolean;
};

export const TableCell = ({ children, columnIndex, header = false }: TableCellProps) => {
  const context = useContext(TableContext);

  const width = context?.columnWidths[columnIndex];

  const handleLayout = (event: LayoutChangeEvent) => {
    const measuredWidth = event.nativeEvent.layout.width;
    context?.reportWidth(columnIndex, measuredWidth);
  };

  return (
    <View
      onLayout={handleLayout}
      style={width ? { width } : undefined}
      className={[
        'border border-gray-300 px-2 py-2 items-center justify-center',
        header ? 'bg-green-800' : 'bg-transparent',
      ].join(' ')}
    >
      <Text numberOfLines={1} className="text-center text-white">
        {children}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  measureContainer: {
    position: 'absolute',
    opacity: 0,
    left: -9999,
    top: 0,
  },
  table: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
  },
  headerText: {
    fontWeight: 'bold',
  },
});
