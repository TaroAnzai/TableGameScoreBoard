# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

## Commit message rules

- コミットメッセージの先頭には、変更内容を表す種類を付ける。

  - `Feature:` 新機能の追加
  - `Fix:` 不具合修正
  - `Refactor:` 動作を変更しないコード整理・構造改善
  - `Test:` テストの追加・修正
  - `Docs:` ドキュメントの追加・修正
  - `Chore:` 設定変更、依存関係更新、CI/CD など

- 1つ目の `-m` には、変更内容を簡潔な英文で記述する。

- 1行目は可能な限り短くし、コミットの目的が一目で分かる内容にする。

- 1行目は原則として命令形（imperative mood）で記述する。

  - Good: `Fix login error handling`
  - Avoid: `Fixed login error handling`
  - Avoid: `Fixing login error handling`

- 詳細説明が必要な場合は、2つ目以降の `-m` に日本語で記述する。

- 詳細説明が不要な場合は、1つ目の `-m` のみとする。

- 詳細説明では、コード差分を見れば分かる「何を変更したか」だけでなく、可能な限り以下を記述する。

  - 変更前にどのような問題・制約があったのか
  - なぜこの変更が必要なのか
  - なぜこの実装方法を選択したのか
  - 重要な仕様判断や、将来コードだけを見ても分かりにくい背景
  - 必要に応じて、検討したが採用しなかった方法とその理由

- コミットメッセージは、実際の変更内容を具体的に表すものにする。

- `Update files`、`Fix issue`、`Changes` など、変更内容や目的が分からない曖昧なメッセージは禁止する。

- 1コミットは原則として1つの論理的な変更単位とする。

  - 関係のない変更を同じコミットに含めない。
  - 新機能、不具合修正、リファクタリングなど、目的が異なる変更は可能な限り分離する。
  - 大きな変更は、レビュー可能で意味のある単位に分割する。

- コミット履歴は単なる作業記録ではなく、後から「なぜこの変更が行われたのか」を理解できる技術的な履歴として扱う。

- 数か月後に別の開発者がコミットだけを読んでも、変更理由や設計意図を理解できる内容を目指す。

### Examples

詳細説明が不要な場合:

`git commit -m "Fix: Prevent duplicate organization members"`

詳細説明が必要な場合:

`git commit -m "Feature: Add custom Keycloak login theme" -m "Keycloak のログイン画面に独自テーマを追加。標準画面ではサービス固有のブランドや案内を表示できないため、ロゴ、表示文言、レイアウトを変更した。"`

変更理由や仕様判断が重要な場合:

`git commit -m "Fix: Allow partial score entry" -m "参加人数が4の倍数でない大会では、ゲームごとに参加者を入れ替える運用がある。そのため、全メンバーのスコア入力を必須とせず、実際にゲームへ参加したプレイヤーのみ入力された状態でも保存できるようにした。"`

リファクタリングの場合:

`git commit -m "Refactor: Extract OIDC session handling" -m "OIDC セッション処理が複数のエンドポイントに重複していたため共通処理へ集約した。外部仕様および認証動作は変更しない。"`
