# Design System v1

このドキュメントは、TableGameScoreBoard の React Native / Expo アプリ全体で利用する新しいデザイン基準です。
Material Design 3 と Apple Human Interface Guidelines の考え方を参考にしつつ、Android と iOS の両方で自然に見える UI を目指します。

> 対象環境: Expo SDK 56 / React Native 0.85 / React 19.2.3 / NativeWind 4
>
> 方針: ライトモードを優先し、ダークモードへ拡張できる token 構造を採用します。

---

> 実装トークンの具体的なコード定義は [`token-implementation.md`](./token-implementation.md) を参照してください。
>
> 既存UI・既存テーマからの移行方針は [`legacy-theme-migration.md`](./legacy-theme-migration.md) を参照してください。

---

## 1. デザイン方針

### アプリ全体の印象

- 麻雀卓を連想させるグリーンをブランド要素として残す。
- 画面全体を濃いグリーンで覆うのではなく、白〜淡い緑を中心にした明るい UI にする。
- 大会運営・スコア管理ツールとして、可読性、操作の明確さ、信頼感を優先する。
- 点数、順位、卓、参加者などの数値情報を素早く読めることを重視する。
- 装飾よりも、余白・階層・状態表現によって整理された印象を作る。

### Material Design 3 から採用する考え方

- `primary`, `surface`, `outline`, `error` などの用途ベースの color roles を使う。
- 背景、カード、リスト、入力欄を surface の階層で整理する。
- pressed、focused、disabled、selected を state layer と container 色で表現する。
- Button、Card、Input、Dialog で角丸の意味を分ける。
- Android で自然な最小タップ領域として 48dp を基準にする。

### iOS HIG から採用する考え方

- 明快さ、余白、読みやすさを優先する。
- 画面左右は 20pt を標準にし、情報を詰め込みすぎない。
- 一覧から詳細、詳細から入力・編集へ進む浅い階層を保つ。
- 削除などの破壊的操作は赤、確認、具体的な文言で慎重に扱う。
- Dynamic Type を考慮し、固定高さより minHeight と折り返しを優先する。

### Android と iOS で共通にする部分

- カラートークン。
- spacing token。
- typography token。
- 基本コンポーネント名。
- 48px 以上のタップ領域。
- Primary / Secondary / Tertiary / Destructive の意味。
- Dialog の Header / Content / Footer 構造。
- 点数、順位、合計点の表示ルール。
- NativeWind の className ベース実装方針。

### OS ごとに分ける部分

| 項目                 | Android                                  | iOS                                  |
| -------------------- | ---------------------------------------- | ------------------------------------ |
| タップフィードバック | Ripple 相当、または濃度変化をやや強め    | opacity / scale を控えめ             |
| Dialog               | 中央 Dialog を基本、バックボタンで閉じる | Sheet / Modal に近い動きも許容       |
| Header               | Material 風の明確な Top App Bar          | iOS 風にタイトルと Back を軽く見せる |
| 影                   | elevation を少し使う                     | border / 背景差分中心、影は控えめ    |
| Icon                 | Material Symbols 相当の意味に寄せる      | SF Symbols 相当の意味に寄せる        |

---

---

## 2. カラー

ライトモード優先のカラーパレットです。麻雀グリーンを primary として残し、画面背景は読みやすい明色にします。

| Token                | Color     | 用途                                         |
| -------------------- | --------- | -------------------------------------------- |
| `primary`            | `#0B6B3A` | 最重要 CTA、選択中の主要状態、リンク強調     |
| `onPrimary`          | `#FFFFFF` | `primary` 上の文字・アイコン                 |
| `primaryContainer`   | `#D8F4E3` | 選択中カード、軽い成功状態、primary の淡背景 |
| `onPrimaryContainer` | `#073B22` | `primaryContainer` 上の文字                  |
| `background`         | `#F7FAF7` | アプリ全体背景                               |
| `surface`            | `#FFFFFF` | Card、Dialog、List row、Input 背景           |
| `surfaceVariant`     | `#EAF1EC` | テーブルヘッダー、淡い区切り、非選択 chip    |
| `onSurface`          | `#17211B` | 通常本文、タイトル、点数                     |
| `onSurfaceVariant`   | `#5D6B62` | 補助文、placeholder、caption、サブ情報       |
| `outline`            | `#B8C7BD` | Card / Input / Table の境界線                |
| `error`              | `#BA1A1A` | 削除、重大エラー、破壊的操作                 |
| `onError`            | `#FFFFFF` | `error`上の文字・アイコン                    |
| `success`            | `#16834A` | 成功 toast、登録済み、正常合計               |
| `warning`            | `#B26A00` | 未確定、注意、合計不一致                     |
| `disabled`           | `#C9D1CB` | disabled 背景、無効 outline                  |
| `onDisabled`         | `#7A847D` | disabled 文字                                |
| `scorePositive`      | `#0B6B3A` | プラス点、上昇、勝ち                         |
| `scoreNegative`      | `#C2410C` | マイナス点、減少                             |
| `rank1`              | `#B7791F` | 1位、優勝                                    |
| `rank2`              | `#718096` | 2位                                          |
| `rank3`              | `#A16207` | 3位                                          |
| `chip`               | `#2563EB` | チップ卓・チップ点                           |

