# Maestro E2E

## 構成

```text
.maestro/
├── flows/     # 既存の開発・回帰フローと共通起動フロー
├── p0/        # リリースを止める主要導線（保存、権限、点数入力）
├── p1/        # 削除、統計期間、承認待ち同期
├── p2/        # 設定、言語、戻る操作、Deep Link エラー
└── scripts/   # API フィクスチャとテストデータ生成
```

`flows/mahjong-full-journey.yaml`、`flows/cache-invalidation-journey.yaml`、
`flows/edit-link-registration-journey.yaml` は既存回帰テストです。移動後も `runFlow` / `runScript`
の相対パスを更新済みです。

## 実行前提

- Android 開発ビルドと Metro が起動していること
- 対象アプリ ID を `APP_ID` に設定すること（開発ビルドは `com.anzaihome.mahjongapp.dev`）
- P0/P1/P2 のリンク系フローは、専用の使い捨てバックエンド fixture を作り、必要なリンク・表示名を
  環境変数で渡すこと
- 保存済みページ・言語・テーマを検証する前にはアプリデータをクリアすること

リンクは `mahjongapp-dev:///tournament/<key>` のようなアプリスキーム、または App Link を渡せます。
VIEW / EDIT / OWNER は同一リソースから発行した実キーを使ってください。公開データや日常利用のキーを
E2E に使わないでください。

```sh
maestro test -e APP_ID=com.anzaihome.mahjongapp.dev \
  -e TOURNAMENT_DIRECT_LINK='mahjongapp-dev:///tournament/<key>' \
  -e TOURNAMENT_NAME='E2E 大会' \
  -e TABLE_DIRECT_LINK='mahjongapp-dev:///table/<key>' \
  -e TABLE_NAME='E2E 卓' \
  .maestro/p0/shared-link-saved-pages.yaml
```

権限・異常系・承認待ちの各フローが要求する変数は、当該 YAML の先頭コメントに記載しています。
特に `score-input-validation.yaml` の `SCORE_FAILURE_TABLE_EDIT_LINK` は、最初のゲーム作成だけ 5xx を返す
fixture である必要があります。これにより「モーダル保持」「再試行」「重複作成なし」を実際の API と
合わせて検証できます。

## P0 の実行

```sh
maestro test -e APP_ID=com.anzaihome.mahjongapp.dev .maestro/p0/shared-link-saved-pages.yaml
maestro test -e APP_ID=com.anzaihome.mahjongapp.dev .maestro/p0/access-control.yaml
maestro test -e APP_ID=com.anzaihome.mahjongapp.dev .maestro/p0/score-input-validation.yaml
```

`access-control.yaml` はモバイル UI と親→子リンクの権限を確認します。EDIT で OWNER 専用の大会削除が
露出しないこと、OWNER で露出することを明示的に検証します。現在の実装との差異があれば、この P0 は
失敗します。さらに、同じ fixture キーでバックエンドの permission contract test も組にして実行し、
UI 非表示だけで権限制御を済ませないでください。

## P1/P2 の実行

```sh
maestro test -e APP_ID=com.anzaihome.mahjongapp.dev .maestro/p1/deletion-flows.yaml
maestro test -e APP_ID=com.anzaihome.mahjongapp.dev .maestro/p1/stats-period.yaml
maestro test -e APP_ID=com.anzaihome.mahjongapp.dev .maestro/p1/pending-groups.yaml
maestro test -e APP_ID=com.anzaihome.mahjongapp.dev .maestro/p2/settings-navigation.yaml
```

Maestro の `assertVisible` / `assertNotVisible` は短時間の状態変化を自動的に待機するため、任意の固定 sleep は
入れていません。長い API 待機だけ `extendedWaitUntil` を使っています。
