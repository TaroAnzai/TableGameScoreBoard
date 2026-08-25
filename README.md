# 麻雀集計

麻雀グループ・大会・卓・半荘スコアを管理する Expo / React Native アプリです。Android、iOS、Web を対象にし、既存の麻雀 API と連携します。

## 主な機能

- グループの作成申請・参加・削除、プレイヤー管理
- 大会の作成・編集・削除、参加者と卓の管理
- 通常卓・チップ卓のスコア入力、編集、集計表示
- グループ別・期間指定の統計表示
- 共有リンク、保存済みページ、アクセス権限に応じた UI
- 日本語／英語、ライト／ダーク／システムテーマ
- Universal Link / App Link とカスタム URL スキームによる画面遷移

## 技術構成

| 分類 | 採用技術 |
| --- | --- |
| アプリ基盤 | Expo SDK 57 / React Native 0.86 / React 19 |
| ルーティング | Expo Router |
| データ取得・キャッシュ | TanStack Query |
| API クライアント | Orval で OpenAPI から生成、fetch ラッパー |
| UI | React Native Reusables、NativeWind、Lucide |
| 多言語化 | i18next / react-i18next |
| ローカル保存 | AsyncStorage / SecureStore |
| テスト | Jest、React Native Testing Library、Maestro |
| 配布 | EAS Build |

## 必要環境

- Node.js と npm
- Android 開発では Android Studio / Android SDK
- iOS 開発では macOS、Xcode、CocoaPods
- API サーバー（ローカル開発時の既定値は `http://localhost:6080`）

## セットアップ

```bash
npm install
```

`.env` をプロジェクト直下に作成し、接続先を設定します。`.env` は Git 管理されません。

```dotenv
# 開発時のアプリ API
EXPO_PUBLIC_DEV_API_URL=http://localhost:6080

# 本番アプリ API
EXPO_PUBLIC_API_URL=https://api.anzai-home.com/mahjong

# 共有リンクの Web URL
EXPO_PUBLIC_WEB_URL=https://anzai-home.com/mahjong

# OpenAPI からのクライアント生成用
ORVAL_API_URL=http://localhost:6080/doc/openapi.json
```

未設定時は、開発ビルドでは `http://localhost:6080`、本番ビルドでは `https://api.anzai-home.com/mahjong` を使用します。

## 開発

### 開発サーバー

```bash
npm start
```

Web で起動する場合:

```bash
npm run web
```

### Android 開発ビルド

Android の開発用アプリ ID は `com.anzaihome.mahjongapp.dev`、URL スキームは `mahjongapp-dev` です。

```bash
npm run android
```

実機を USB 接続してローカル API と Metro を使う場合は、別のターミナルで次を実行します。

```bash
./start_debug_start.sh
```

このスクリプトは `adb reverse` で 8081、6080、8025 を端末へ転送し、開発クライアント用 Metro を起動します。エミュレーターや実機から API へ直接接続する場合は、`EXPO_PUBLIC_DEV_API_URL` をその環境から到達できる URL に設定してください。

### iOS

```bash
npm run ios
```

## API クライアントの生成

OpenAPI 定義から TanStack Query 用のクライアントを生成します。生成先は `src/api/generated/` です。

```bash
npm run generate:api
```

`ORVAL_API_URL` には OpenAPI 定義の URL を設定してください。生成コードは直接編集せず、HTTP 共通処理は `src/api/customFetch.ts` と `src/api/customFetchAdmin.ts` を変更します。

## テストと静的検査

```bash
npm test
npm run lint
```

Maestro の E2E フローは `.maestro/` にあります。Android 開発ビルドと Metro を起動し、対象のアプリ ID を指定して実行します。

```bash
.maestro/scripts/maestro-test.sh .maestro/tests/p0/access-control.yaml
```

リンク・権限・スコア入力を検証するフローには追加の環境変数や API fixture が必要です。詳細は [.maestro/README.md](.maestro/README.md) を参照してください。

## ビルドと配布

EAS のビルドプロファイルは `eas.json` で定義しています。

```bash
# 開発クライアント
npx eas-cli@latest build --platform android --profile development

# 社内配布用 APK
npx eas-cli@latest build --platform android --profile preview

# ストア提出用
npx eas-cli@latest build --platform android --profile production
```

初回は Expo へログインし、必要に応じて EAS を設定してください。

```bash
npx eas-cli@latest login
npx eas-cli@latest build:configure
```

## 画面とルーティング

| パス | 内容 |
| --- | --- |
| `/` | グループ一覧・作成申請 |
| `/group/create` | グループ作成 |
| `/group/[groupKey]` | グループ、プレイヤー、大会の管理 |
| `/tournament/[tournamentKey]` | 大会、参加者、卓、集計 |
| `/table/[tableKey]` | 卓と半荘スコアの管理 |
| `/stats` | 統計 |
| `/settings` | 言語・テーマ設定 |

本番アプリの ID は `com.anzaihome.mahjongapp`、URL スキームは `mahjongapp` です。`https://anzai-home.com/mahjong/...` の App Link と、上記スキームの Deep Link を受け付けます。

## ディレクトリ構成

```text
app/                 Expo Router の画面と Deep Link 変換
components/          画面部品・UI プリミティブ
src/api/             API 共通処理と OpenAPI 生成クライアント
src/hooks/           TanStack Query を使うデータ取得・更新フック
src/providers/       テーマ・言語プロバイダー
src/storage/         端末内の設定・保存済みリンク
src/i18n/            翻訳リソース
__tests__/           Jest テスト
.maestro/            Maestro E2E フローと fixture スクリプト
assets/              アプリアイコンなどの画像
```

## 関連ドキュメント

- [ナビゲーション設計](docs/Navigation.md)
- [API v2 移行](docs/v2-api-migration.md)
- [API エラー表示](docs/api-error-presentation.md)
- [デザインシステム](docs/design-system/design-system-v1.md)