### 使用ルール

- `primary` は「新しいグループを作成」「卓を作成」「点数を確定」など、画面の主操作に使う。
- `primary` の強い CTA は 1 画面に原則 1 個までにする。
- `primaryContainer` は選択中、保存済み、軽い成功状態に使う。
- `background` は SafeArea を含む画面全体に使う。
- `surface` は Card、List item、Dialog、Input に使う。
- `surfaceVariant` はテーブルヘッダー、固定列、セクション背景に使う。
- `outline` は 1px border、Input 境界、区切り線に使う。
- `error` は削除、重大エラー、破壊的操作に限定する。
- `warning` は通常卓で合計が 0 でない状態、未確定、注意喚起に使う。
- プラス・マイナス・順位は色だけに依存せず、`+` / `-`、順位テキスト、アイコンも併用する。

### ダークモード対応方針

この v1 ではライトモードを優先します。ただし、token 名はダークモードへ拡張できる形にします。

| Token                | Dark Color |
| -------------------- | ---------- |
| `primary`            | `#8DD8AA`  |
| `onPrimary`          | `#003919`  |
| `primaryContainer`   | `#0F5130`  |
| `onPrimaryContainer` | `#D8F4E3`  |
| `background`         | `#101511`  |
| `surface`            | `#18201A`  |
| `surfaceVariant`     | `#26342B`  |
| `onSurface`          | `#EDF4EE`  |
| `onSurfaceVariant`   | `#BFCBC2`  |
| `outline`            | `#4C5B51`  |
| `error`              | `#BA1A1A`  |
| `onError`            | `#FFFFFF`  |

---

---

## 3. 余白

### spacing token

| Token      | Value | 用途                                       |
| ---------- | ----: | ------------------------------------------ |
| `space.0`  |   `0` | リセット                                   |
| `space.1`  |   `4` | 小さなアイコンと文字の間、caption の微調整 |
| `space.2`  |   `8` | 密な row 内 gap、chip 内 padding           |
| `space.3`  |  `12` | List item 内 gap、Input 周辺               |
| `space.4`  |  `16` | 標準 padding、カード内最小余白             |
| `space.5`  |  `20` | 画面左右 padding、フォーム余白             |
| `space.6`  |  `24` | セクション内カード間、Dialog padding       |
| `space.8`  |  `32` | 大きなセクション間隔                       |
| `space.10` |  `40` | Empty state 上下余白                       |
| `space.12` |  `48` | 画面下部 CTA 前後、主要ブロック間          |

### 画面左右の余白

- Phone: `20`
- 小さい端末: 最低 `16`
- Tablet / large screen: 中央寄せ `maxWidth: 720`、左右 `24〜32`
- 点数表などの横スクロール領域: 外側 `16〜20`、表内部は別管理

### セクション間隔

- 標準: `24`
- 画面タイトル下: `20`
- Primary Action と次セクション: `24`
- 一覧セクション間: `32`
- Empty / Loading / Error block の上下: `32〜40`

### カード内部余白

- 通常 Card: `16`
- 情報量が多い Card: `20`
- Dialog 内 Card: `16`
- スコアサマリー Card: 縦 `16`、横 `20`
- 重要カードのみ `24` を許可する。

### フォーム項目間隔

- Label → Input: `8`
- Input → helper/error: `4`
- Form field 間: `16`
- Form group 間: `24`
- Dialog 内フォーム: field 間 `16`、Footer 前 `24`

### ボタン間隔

