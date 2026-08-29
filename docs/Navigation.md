# 保存ページとナビゲーション

この文書は、現在実装されている下部ナビゲーション、保存ページ、Deep Link と戻る操作の責務をまとめます。

## 下部ナビゲーション

`app/_layout.tsx` が Web 以外で `BottomNavigation` を一度だけ配置します。項目はホーム、保存済みページ、設定です。各画面で下部ナビゲーションを重複実装しません。

保存済みページは `SavedLinksPopover` に大会と卓を `lastOpenedAt` の降順で表示します。項目から対象ページを直接開け、不要な項目を削除できます。

## 保存データ

`src/types/savedLink.ts` の `SavedLink` を `src/storage/savedLinkStorage.ts` が AsyncStorage の `savedLinks` キーへ保存します。一意性は `type + key` です。

主なデータは次のとおりです。

- `type`: `tournament` または `table`
- `key`、`name`
- 任意の `accessLevel`、`tournamentKey`
- 表示用の任意の `parentGroupName`、`parentTournamentName`
- `savedAt`、`lastOpenedAt`

書き込み操作は同じ queue で直列化し、同時更新によるデータ消失を防ぎます。不正 JSON や不正な項目は読み込み時に修復します。保存日時は再保存でも維持し、最終表示日時は再保存・表示時に更新します。

## 保存案内と離脱

大会・卓ページは `useSavedPage` を使います。外部から直接開いた未保存ページでは、API 取得後に必要な key と name がそろった時点で保存案内を表示します。保存済み、取得中・失敗中、通常の親画面からの遷移では表示しません。

未保存の直接表示ページから離れる操作も捕捉し、次を選べます。

- 保存して離脱
- 保存せず離脱
- キャンセルしてページに残る

同じ画面表示中に案内を閉じた後は繰り返し表示しません。ページタイトルの長押しからも保存できます。

## Deep Link

`app.json` と `app.config.js` が次を定義します。

- production scheme: `mahjongapp`
- development scheme: `mahjongapp-dev`
- Universal Link / App Link: `https://anzai-home.com/mahjong/...`

`app/+native-intent.ts` が外部 URL を Expo Router のルートへ変換します。外部 entry は `app/_layout.tsx` でホームを先頭にした navigation state へ reset されるため、履歴のない画面で戻っても行き止まりになりません。

親の共有 key は API レスポンスから推測せず、通常遷移時だけ route params で渡します。直接リンクでは親 key がないため、利用者へ親リソースのアクセス権を暗黙に広げません。詳細は [V2 API 移行内容](v2-api-migration.md) を参照してください。

## 戻る操作

`useBackFallback` と `src/utils/navigation.ts` が画面上の戻る操作と Android hardware back を共通化します。履歴があれば戻り、なければホームへ fallback します。不必要に `push` して履歴を増やしません。

## テスト

Jest は Storage の直列化・修復、Hooks の表示条件、コンポーネント操作、native intent、戻る fallback を確認します。Maestro は Deep Link、保存・再表示・削除、案内の dismiss、未保存離脱、Android 上の画面遷移を確認します。E2E の実行方法は [Maestro E2E テスト](../.maestro/README.md) を参照してください。
