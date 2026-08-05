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