- 横並び Button gap: `12`
- Dialog Footer: `8〜12`
- Primary CTA と Secondary: `12`
- IconButton 群: `8`
- 画面下固定 CTA 上部: `16`

---

---

## 4. タイポグラフィ

日本語表示を前提に、lineHeight は英語 UI より少し広めにします。追加フォントは v1 初期では必須にせず、React Native の標準フォントを優先します。

| Token          | Size | Weight | LineHeight | 用途                             |
| -------------- | ---: | -----: | ---------: | -------------------------------- |
| `screenTitle`  | `24` |  `700` |       `32` | 画面タイトル、大会名、グループ名 |
| `sectionTitle` | `20` |  `700` |       `28` | セクション見出し                 |
| `cardTitle`    | `17` |  `600` |       `24` | Card タイトル、List の主要行     |
| `body`         | `16` |  `400` |       `24` | 通常本文                         |
| `bodyStrong`   | `16` |  `600` |       `24` | 一覧の主ラベル                   |
| `bodySmall`    | `14` |  `400` |       `20` | 補助情報、説明文                 |
| `label`        | `14` |  `600` |       `20` | Input label、Button label        |
| `caption`      | `12` |  `400` |       `16` | 日付、権限、注釈                 |
| `score`        | `22` |  `700` |       `28` | 点数、合計点                     |
| `scoreSmall`   | `16` |  `700` |       `22` | 表内点数                         |
| `rank`         | `18` |  `700` |       `24` | 順位                             |
| `tableHeader`  | `13` |  `700` |       `18` | テーブルヘッダー                 |

### 日本語表示ルール

- `lineHeight` は `fontSize × 1.4〜1.5` を基本にする。
- 画面タイトルは 1 行に収まらない場合、2 行まで許容する。
- Button label は原則 1 行にする。長い場合は文言を短くする。
- テーブルセルは名前・点数ともに省略可能。ただし詳細確認手段を用意する。
- 日付や権限などの補助情報は `caption` に落とす。
- 数字は桁区切りを使う。例: `32,000`, `-12.5`。

---

---

## 5. 角丸と境界線

### radius token

| Token         | Value | 用途                      |
| ------------- | ----: | ------------------------- |
| `radius.none` |   `0` | テーブル内部セル          |
| `radius.xs`   |   `4` | Badge、Table tag          |
| `radius.sm`   |   `8` | 小 Button、Input 内部要素 |
| `radius.md`   |  `12` | 標準 Button、Input        |
| `radius.lg`   |  `16` | Card、List container      |
| `radius.xl`   |  `20` | Dialog、Bottom sheet      |
| `radius.full` | `999` | Pill、丸 IconButton       |

### コンポーネント別 radius

| Component   |            Radius |
| ----------- | ----------------: |
| Button      |              `12` |
| IconButton  | `999` または `12` |
| Card        |              `16` |
| Input       |              `12` |
| Dialog      |              `20` |
| Badge       |             `999` |
| Table outer |              `12` |
| Table cell  |               `0` |

### border 幅

- 標準 outline: `1`
- 強調 outline: `2`
- Table grid: `1`
- Focus ring: `2`
- Mahjong table 特別枠: 使う場合のみ `2`

### outline 使用ルール

- 入力欄、カード、リスト行、テーブルセルに使用する。
- 色は `outline` を使う。
- focus 時は `primary` の `2px` ring または border を使う。
- エラー時は `error` border を使う。
- disabled 時は `disabled` border を使う。

### 影を使用する条件

- Android: 主要 Card / Dialog / Floating footer に軽い elevation を許可する。
- iOS: 影は控えめにし、基本は border と background 差分で階層を作る。
- 一覧内のすべての row に影をつけない。
- スコア表セルには影を使わない。

---

---

## 6. ボタン

### Primary

- 用途: 画面の主操作。
- 背景: `primary`
- 文字: `onPrimary`
- 高さ: `48`
- 横 padding: `20`
- 角丸: `12`
- label: `label`、14〜16、weight 600
- 例: 作成、保存、確定、追加。

### Secondary

- 用途: Primary に次ぐ操作。
- 背景: `primaryContainer`
- 文字: `onPrimaryContainer`
- border: なし、または `outline` 1px
- 高さ: `44〜48`
- 横 padding: `18`
- 例: 共有、編集、参加者を選択。

### Tertiary

