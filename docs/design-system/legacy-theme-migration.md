# Legacy Theme Migration

このドキュメントは、現在のUI・`global.css`・既存HSL変数から、[`design-system-v1.md`](./design-system-v1.md)のsemantic color rolesとデザイントークンへ段階的に移行するための方針をまとめたものです。

> この文書の現時点の内容は、元のDesign System v1に記載されていた移行方針を整理したものです。
>
> 現在の`global.css`、HSL変数名、使用箇所は元資料に含まれていないため、具体的な対応表はコード調査後に追記します。

## B. 現在の UI から引き継ぐ要素

- 麻雀卓を連想させるグリーンのブランド性。
- NativeWind className ベースの実装方針。
- Button、Card、Dialog、Input などの共通 UI コンポーネントの方向性。
- Header → Action → List の画面構成。
- Dialog の Header / Content / Footer 構造。
- 点数表の横スクロール。
- 通常卓の行合計 0 制約。
- SafeAreaView と PortalHost の root 配置。

---

---

## C. 新しく変更する要素

- 画面全体の濃緑背景から、ライトモード中心の `background #F7FAF7` + `surface #FFFFFF` へ変更する。
- 色を Material Design 3 的な color roles に再定義する。
- Button 高さを標準 `48` に統一する。
- ListItem を Button の outline 表現から独立させる。
- 点数表のセル幅・色・入力状態を再設計する。
- Dialog のキーボード表示、Footer 固定、内部スクロール、Android バックボタンのルールを明確化する。
- Typography token を導入する。
- 麻雀固有 token を追加する。
- アクセシビリティルールをコンポーネント仕様に含める。

---

---

## 1. 移行の基本方針

- 既存のHSL変数を最初から削除・一括置換しない。
- `src/lib/theme/`に新しいtoken structureを作成してから、共通コンポーネント、共通レイアウト、各画面の順に移行する。
- primitiveな色名ではなく、`primary`、`surface`、`onSurface`、`outline`、`error`などの用途ベースのroleへ置き換える。
- 既存UIの見た目と挙動を一度に変更せず、Phaseごとに差分を確認する。
- 移行完了前は、旧変数と新トークンが一時的に共存することを許容する。

## 2. 調査して作成する対応表

コード調査後、以下の形式で追記します。

| 現在の変数・class | 現在の用途 | 新しいtoken / role | 移行対象 | 備考                               |
| ----------------- | ---------- | ------------------ | -------- | ---------------------------------- |
| 未調査            | 未調査     | 未確定             | 未確定   | `global.css`と使用箇所の確認が必要 |

調査対象:

- `global.css`に定義されているHSL変数。
- Tailwind / NativeWind設定内のcolor定義。
- `bg-green-*`、`text-slate-*`、`border-gray-*`などprimitive color classの使用箇所。
- JSX / TSXの`style`内に直接記述されたHEX、RGB、HSL値。
- Button、Card、Input、Dialog、Tableなど共通コンポーネント固有の色・余白・角丸。

## 3. 段階的な移行手順

### Phase 1: トークン基盤

1. `colors`, `spacing`, `radius`, `typography`を定義する。
2. `src/lib/theme/`をSingle Source of Truthとして確定する。
3. light / darkのtoken structureを用意する。
4. 既存HSL変数とDesign System v1のcolor rolesの対応表を作る。
5. この段階では既存画面のclassNameを一括変更しない。

### Phase 2: 基本コンポーネント

Button、Text、Card、Input、Dialogから新しいtokenへ移行する。共通コンポーネントの移行後に、各画面への波及を確認する。

### Phase 3: 画面共通レイアウト

SafeArea、background、画面左右padding、Header、Section、固定Footer、Empty / Loading / Error stateを移行する。

### Phase 4: 一覧UI

Group、Tournament、Table、ParticipantのListItemとBadgeを移行する。

### Phase 5: 麻雀スコアUI

ScoreText、RankBadge、ScoreTable、横スクロール、固定列、入力状態、warning状態を移行する。

### Phase 6: OS別調整

Androidのpressed feedback / elevationと、iOSのopacity / modal表現などを調整する。

### Phase 7: アクセシビリティ確認

accessibilityLabel、role、読み上げ、文字拡大、色以外による状態表現を確認する。

## 4. 旧変数を削除できる条件

