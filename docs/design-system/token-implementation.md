# Design Token Implementation

このドキュメントは、[`design-system-v1.md`](./design-system-v1.md)で定義したデザイン基準を、React Native / Expo / NativeWind 4へ実装するためのトークン定義と実装順序をまとめたものです。

> 対象環境: Expo SDK 56 / React Native 0.85 / React 19.2.3 / NativeWind 4
>
> 方針: ライトモードを優先し、ダークモードへ拡張できるtoken構造を採用します。

## 1. Single Source of Truth

- デザイントークンの実値は、`src/lib/theme/`を正本として管理する。
- NativeWind設定とCSS variablesは、トークンをutility classへ接続し、light / darkを適用する層として扱う。
- コンポーネント内に同じ色・余白・角丸・文字サイズ・コンポーネント寸法を重複定義しない。
- NativeWind 4での具体的な接続方法は、既存の`global.css`、Tailwind設定、Metro/Babel設定を確認したうえで決定する。

## 2. 推奨ファイル構成

```text
src/lib/theme/
├─ tokens.ts
├─ themes.ts
├─ nativewind.ts
└─ index.ts
```

- `tokens.ts`: spacing、radius、typography、componentSize、mahjong固有サイズなどの静的トークン。
- `themes.ts`: light / darkのsemantic color roles。
- `nativewind.ts`: theme tokenとNativeWind / CSS variablesの接続。
- `index.ts`: 外部公開するtokenと型の集約。

---

## D. 実装時に最初に作成すべきデザイントークン

### Color tokens

```ts
const colors = {
  primary: '#0B6B3A',
  onPrimary: '#FFFFFF',
  primaryContainer: '#D8F4E3',
  onPrimaryContainer: '#073B22',
  background: '#F7FAF7',
  surface: '#FFFFFF',
  surfaceVariant: '#EAF1EC',
  onSurface: '#17211B',
  onSurfaceVariant: '#5D6B62',
  outline: '#B8C7BD',
  error: '#BA1A1A',
  onError: '#FFFFFF',
  success: '#16834A',
  warning: '#B26A00',
  disabled: '#C9D1CB',
  onDisabled: '#7A847D',
  scorePositive: '#0B6B3A',
  scoreNegative: '#C2410C',
  rank1: '#B7791F',
  rank2: '#718096',
  rank3: '#A16207',
  chip: '#2563EB',
} as const;
```

### Spacing tokens

```ts
const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
} as const;
```

### Radius tokens

```ts
const radius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
} as const;
```

### Typography tokens

```ts
const typography = {
  screenTitle: { fontSize: 24, lineHeight: 32, fontWeight: '700' },
  sectionTitle: { fontSize: 20, lineHeight: 28, fontWeight: '700' },
  cardTitle: { fontSize: 17, lineHeight: 24, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  bodyStrong: { fontSize: 16, lineHeight: 24, fontWeight: '600' },
  bodySmall: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
  score: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  scoreSmall: { fontSize: 16, lineHeight: 22, fontWeight: '700' },
  rank: { fontSize: 18, lineHeight: 24, fontWeight: '700' },
  tableHeader: { fontSize: 13, lineHeight: 18, fontWeight: '700' },
} as const;
```

### Component size tokens

```ts
const componentSize = {
  buttonHeight: 48,
  buttonHeightSmall: 40,
  inputHeight: 48,
  iconButtonSize: 40,
  iconButtonTapTarget: 48,
  listRowMinHeight: 56,
  tableRowMinHeight: 44,
  dialogMaxWidth: 560,
} as const;
```

### Mahjong-specific tokens

```ts
const mahjong = {
  scoreCellWidth: 88,
  scoreCellMinWidth: 80,
  gameColumnWidth: 80,
  playerColumnWidth: 104,
  totalColumnWidth: 104,
  tableHeaderHeight: 44,
  scoreInputHeight: 40,
} as const;
```

---

---

## E. 実装順序の推奨

### Phase 1: トークン基盤

1. `colors`, `spacing`, `radius`, `typography` を定義する。
2. NativeWind / CSS variables / `lib/theme.ts` のどこを single source of truth にするか決める。
3. light / dark の token structure を用意する。
4. 既存の HSL 変数を v1 color roles に置き換える計画を作る。

### Phase 2: 基本コンポーネント

1. Button
   - 48px height。
   - Primary / Secondary / Tertiary / Destructive / IconButton。
   - disabled / loading / pressed。
2. Text
   - typography token variant。
3. Card
   - padding / radius / border / elevation。
4. Input
   - label / helper / error / focus / disabled。
5. Dialog
   - Header / Content / Footer。
   - keyboard behavior。
   - Android back button policy。

### Phase 3: 画面共通レイアウト

1. `Screen` / `PageContainer` 相当を作る。
2. SafeArea + background + horizontal padding を整理する。
3. Header / PageTitleBar を再設計する。
4. Section component を作る。
5. Empty / Loading / Error state component を作る。

### Phase 4: 一覧 UI

1. Group list item。
2. Tournament list item。
3. Table list item。
4. Participant list item。
5. Badge / status chip。

### Phase 5: 麻雀スコア UI

1. ScoreText component。
2. RankBadge component。
3. ScoreTable token 適用。
4. 横スクロールと固定列方針。
5. 点数入力 row の selected / editing / warning state。
6. 合計 0 validation の視覚表現。

### Phase 6: OS 別の自然さ調整

1. Android pressed feedback / elevation。
2. iOS opacity / sheet-like modal behavior。
3. Back / share / more icon の platform 差分。
4. Dynamic Type / font scaling の検証。

### Phase 7: アクセシビリティ確認

1. IconButton の `accessibilityLabel`。
2. Button / ListItem の role。
3. 点数セルの読み上げ文言。
4. 色だけに依存しないエラー・選択・順位表示。
5. 文字拡大時の layout 確認。
