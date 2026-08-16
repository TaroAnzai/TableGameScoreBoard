# V2 API 移行内容

## 概要

画面の表示と操作フローを維持したまま、複数の旧API呼び出しをV2の集約・原子操作APIへ置き換えた。Orvalの生成物を更新し、V2レスポンスは生成された型を直接使用している。

## 使用するV2 API

| 対象 | V2 API | 利用箇所・効果 |
| --- | --- | --- |
| 大会作成 | `POST /api/v2/groups/{group_key}/tournaments` | 大会と初期チップ卓を一つの操作で作成する |
| 大会参加者追加 | `POST /api/v2/tournaments/{tournament_key}/participants:batch-add` | 参加者を一括追加し、チップ卓の参加者もサーバー側で同期する |
| 大会参加者削除 | `DELETE /api/v2/tournaments/{tournament_key}/participants/{player_id}` | 大会とチップ卓から参加者を同期して削除する |
| 卓削除 | `DELETE /api/v2/tables/{table_key}` | 卓、参加者、ゲーム、スコア、共有リンクをカスケード削除する |
| ホーム画面 | `POST /api/v2/groups:batch-get` | 保存済みの複数グループキーを一括取得する |
| グループ画面 | `GET /api/v2/groups/{group_key}/dashboard` | グループ、大会一覧、参加者一覧を同一スナップショットから取得する |
| 大会画面 | `GET /api/v2/tournaments/{tournament_key}/dashboard` | 大会、参加者、追加候補、卓、スコアマップを同一スナップショットから取得する |
| 卓画面 | `GET /api/v2/tables/{table_key}/dashboard` | 卓、参加者、追加候補、ゲーム、スコアを同一スナップショットから取得する |
| 作成待ち同期 | `POST /api/v2/groups/request-link/status:batch` | pending tokenを一括確認し、利用可能になったグループキーを保存する |

集約取得を参照する各フックは同じTanStack Queryのquery keyを共有する。このため、同一画面内で複数のフックが使われても、集約レスポンスはキャッシュから選択され、項目ごとの重複リクエストは発生しない。

## 親アクセスキーの受け渡し

子リソースのAPIレスポンスから親の共有キーを推測しない。画面遷移時に、親画面が実際に使用しているキーをroute paramsとして渡す。

- グループから大会へ: `parentGroupKey`
- 大会から卓へ: `parentTournamentKey`と、存在する場合のみ`parentGroupKey`
- 卓内のゲーム操作: 卓画面が保持する`tableKey`と、親から受け取った`parentTournamentKey`

大会または卓の共有リンクを直接開いた場合は親キーが存在しないため、親画面への戻る導線を表示せず、親ダッシュボードのキャッシュも更新対象にしない。これにより、子リソースの編集権限だけを持つ利用者が親リソースへ移動することを防ぐ。

## V1 APIを継続する操作

対応するV2 APIが定義されていない単体操作はV1を継続する。対象はグループの作成・更新、大会の更新・削除、通常卓の作成・更新、卓参加者の追加・削除、ゲームの作成・更新・削除である。これらの変更後は、関連するV2 dashboardのquery keyも無効化して表示を同期する。

## 型と互換性

- 手書きのdashboard型を廃止し、Orvalが生成した`GroupDashboardResponse`、`TournamentDashboardResponse`、`TableDashboardResponse`などを利用する。
- `GroupV2`、`TournamentV2`、`TableV2`、`GameV2`の共有リンク配列から、最も高い権限のキーを選択できるようにした。
- V2の日時項目（`GroupV2.created_at`、`TournamentV2.started_at`、`TableV2.created_at`、`GameV2.played_at`）はISO 8601文字列または`null`として扱う。ホーム画面のグループ作成日と大会編集画面の開始日は、このV2項目を直接表示する。
- V1更新APIのレスポンスを受け取る既存コンポーネントは、必要な範囲でV1/V2双方の型を受け入れる。

## 確認項目

- Orval生成: `npm run generate:api`
- TypeScript: `npx tsc --noEmit`
- ESLint: `npm run lint`
- Jest: `npm test -- --runInBand`
- 差分検査: `git diff --check`