- 用途: 補助操作。
- 背景: transparent
- 文字: `primary`
- pressed: `primaryContainer` 30〜40%
- 高さ: `44`
- 例: キャンセル、詳細を見る、戻る補助。

### Destructive

- 用途: 削除、取り消せない操作。
- 背景: `error`
- 文字: `#FFFFFF`
- 高さ: `48`
- 確認 Dialog でのみ主ボタンにする。
- 通常画面に強い赤ボタンを大量配置しない。

### IconButton

- 用途: 戻る、閉じる、共有、編集。
- 見た目サイズ: `40 × 40`
- 最小タップ領域: `48 × 48`
- icon: `24`
- 背景: transparent または `surfaceVariant`
- `accessibilityLabel` 必須。

### 状態

| State      | 表現                                                              |
| ---------- | ----------------------------------------------------------------- |
| `disabled` | opacity 0.38、背景 `disabled`、文字 `onDisabled`                  |
| `loading`  | label 非表示または維持 + spinner、二重送信禁止                    |
| `pressed`  | Android は state layer 12%、iOS は opacity 0.72 または scale 0.98 |
| `focused`  | `primary` ring 2px、または border 強調                            |

### 確定とキャンセルの配置ルール

- 通常 Dialog: Cancel は Secondary / Tertiary、Confirm は Primary。
- Destructive Dialog: Cancel は Secondary、Delete は Destructive。
- Dialog Footer では、誤操作を避けるためボタン間隔を `12` 以上にする。
- 点数入力では、Primary は「確定」、Tertiary は「キャンセル」にする。
- 合計不一致時は warning helper を出し、確定を disabled にする。

---

---

## 7. カードとリスト

### カードを使用する条件

Card はまとまった情報単位に使用します。

- 大会概要。
- 卓の概要。
- 参加者サマリー。
- Empty / Loading / Error state。
- 点数入力の現在行詳細。
- 共有リンク情報。

Card を使わないもの:

- 単純な一覧 row。
- 密度の高い表。
- 1行だけのナビゲーション項目が大量に並ぶ場合。

### リストを使用する条件

List は同種の項目が複数並ぶ場合に使用します。

- グループ一覧。
- 大会一覧。
- 卓一覧。
- 参加者一覧。
- Pending groups。

### Card / List 数値

| 項目                        |                              値 |
| --------------------------- | ------------------------------: |
| Card padding                |                        `16〜20` |
| Card gap                    |                        `12〜16` |
| List row height             |                        min `56` |
| List row padding horizontal |                            `16` |
| List row padding vertical   |                            `12` |
| List row gap                |                         `8〜12` |
| Border                      |                   `1px outline` |
| Card elevation              | Android `1〜2`、iOS shadow 低め |
| List elevation              |                        原則なし |

### タップ可能な項目の表現

- 右端に chevron / arrow icon を置く。
- pressed 時に `surfaceVariant` に変化させる。
- 選択可能な row は checkbox / check icon / selected background を使う。
- 色だけで選択状態を表さない。

### 選択状態の表現

- 背景: `primaryContainer`
- 文字: `onPrimaryContainer`
- icon: check icon
- border: `primary` 1px
- 複数選択では選択数を Header / Footer に表示する。

---

---

## 8. 入力フォーム

### TextInput

| 項目               |                 値 |
| ------------------ | -----------------: |
| Height             |           min `48` |
| Padding horizontal |           `14〜16` |
| Padding vertical   |           `10〜12` |
| Radius             |               `12` |
| Border             |      `1px outline` |
| Background         |          `surface` |
| Text               |        `onSurface` |
| Placeholder        | `onSurfaceVariant` |
| Focus border       |      `primary 2px` |
| Error border       |     `error 1〜2px` |

### 数値入力

- 整数のみの場合は `number-pad` を使う。
- マイナス・小数ありの場合は platform ごとに適切な keyboard type を調整する。
- 点数は右寄せまたは中央寄せにする。
- 入力中は未確定状態を明示する。
- 通常卓では行合計が `0` でない場合、`warning` text を表示し、確定を disabled にする。
- チップ卓では合計 0 制約がないなら、その理由を helper text で表示する。

### Label

- size: `14`
- weight: `600`
- color: `onSurface`
- 必須項目は「必須」badge または helper text で示す。
- 日本語では短い名詞にする。例: `グループ名`, `メールアドレス`。

### placeholder

- color: `onSurfaceVariant`
- 入力例を示す。例: `例：水曜リーグ`
- label の代わりにしない。