次の条件をすべて満たした変数から削除します。

- 使用箇所が新しいsemantic tokenへ移行済み。
- リポジトリ全体を検索して参照が残っていない。
- light modeで主要画面の表示確認が完了している。
- pressed、focused、disabled、selected、errorなどの状態確認が完了している。
- AndroidとiOSの両方で回帰確認が完了している。

## 5. 移行時に変更しないもの

- 麻雀卓を連想させるグリーンのブランド性。
- NativeWindの`className`ベース実装方針。
- DialogのHeader / Content / Footer構造。
- 点数表の横スクロール。
- 通常卓の行合計0制約。
- SafeAreaViewとPortalHostのroot配置。

## 6. コード調査結果（Phase 1）

調査日: 2026-08-05

現在のテーマ値は `src/global.css` にあり、`tailwind.config.js` が
`hsl(var(--...))` としてNativeWind utilityへ接続しています。`.dark:root` は
現時点ですべてlightと同値です。以下の「使用箇所」はCSS変数を直接読む箇所ではなく、
対応するTailwind / NativeWind utilityを使うファイルです。

| 現在の変数                 | 現在値（light / dark） | 主な使用箇所・現在の用途                      | v1 role候補                                | 判定                                                              |
| -------------------------- | ---------------------- | --------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------- |
| `--background`             | `140 64% 24%` / 同値   | Dialog、AlertDialog、Input、旧TextInputの背景 | `background` または `surface`              | 用途混在。画面は`background`、Dialog/Inputは`surface`へ分割が必要 |
| `--foreground`             | `0 0% 98%` / 同値      | Text、Label、Icon、Dialog、menuの標準文字     | `onSurface`                                | 多くは単純移行可。背景との組合せは個別確認                        |
| `--card`                   | `140 55% 28%` / 同値   | Card背景                                      | `surface`                                  | 単純移行可                                                        |
| `--card-foreground`        | `0 0% 98%` / 同値      | Card文字context                               | `onSurface`                                | 単純移行可                                                        |
| `--popover`                | `140 55% 26%` / 同値   | Popover、Dropdown背景                         | `surface`                                  | 単純移行可                                                        |
| `--popover-foreground`     | `0 0% 98%` / 同値      | Popover、Dropdown文字                         | `onSurface`                                | 単純移行可                                                        |
| `--primary`                | `142 72% 35%` / 同値   | Button、Badge、Input選択色                    | `primary`                                  | 原則単純移行可。選択状態は`primaryContainer`も検討                |
| `--primary-foreground`     | `0 0% 98%` / 同値      | Primary Button/Badge上の文字                  | `onPrimary`                                | 単純移行可                                                        |
| `--secondary`              | `140 38% 34%` / 同値   | Secondary Button/Badge背景                    | `primaryContainer`                         | 単純移行候補。各variantの意味を確認                               |
| `--secondary-foreground`   | `0 0% 98%` / 同値      | Secondary上の文字                             | `onPrimaryContainer`                       | 単純移行候補。背景との組合せ確認                                  |
| `--muted`                  | `140 32% 36%` / 同値   | code風Text背景                                | `surfaceVariant`                           | 単純移行候補                                                      |
| `--muted-foreground`       | `120 20% 86%` / 同値   | 補助文、placeholder、caption                  | `onSurfaceVariant`                         | 単純移行可                                                        |
| `--accent`                 | `142 45% 38%` / 同値   | pressed/hover/menu選択背景                    | `surfaceVariant` または `primaryContainer` | 用途混在。選択の意味ごとに分割が必要                              |
| `--accent-foreground`      | `0 0% 98%` / 同値      | accent上の文字・icon                          | `onSurface` または `onPrimaryContainer`    | 用途混在。背景roleと対で移行                                      |
| `--destructive`            | `0 84.2% 60.2%` / 同値 | destructive Button/Badge、invalid状態         | `error`                                    | 単純移行可                                                        |
| `--destructive-foreground` | 未定義 / 未定義        | Tailwind設定のみ参照、実利用classなし         | `onError`                                  | 旧変数が欠落。新規利用は`onError`へ直接移行                       |
| `--border`                 | `140 35% 42%` / 同値   | Card、Dialog、Button、Badge、menu等の境界     | `outline`                                  | 単純移行可                                                        |
| `--input`                  | `140 35% 38%` / 同値   | Input境界とdark背景、旧TextInput境界          | `outline` / `surfaceVariant`               | 用途混在。borderとbackgroundを分割                                |
| `--ring`                   | `142 70% 45%` / 同値   | focus ring / focus border                     | `primary`                                  | 単純移行可                                                        |
| `--chart-1`                | `142 70% 45%` / 同値   | Tailwind設定のみ。コード使用なし              | 対応先なし                                 | 要確認。v1にchart roleなし                                        |
| `--chart-2`                | `160 60% 42%` / 同値   | Tailwind設定のみ。コード使用なし              | 対応先なし                                 | 要確認。v1にchart roleなし                                        |
| `--chart-3`                | `90 55% 45%` / 同値    | Tailwind設定のみ。コード使用なし              | 対応先なし                                 | 要確認。v1にchart roleなし                                        |
| `--chart-4`                | `45 80% 55%` / 同値    | Tailwind設定のみ。コード使用なし              | 対応先なし                                 | 要確認。v1にchart roleなし                                        |
| `--chart-5`                | `185 65% 45%` / 同値   | Tailwind設定のみ。コード使用なし              | 対応先なし                                 | 要確認。v1にchart roleなし                                        |

