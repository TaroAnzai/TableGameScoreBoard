# Jest Coverage 運用方針

## 目的

Coverage は 100% や数値の上昇そのものを目的にせず、重要な機能と条件分岐に十分な回帰テストがあるかを判断する材料として使います。プロジェクト全体は既に十分高い水準にあるため、通常運用では次を優先します。

- 新機能と同時に、その正常系・重要な異常系のテストを追加する
- バグ修正時に、同じ不具合を再発させない回帰テストを追加する
- Coverage の大幅な低下を防ぐ
- ファイル単位で Branches、Functions、重要な未実行処理を確認する

Statements / Lines が高くても、エラー、キャンセル、権限、境界値などの Branch が未検証なら十分とは判断しません。

## 現在の Jest 設定

正本は `package.json` の `jest` セクションです。

```json
{
  "preset": "jest-expo",
  "setupFilesAfterEnv": ["<rootDir>/jest.setup.ts"],
  "collectCoverageFrom": [
    "app/**/*.{ts,tsx}",
    "components/**/*.{ts,tsx}",
    "src/**/*.{ts,tsx}",
    "lib/**/*.{ts,tsx}"
  ],
  "coveragePathIgnorePatterns": [
    "/node_modules/",
    "/src/api/generated/",
    "/components/ui/"
  ]
}
```

`transform` と `transformIgnorePatterns` も `package.json` に定義されています。依存パッケージや Expo SDK の更新時は、文書の例ではなく実設定を確認してください。

`collectCoverageFrom` により、テストから import されたファイルだけでなく、次の実装領域を Coverage の母集団に含めます。

- `app/`: Expo Router の画面とルーティング処理
- `components/`: アプリ固有コンポーネント
- `src/`: API 共通処理、Hooks、Provider、Storage、ユーティリティなど
- `lib/`: 共通ユーティリティなど

## 除外方針

- `src/api/generated/` は Orval による自動生成コードのため除外します。生成元とアプリ側の共通 fetch 処理をテスト対象とし、生成結果の行 Coverage は追いません。
- `components/ui/` は外部 UI ライブラリ等をラップする低レベルの汎用 UI primitive が中心で、アプリ固有の業務ロジックではないため除外します。その primitive を利用するアプリ固有コンポーネントの振る舞いはテストします。
- `node_modules/` は依存パッケージのため除外します。

Coverage の数字を上げるために任意の実装を除外してはいけません。新しい除外は、生成物や外部由来の基盤コードなど、アプリ側で行 Coverage を負うべきでない理由を説明できるものに限定し、`package.json` と本書を同時に更新します。

型定義だけのファイル、barrel export、定数の再公開など、実行コードをほぼ持たないファイルには、Coverage 数値だけを理由にテストを追加しません。除外も自動的には追加せず、まず未実行箇所が実際のリスクを持つか確認します。

## テスト追加の優先順位

1. 点数の入力・保存、削除、権限制御、Deep Link、保存リンク、主要画面遷移などの重要な未テスト処理
2. 重要ファイルの Branch Coverage（API エラー、キャンセル、空状態、境界値、権限差など）
3. 重要ファイルの Functions Coverage（イベントハンドラ、mutation、navigation、再試行など）
4. 意味のある大きな未実行領域
5. 通常 UI の表示・操作

ファイルの重要度に応じて判断し、全ファイルへ一律の達成率や 100% を要求しません。数値のためだけの防御コードの実行、実装詳細に密結合したテスト、意味のない snapshot は追加しません。

## Jest と Maestro の役割

Jest は関数、Hooks、Storage、API 成功・失敗、条件分岐、mutation、router 呼び出しなどを高速に固定します。Maestro は実アプリ上の Deep Link、Android Back、複数画面の Happy Path、権限制御、点数入力、削除後遷移、未保存ページ離脱、ネットワーク障害を確認します。

同じシナリオを Coverage のためだけに両方へ重複させません。Maestro の現行構成は [`.maestro/README.md`](../.maestro/README.md) を参照してください。

## 実行方法

```bash
# 全 Jest テスト
npm test

# Coverage を収集
npm test -- --coverage

# 直列実行
npm test -- --runInBand
```

Coverage 生成物の `coverage/` は Git 管理対象外です。レポートでは全体値だけでなく、重要ファイルの Branches / Functions と未実行行の内容を確認してください。