### helper text

- size: `12`
- color: `onSurfaceVariant`
- Input 下 `4px`
- 例: `招待メールの送信先です。`

### error text

- size: `12`
- color: `error`
- icon 併用可。
- 例: `メールアドレスの形式を確認してください。`

### focus 状態

- border: `primary 2px`
- background: `surface`
- helper を出す場合は `onSurfaceVariant`

### disabled 状態

- background: `surfaceVariant`
- border: `disabled`
- text: `onDisabled`
- 編集不可理由がある場合は helper text を表示する。

### キーボード表示時の基本方針

- Dialog / Modal 内フォームはキーボードで入力欄と Footer が隠れないようにする。
- 長いフォームは Content をスクロール可能にする。
- `keyboardShouldPersistTaps="handled"` を基本にする。

---

---

## 9. Dialog と Modal

### Dialog と画面遷移の使い分け

| 用途                           | 推奨                                     |
| ------------------------------ | ---------------------------------------- |
| 1〜2項目の入力                 | Dialog                                   |
| 削除確認                       | AlertDialog                              |
| 参加者複数選択                 | Modal / Bottom Sheet / Full screen       |
| 点数の詳細入力                 | 画面内 inline editor または Bottom Sheet |
| 大会編集のような複数フィールド | Full screen modal                        |
| 共有リンク表示                 | Dialog / Sheet                           |

### Header / Content / Footer の構造

- Header
  - title: `sectionTitle` または `cardTitle`
  - description: `bodySmall`
- Content
  - gap: `16`
  - 必要なら ScrollView
- Footer
  - gap: `12`
  - Primary / Secondary / Destructive を明確化
  - 長いボタン文言でも折り返し可能にする。

### 内部スクロール

- Dialog Content 最大高さ: 画面高さの `80%`
- キーボード表示時: 最大高さを `60〜65%` に調整する。
- Footer は固定し、Content のみスクロールさせる。
- フォームが 3 項目以上なら Full screen modal も検討する。

### ボタン配置

- 通常 Dialog: Cancel は Secondary / Tertiary、Confirm は Primary。
- Destructive Dialog: Cancel は Secondary、Delete は Destructive。
- iOS では destructive を右/下に置く場合も、色と文言で誤操作を防ぐ。
- Android では Back button で Cancel と同じ挙動にする。

### 閉じるボタン

- 右上の IconButton として置く。
- hitSlop を含めて `48 × 48` を確保する。
- `accessibilityLabel="閉じる"` を必須にする。
- 入力中に閉じる場合は未保存確認を検討する。

### キーボード表示時の挙動

- 入力欄が隠れないようにする。
- Footer が隠れないようにする。
- タップ外閉じは、入力中には慎重に扱う。

### Android バックボタンへの対応

- 通常 Dialog: 閉じる。
- 入力済みフォーム: 変更破棄確認を出す。
- 破壊的確認 Dialog: キャンセル扱い。
- 保存処理中: 閉じない、または loading を表示する。

---

---

## 10. アイコン

### 使用するアイコンライブラリの方針

- 現状導入済みの `lucide-react-native` を継続する。
- 必要になった場合のみ OS 別アイコン差し替えを検討する。

### 標準サイズ

| 用途               |     Size |
| ------------------ | -------: |
| Inline icon        |     `16` |
| Button icon        |     `20` |
| IconButton icon    |     `24` |
| Empty state icon   | `40〜48` |
| Rank / status icon | `16〜20` |

### 線の太さ

- lucide の `strokeWidth` は `2` を標準にする。
- 小さいアイコン `16` では `2.25` も許容する。
- 強調しすぎない。

### アイコンのみのボタンのルール

- 必ず `accessibilityLabel` を設定する。
- 視覚的にも用途が分かる位置に置く。
- Delete / remove は赤 icon だけに頼らず label または確認 Dialog を併用する。
- タップ領域は icon より大きく `48 × 48` にする。

### accessibilityLabel 例

- `戻る`
- `閉じる`
- `グループを共有`
- `大会名を編集`
- `参加者を削除`
- `点数を編集`

### Android と iOS で分ける可能性があるアイコン

- Back
  - Android: arrow-left
  - iOS: chevron-left
- Share
  - Android: share-2
  - iOS: square-and-arrow-up 相当。ただし lucide では share icon で代替可。
