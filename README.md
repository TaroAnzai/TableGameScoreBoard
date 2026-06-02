# 麻雀集計スマホアプリ

麻雀大会・グループ・参加者・卓・半荘スコアをスマートフォンから登録・集計するためのモバイルアプリです。
既存のWeb版麻雀大会集計システムをもとに、React Native / Expo へ移植して開発しています。

---

## 目的

- スマートフォンから麻雀大会を管理する
- グループ単位で参加者を管理する
- 大会ごとに参加者・卓を設定する
- 卓画面から半荘スコアを登録する
- 登録済みスコアを集計・確認する
- 既存のFlask APIバックエンドと連携する

---

## 使用スタック

### フロントエンド

| 用途 | 技術 |
|---|---|
| アプリ基盤 | React Native |
| 開発・実行環境 | Expo |
| 言語 | TypeScript |
| ルーティング | Expo Router |
| スタイリング | NativeWind |
| UIコンポーネント候補 | React Native Reusables |
| API通信 | fetch / axios いずれかを使用予定 |
| 状態管理 | 画面単位の state から開始、必要に応じて拡張 |

### スタイリング関連

| 用途 | 技術 |
|---|---|
| Tailwind互換 | NativeWind |
| Tailwind本体 | tailwindcss |
| アニメーション補助 | tailwindcss-animate |
| グローバルCSS | global.css |
| テーマ定義 | lib/theme.ts |

現在確認済みの主なパッケージ例:

```txt
expo: ~56.0.8
nativewind: 4.2.4
tailwindcss: 3.4.19
tailwindcss-animate: 1.0.7
```

React / React DOM は Expo SDK との互換バージョンに合わせる必要があります。
`npx expo install --fix` で依存関係を確認・修正します。

---

## バックエンド

既存のFlask APIバックエンドを利用します。

### 主なバックエンド構成

| 用途 | 技術 |
|---|---|
| API | Flask |
| DB | PostgreSQL または既存設定に準拠 |
| メール確認 | MailHog |
| 非同期処理 | Celery |
| 実行環境 | Docker / Docker Compose |

バックエンドはDocker Composeで起動する前提です。
フロントエンド側からは、ホスト側に公開されたAPIポートへアクセスします。

例:

```txt
6080:5000
```

この場合、ホストPCからは以下のようにアクセスします。

```txt
http://localhost:6080
```

AndroidエミュレーターからローカルPCのAPIへアクセスする場合は、通常以下を使用します。

```txt
http://10.0.2.2:6080
```

実機スマートフォンからアクセスする場合は、PCのLAN内IPアドレスを使用します。

```txt
http://<PCのIPアドレス>:6080
```

---

## 想定ディレクトリ構成

現在の会話で確認されている構成をもとにした想定です。
実際のファイル構成に合わせて随時更新してください。

```txt
mahjong-mobile/
├── app/
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── group/
│   ├── tournament/
│   └── table/
│
├── components/
│   ├── ui/
│   ├── group/
│   ├── tournament/
│   └── table/
│
├── lib/
│   ├── theme.ts
│   ├── constants.ts
│   └── utils.ts
│
├── api/
│   ├── auth_api.ts
│   ├── group_api.ts
│   ├── player_api.ts
│   ├── tournament_api.ts
│   └── table_api.ts
│
├── hooks/
│
├── assets/
│
├── global.css
├── tailwind.config.js
├── metro.config.js
├── babel.config.js
├── package.json
└── README.md
```

---

## 既存Web版の参考構成

Web版では、WordPress配下に `mahjong` フォルダを作成し、以下のような構成で管理していました。

```txt
mahjong/
├── api/
│   ├── auth_api.js
│   ├── group_api.js
│   ├── player_api.js
│   ├── table_api.js
│   └── tournament_api.js
├── js/
│   ├── group.js
│   ├── table.js
│   ├── tournament.js
│   ├── welcome.js
│   └── utils/
│       └── dom_utils.js
├── pages/
│   ├── group.html
│   ├── table.html
│   ├── tournament.html
│   └── welcome.html
├── mahjong-view.php
├── mahjong.css
└── mahjong.js
```