`--radius: 0.625rem` も同じファイルにありますがcolor変数ではありません。
`radius.md`などへの単純な意味対応になっていないため、コンポーネント移行時に用途別radiusへ
置き換えます。また、`lib/theme.ts`と`src/global.css.old`にも別の旧テーマ値がありますが、
前者には未使用の注記があり、後者は現在Metroの入力ではありません。

### 具体的な使用箇所

- `background`: `components/TextInputModal.tsx`、`components/ui/{alert-dialog,button,dialog,input}.tsx`
- `foreground`: `components/TextInputModal.tsx`、`components/ui/{alert-dialog,badge,button,dialog,dropdown-menu,icon,input,label,text}.tsx`
- `card` / `card-foreground`: `components/ui/card.tsx`
- `popover` / `popover-foreground`: `components/ui/{dropdown-menu,popover}.tsx`
- `primary` / `primary-foreground`: `components/ui/{badge,button,input}.tsx`
- `secondary` / `secondary-foreground`: `components/ui/{badge,button}.tsx`
- `muted`: `components/ui/text.tsx`
- `muted-foreground`: `app/index.tsx`、`components/SelectorModal.tsx`、`components/ui/{alert-dialog,card,dialog,dropdown-menu,input,text}.tsx`
- `accent` / `accent-foreground`: `components/ui/{badge,button,dialog,dropdown-menu}.tsx`
- `destructive`: `components/ui/{badge,button,dropdown-menu,input}.tsx`
- `border`: `components/ui/{alert-dialog,badge,button,card,dialog,dropdown-menu,popover,text}.tsx`
- `input`: `components/TextInputModal.tsx`、`components/ui/{button,input}.tsx`
- `ring`: `components/ui/{badge,button,dialog,input}.tsx`
- `destructive-foreground` と `chart-1`〜`chart-5`: Tailwind設定以外の使用なし

### 段階的な移行手順と削除条件

1. `src/lib/theme/`のsemantic値を正本にし、旧HSL変数はそのまま共存させる。
2. 共通Text/Input/Card/Dialog/Buttonの順に、背景と前景を必ず対にしてsemantic classへ移す。
3. `background`と`primary`は新旧utility名が衝突するため、既存利用箇所の移行と
   ThemeProviderのルート適用を同じ変更単位で行う。
4. `accent`と`input`は用途を分割してから移行し、機械的な一括置換をしない。
5. 共通レイアウト、一覧、麻雀スコアUIへ順に展開し、直書き色は各Phaseの対象内で解消する。
6. 各旧変数について参照ゼロ、light表示、全state、Android/iOSの回帰を確認する。
7. 上記確認が済んだ変数だけを `global.css` とTailwind設定から削除する。

ThemeProviderのルート適用前でも、名前が衝突しない新semantic utilityの設定は追加できます。
ただしCSS変数はProviderの子孫で解決されるため、実画面での利用開始は該当画面をProvider配下へ
置いた後に行います。`background` / `primary` の切替は既存UIの見た目を変えるためPhase 2で扱います。