- More
  - Android: vertical ellipsis
  - iOS: horizontal ellipsis
- Delete
  - 共通で trash-2 を使ってよい。

---

---

## 11. 情報量と画面構成

### 一画面に表示する情報量

- 1画面の Primary Action は原則 1個にする。
- Secondary Action は 2〜4個までにする。
- 管理系操作が多い画面では操作メニューへ逃がす。
- 大会ページ・卓ページは情報が多くなりやすいため、Header、Summary、Primary Action、Main content、Secondary actions の順に整理する。

### セクション構成

推奨テンプレート:

1. Header
   - 戻る
   - タイトル
   - 共有 / 編集など icon actions
2. Summary Card
   - 状態、人数、卓数、合計など
3. Primary Action
4. Main List / Table
5. Secondary Actions
6. Danger Zone

### Primary Action の数

- 画面上部または下部固定に 1個。
- 例:
  - グループ一覧: `新しいグループを作成`
  - グループ詳細: `大会を作成`
  - 大会詳細: `卓を作成`
  - 卓詳細: `点数を入力`
- 複数の作成操作がある場合、Primary は一番頻度が高いものに絞る。

### 補助情報の扱い

- 権限、作成日、期限、リンク種別は `caption` にする。
- ステータスは badge で表示する。
- 補助情報は `onSurfaceVariant` を使う。
- 重要警告は `warning` と icon を併用する。

### Empty / Loading / Error 状態

#### Empty

- icon: `40〜48`
- title: `cardTitle`
- body: `bodySmall`
- action button: 1つ
- 例: `まだ大会がありません` / `最初の大会を作成しましょう`

#### Loading

- `ActivityIndicator` を使う。
- 長いロードでは説明文を出す。
- 必要に応じて skeleton を使う。

#### Error

- error icon を表示する。
- 短い説明を表示する。
- retry button を表示する。
- 詳細エラーは開発時のみ表示する。

### 破壊的操作の確認方法

- 削除は必ず確認する。
- 対象名を Dialog に含める。
- Destructive button 文言は具体的にする。例: `大会を削除`, `参加者を削除`。
- 削除後に戻る画面を明確にする。
- チップ卓など依存データがある削除は、影響範囲を説明する。

---

---

## 12. 操作性とアクセシビリティ

### 最小タップ領域

- 最小: `48 × 48`
- IconButton 見た目: `40 × 40` でも hitSlop で `48 × 48` を確保する。
- テーブルセル: タップ編集対象なら高さ `44` 以上、可能なら `48` にする。

### 押下フィードバック

- Pressable には必ず pressed state を持たせる。
- Button は背景濃度変化で表現する。
- ListItem は `surfaceVariant` に変化させる。
- Table row は選択行を `primaryContainer` または `surfaceVariant` で表示する。
- iOS は opacity / scale を控えめにする。
- Android は ripple 相当の視覚フィードバックを使う。

### accessibilityRole

| 要素          | role          |
| ------------- | ------------- |
| Button        | `button`      |
| Link-like row | `button`      |
| Checkbox item | `checkbox`    |
| Dialog title  | heading 相当  |
| Loading       | `progressbar` |

### accessibilityLabel

- IconButton は必須。
- スコアセルは `東 1 回戦、山田、32000 点` のように読み上げ可能にする。
- 削除ボタンは対象名を含める。例: `山田を削除`。
- `OK` だけでなく `グループを作成` のように文脈を含める。

### 色だけに依存しない表現

- プラス: `+12.5` と上向き icon / `プラス` ラベル。
- マイナス: `-8.0` と下向き icon / `マイナス` ラベル。
- エラー: 赤 border + error text + icon。
- 選択: 背景 + check icon + border。

### フォント拡大時の方針

- Button は minHeight と縦 padding で伸びるようにする。
- Card / List row は固定 height ではなく minHeight にする。
- テーブルは横スクロールを許容する。
- タイトルは 2行まで許容する。
- 重要な数値は省略しない。

### スクロールと固定フッター

- 長い一覧は通常スクロールにする。
- 主要 CTA は必要に応じて下部固定にする。
- 下部固定 Footer は SafeArea bottom + `16` を確保する。
- キーボード表示時は Footer を上げるか Content 内に移動する。

### SafeArea 対応

- root の SafeArea 対応を継続する。
- 画面ごとの固定 Footer や Dialog でも top / bottom inset を考慮する。

---

---