React Native版では、HTML / DOM操作 / CSS前提の処理はそのまま使えません。
ただし、API呼び出しロジック・データ構造・集計ロジックは流用できます。

---

## 画面構成

### Welcome画面

- グループ選択
- 新規グループ作成
- 既存グループへの参加導線

### Group画面

- グループ情報表示
- グループ所属プレイヤー一覧
- プレイヤー追加・編集
- 大会一覧への遷移

### Tournament画面

- 大会一覧
- 大会作成
- 大会参加者選択
- 卓作成
- 集計結果確認

### Table画面

- 卓の参加者表示
- 半荘スコア入力
- 「＋」ボタンで半荘行を追加
- 各セルに数値入力
- 合計が0であればスコア登録
- 登録後は入力不可
- スコア修正時も同じ処理を再利用できるように関数化

---

## デザイン方針

- スマートフォン表示を前提
- 緑系の背景
- シンプル
- 格調高いトーン
- 入力しやすさを重視
- 卓画面は片手操作しやすいUIを優先

---

## 開発環境セットアップ

### 1. 依存関係インストール

```bash
npm install
```

### 2. Expo互換依存関係の確認

```bash
npx expo install --fix
```

### 3. 開発サーバー起動

```bash
npm start
```

または

```bash
npx expo start
```

### 4. Androidで起動

```bash
npm run android
```

### 5. Webで起動

```bash
npm run web
```

---

## Expo Goについて

Expo GoはSDKバージョンとの互換性が重要です。
Expo Go側の対応バージョンが古い、または端末上のExpo Go更新が反映されていない場合、以下のようなエラーが出ることがあります。

```txt
Project is incompatible with this version of Expo Go
```

その場合は以下を確認します。

```bash
npx expo doctor
npx expo install --fix
```

Expo Goで解決しない場合は、開発ビルドの利用も検討します。

---

## NativeWind設定

NativeWindを使用するため、以下のファイルが重要です。

```txt
global.css
tailwind.config.js
babel.config.js
metro.config.js
lib/theme.ts
```

`global.css` には以下を記述します。

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

VS Code等で `Unknown at rule @tailwind` と表示される場合がありますが、Tailwind CSS自体が未インストールという意味とは限りません。
エディタ側のCSS検証や拡張機能の問題で表示される場合があります。

---

## API接続設定

環境ごとにAPIの接続先を切り替えます。

例:

```txt
開発PC: http://localhost:6080
Androidエミュレーター: http://10.0.2.2:6080
実機: http://<PCのLAN内IP>:6080
本番: 未定
```

React Nativeでは、Web版と異なり `localhost` の意味に注意が必要です。
実機で `localhost` を指定するとスマートフォン自身を指します。

---

## 今後の実装予定

- [ ] Welcome画面のReact Native化
- [ ] Group画面のReact Native化
- [ ] Tournament画面のReact Native化
- [ ] Table画面のReact Native化
- [ ] API接続先の環境別切り替え
- [ ] 認証・自動ログイン処理
- [ ] 半荘スコア登録UI
- [ ] スコア修正処理
- [ ] 集計結果表示
- [ ] 実機テスト
- [ ] 開発ビルド対応

---

## 注意事項

- Web版の `div` / `button` / `table` / DOM操作はReact Nativeでは使用できません。
- React Nativeでは `View` / `Text` / `Pressable` / `TextInput` などに置き換えます。
- CSSファイルの扱いはWeb版と異なります。
- Expo SDKとReact / React Native / React DOMのバージョン整合性を重視します。
- API接続時は、エミュレーター・実機・Webで接続先URLが変わります。

---

## 関連プロジェクト

- 既存Web版麻雀大会集計システム
- Flask APIバックエンド
- Docker Composeによるバックエンド実行環境
- WordPress配下で運用していた既存フロントエンド
