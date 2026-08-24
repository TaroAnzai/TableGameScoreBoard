# Maestro E2E

## 構成

```text
.maestro/
├── config.yaml  # 共通のアプリ ID と固定 fixture のリンク・表示名
├── flows/       # 開発・回帰フローと共通フロー
├── p0/          # リリースを止める主要導線（保存、権限、点数入力）
├── p1/          # 削除、統計期間、承認待ち同期
├── p2/          # 設定、言語、戻る操作、Deep Link エラー
└── scripts/     # テスト実行、通信切替、API fixture・テストデータ生成
```

`config.yaml` には専用 E2E fixture の値を置きます。fixture を作り直した場合は、このファイルのリンクと
表示名を更新してください。公開データや日常利用しているキーは E2E に使わないでください。

## 実行前提

- Maestro CLI が `PATH` にあること
- Android 開発ビルドと Metro が起動していること
- `config.yaml` の `APP_ID` とリンクがテスト対象の開発ビルド・バックエンドを指していること
- 日本語 UI を検証するフローでは、`flows/select-japanese.yaml` をアプリ起動後に追加すること。
- 保存済み共有リンクが空である必要があるフローだけは、`flows/clear-app-data-and-select-japanese.yaml` を使うこと。
  `clearState` は開発ビルドの defaultLaunchURL を消すため使わず、保存済みページを長押しで全削除する。
- 通信異常を検証する場合は、`http://127.0.0.1:9099` に通信モード切替用のテストサーバーが起動していること

P0/P1/P2 の一部は固定 fixture に加えて個別の fixture を必要とします。必要な環境変数は各 YAML の先頭コメントを
確認してください。たとえば `score-input-validation.yaml` の `SCORE_FAILURE_TABLE_EDIT_LINK` は、最初の
スコア保存だけが失敗する fixture を指す必要があります。

## テストの実行

**Maestro テストは必ずプロジェクトルートから `.maestro/scripts/maestro-test.sh` 経由で実行してください。**
`maestro test` を直接実行しません。このスクリプトは `config.yaml` の `env` を読み込み、`--config` と環境変数を
Maestro に渡したうえで、開始前と終了時に通信モードを `normal` に戻します。

```sh
.maestro/scripts/maestro-test.sh <flow-or-directory> [maestro test options...]
```

例:

```sh
.maestro/scripts/maestro-test.sh .maestro/p0/access-control.yaml
.maestro/scripts/maestro-test.sh .maestro/p1
.maestro/scripts/maestro-test.sh .maestro/p2/settings-navigation.yaml --format junit
```

### P0

```sh
.maestro/scripts/maestro-test.sh .maestro/p0/shared-link-saved-pages.yaml
.maestro/scripts/maestro-test.sh .maestro/p0/access-control.yaml
.maestro/scripts/maestro-test.sh .maestro/p0/score-input-validation.yaml
```

`access-control.yaml` は、VIEW・EDIT・OWNER の UI 権限を確認します。グループ画面では EDIT で大会削除が表示されず、
OWNER では表示されることを検証します。UI の非表示だけで完結させず、同じ fixture キーを使うバックエンドの
permission contract test も実行してください。

### P1 / P2

```sh
.maestro/scripts/maestro-test.sh .maestro/p1/deletion-flows.yaml
.maestro/scripts/maestro-test.sh .maestro/p1/stats-period.yaml
.maestro/scripts/maestro-test.sh .maestro/p1/pending-groups.yaml
.maestro/scripts/maestro-test.sh .maestro/p2/settings-navigation.yaml
```

### 既存の回帰フロー

`flows/` にはグループ作成・登録、キャッシュ無効化、共有 EDIT リンク、フルジャーニーなどの回帰フローがあります。
API を利用するフローは、ローカル API（既定では `http://localhost:6080`）に接続できる状態で実行します。

```sh
.maestro/scripts/maestro-test.sh .maestro/flows/new-group-request-test.yaml
.maestro/scripts/maestro-test.sh .maestro/flows/edit-link-registration-journey.yaml
.maestro/scripts/maestro-test.sh .maestro/flows/cache-invalidation-journey.yaml
.maestro/scripts/maestro-test.sh .maestro/flows/mahjong-full-journey.yaml
```

## 通信テスト

フロー内で通信をオフラインに切り替えるには、次の `runScript` を入れます。

```yaml
- runScript:
    file: ../scripts/set-network-mode.js
    env:
      MODE: offline
```

`set-network-mode.js` で指定できる値は `normal`、`offline`、`500` です。フロー内で切り替えた後も、
`maestro-test.sh` が終了時に `normal` へ戻します。途中で通信を復旧して後続操作を検証したい場合は、同じ形式で
`MODE: normal` を指定してください。

Maestro の `assertVisible` / `assertNotVisible` は短時間の状態変化を待機するため、固定の `sleep` は追加しません。
長い API 待機には `extendedWaitUntil` を使用します。