## 13. 麻雀アプリ固有のルール

### 点数表示

- 通常点: `32,000`
- ウマ・オカ・集計点: `+12.5` / `-8.0`
- 表内点数: `scoreSmall`
- 合計点: `score`
- 数字は等幅に近い見え方を優先する。
- 0 は `0`、未入力は `—` と表示する。
- 入力中は未保存 indicator を表示する。

### 合計点

- 通常卓:
  - 行合計は原則 `0`。
  - `0` なら `success`。
  - `0` でないなら `warning`、確定 disabled。
- チップ卓:
  - 合計 0 制約がないなら、`チップ合計` と明示する。
- 合計行は太字、背景 `surfaceVariant` にする。
- 合計値のセルは固定列 / 固定行に近い扱いを検討する。

### 順位

| Rank    | 表現                 |
| ------- | -------------------- |
| 1位     | `rank1`、bold、badge |
| 2位     | `rank2`、badge       |
| 3位     | `rank3`、badge       |
| 4位以下 | neutral              |
| 同点    | `同点` label を併記  |

- 順位は色だけでなく `1位`, `2位` のテキスト表示にする。
- 優勝者は trophy icon 併用可。

### プラス・マイナス値

- プラス: `+12.5`、`scorePositive`
- マイナス: `-8.0`、`scoreNegative`
- 0: `onSurfaceVariant`
- 色だけに頼らず `+` / `-` を必ず表示する。
- 大きな変動は bold にする。

### 卓と参加者の表示

- 卓 Card:
  - 卓名
  - 卓種別: 通常 / チップ
  - 参加者数
  - 最新更新
  - 点数入力状態
- 参加者 chip:
  - 名前
  - 権限または状態
  - 選択時 check icon

### 点数入力画面

- 横スクロール表は継続する。
- 左端列は回戦名の固定列として扱う設計を目指す。
- ヘッダー行は `surfaceVariant`、文字は `onSurface` にする。
- 入力中 row は `primaryContainer` にする。
- 未入力セルは `—` にする。
- 編集セルは背景 `surface`、border `primary`、text `onSurface` にする。
- 行下に合計・Confirm / Cancel を出す場合、合計表示を左または右に固定する。
- Confirm disabled 理由を helper text で表示する。
- セル幅は、最小 `80`、名前列 `96〜120` を推奨する。

### 大会一覧

- ListItem または CardList として表示する。
- 表示項目:
  - 大会名
  - 参加者数
  - 卓数
  - 最終更新
  - 権限 badge
- Primary Action: `大会を作成`
- Empty: `まだ大会がありません`

### グループ一覧

- 登録済みグループ:
  - グループ名
  - 権限 badge
  - 最終アクセス / pending 状態
- Pending groups:
  - `warning` badge
  - 期限を caption で表示

### グループ詳細

- 参加者一覧を中心にする。
- 管理操作はまとまりごとに配置する。
  - 参加者
  - 大会
  - 共有
  - Danger Zone
- 削除・除外は通常リストから一段奥にする。

### 表形式の情報

- Header background: `surfaceVariant`
- Header text: `tableHeader`
- Cell text: `bodySmall` または `scoreSmall`
- Border: `outline 1px`
- Row height: min `44`
- Numeric align: 右寄せまたは中央寄せ
- 名前列: 左寄せ
- 合計行: bold、`surfaceVariant`
- 選択行: `primaryContainer`

### 横スクロールと固定列

- 5列以上の表は横スクロールにする。
- 左端の「回戦」列は固定列候補にする。
- 合計行は下部固定候補にする。
- 横スクロールがある場合は右端に fade / shadow を出してスクロール可能性を示す。
- セル幅:
  - 回戦列: `72〜88`
  - 参加者列: `88〜112`
  - 点数列: `80〜96`
  - 合計列: `96〜112`

---

---

## A. Design System v1 一覧

### Core tokens

- Color tokens
- Spacing tokens
- Radius tokens
- Typography tokens
- Component size tokens
- Mahjong-specific tokens

### Core components

- Text
- Button
- IconButton
- Card
- ListItem
- Input
- Dialog
- Modal / Sheet
- Badge
- Empty state
- Loading state
- Error state
- ScoreText
- RankBadge
- ScoreTable

### Core layout

- Screen / PageContainer
- Header / PageTitleBar
- Section
- Fixed Footer
- SafeArea-aware wrapper

---
