# Maestro E2E テスト

Maestro は Android 開発ビルドを対象に、ユーザー操作を通した回帰を確認します。すべてのテストはリポジトリルートから `.maestro/scripts/maestro-test.sh` 経由で実行してください。

## 構成

```text
.maestro/
├── config.yaml
├── tests/
│   ├── p0/          # 権限、点数、保存リンク、離脱、削除後遷移
│   ├── p1/          # 削除、通信再試行、作成待ち、統計期間
│   ├── p2/          # 設定画面のナビゲーション
│   └── journeys/    # グループ作成からスコア保存までの Happy Path
├── flows/common/    # 複数テストで共有する短い UI 操作
├── fixtures/
│   ├── setup/       # API を使ったテストデータ作成
│   └── teardown/    # 作成したグループの削除
└── scripts/         # runner、GUI、fixture 補助、通信モード制御
```

親テストは優先度ディレクトリ直下の YAML です。同名サブディレクトリ内の YAML は親から `runFlow` されるテスト固有 subflow で、単独テストとして実行しません。共有可能な操作だけを `flows/common/` に置きます。

## 前提と環境変数

開発ビルド、Metro、開発 API を起動してから実行します。標準対象は `config.yaml` の app ID `com.anzaihome.mahjongapp.dev`、scheme `mahjongapp-dev` です。

`.maestro/config.yaml` は app ID、fixture 名の prefix、統計テストの日付など、秘密でない設定の正本です。runner はこの `env` の単純な scalar を Maestro へ渡します。API URL と管理者資格情報はルート `.env` に置き、`config.yaml` やログへコピーしません。

```dotenv
MAESTRO_DEV_API_URL=http://localhost:6080
MAESTRO_DEV_ADMIN=...
MAESTRO_DEV_ADMIN_PASSWORD=...
```

実際のキー名と必須条件は fixture script を正としてください。

## 実行方法

```bash
.maestro/scripts/maestro-test.sh .maestro/tests/p0
.maestro/scripts/maestro-test.sh .maestro/tests/p1
.maestro/scripts/maestro-test.sh .maestro/tests/p2
.maestro/scripts/maestro-test.sh .maestro/tests/journeys/happy-path.yaml
.maestro/scripts/maestro-test.sh .maestro/tests/p0/access-control.yaml
.maestro/scripts/maestro-test.sh .maestro/tests --include-tags=p0
```

runner はルート `.env`、`.maestro/config.yaml` の順に設定を読み、開始前と終了時（割り込み・失敗を含む）にローカル通信モードを `normal` へ戻します。引数なしでは実行せず usage を表示します。

## fixture と cleanup

サーバーデータが必要な親フローは `onFlowStart` から `fixtures/setup/create-test-data.js` を呼びます。主な指定は `FIXTURE_GROUP_COUNT`、`FIXTURE_PLAYER_COUNT`、`FIXTURE_SECOND_GROUP_PLAYER_COUNT`、`FIXTURE_CREATE_GAME`、`FIXTURE_CREATE_EXTRA_TABLE`、`FIXTURE_ADD_INVALID_LINK` です。作成結果は `output.fixture.*` から参照します。

`onFlowComplete` は `fixtures/teardown/delete-group.js` でグループを削除します。バックエンドの cascade により大会、卓、ゲームも論理削除されます。setup は最初のグループ作成直後に key を出力するため、途中失敗でも cleanup できます。fixture が不要なテストには setup / teardown を追加しません。

`pending-groups.yaml` はアプリから作成した request を補助 script で準備・承認します。完了時には承認済み fixture を削除し、期限切れ override も解除します。

## ネットワーク障害と mitmproxy

`score-input-validation.yaml`、`main-screen-retry.yaml`、`pending-groups.yaml` は `.maestro/scripts/set-network-mode.js` を通じ、`http://127.0.0.1:9099` の controller を操作します。これらを実行する場合は mitmproxy と controller を起動し、開発ビルドの API 通信を proxy の entrypoint へ向けてください。利用モードは `normal`、`offline`、`500`、`expired`、`pending-reset` です。

## 現在の主要シナリオ

- Happy Path: グループ、大会、卓の作成、参加申請・承認、点数保存、ホーム復帰
- 権限制御: OWNER / EDIT / VIEW でのグループ・大会・卓操作
- 点数入力: 不正合計の拒否、正常保存、ネットワーク障害からの復旧
- 保存リンクと Deep Link: 共有ページの保存、再表示、削除、案内の dismiss
- 未保存ページからの離脱: キャンセル、保存して離脱、保存せず離脱、卓作成後の離脱
- 削除後遷移: 直接・ネストしたゲーム、卓、大会、登録の削除と履歴
- 作成待ち、統計期間・グループ切替、設定画面ナビゲーション

フローを変更したら YAML 構文、全 `runFlow` / `runScript` パス、JavaScript 構文、`output.fixture.*` の参照を確認してください。
