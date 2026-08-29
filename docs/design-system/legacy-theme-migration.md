# Legacy Theme Migration

## 現在の状態

旧 HSL theme から Design System v1 の semantic token への基盤移行は完了しています。現在の正本は `src/lib/theme/` です。

```text
src/lib/theme/
├── tokens.ts       # color、spacing、radius、typography、component size
├── themes.ts       # light / dark の semantic color
├── nativewind.ts   # NativeWind の CSS variables への接続
└── index.ts        # 公開 export
```

`ThemeProvider` が light / dark / system の選択を解決し、NativeWind の `vars()` へ theme を渡します。`src/global.css` は Tailwind layer と共通 radius のみを保持し、旧 HSL color variables は現行 theme の入力ではありません。

## 互換ファイル

- `lib/theme.ts` は React Native Reusables の doctor 用に残している未使用の互換ファイルです。アプリの theme 値を追加・変更しません。
- `src/global.css.old` は旧設定の参照用で、Metro の入力ではありません。新しい実装から参照しません。

これらを削除する場合は、CLI / doctor の利用有無と参照ゼロを確認して別作業で扱います。

## 今後の変更ルール

- 色は `primary`、`surface`、`onSurface`、`outline`、`error` など用途ベースの role を使う。
- 色・余白・角丸・文字・コンポーネント寸法を追加する場合は、まず `src/lib/theme/` の既存 token で表現できるか確認する。
- 背景と前景を対で選び、light / dark の両方を確認する。
- dark theme の `provisionalDarkRoles` は Design System v1 で dark 値が未定義の role です。個別画面で上書きせず、定義が決まった時点で `themes.ts` を更新する。
- Android / iOS、pressed / focused / disabled / selected / error、文字拡大と読み上げを確認する。

token の値と適用順序は [Design Token Implementation](token-implementation.md)、UI の基準は [Design System v1](design-system-v1.md) を参照してください。
