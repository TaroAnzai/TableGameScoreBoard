# 過去の UI コードレビューについて

このファイルには以前、Expo SDK 56 / React Native 0.85 時点の静的レビュー結果が保存されていました。その後、権限制御、API エラーと再試行、削除操作、戻る fallback、保存ページ、デザインシステムなどの実装が変更され、指摘内容とファイル行番号が現状を表さなくなったため、古いレビュー本文は運用ドキュメントから除去しました。

現在の環境は Expo SDK 57 / React Native 0.86 / React 19.2.3 です。現行仕様は次を参照してください。

- [ルート README](../README.md)
- [API エラーのユーザー向け表示](api-error-presentation.md)
- [保存ページとナビゲーション](Navigation.md)
- [デザインシステム](design-system/design-system-v1.md)
- [Jest Coverage 運用方針](jest-coverage-roule.md)
- [Maestro E2E テスト](../.maestro/README.md)

新しい UI レビュー結果を保存する場合は、調査日、対象 commit、実機確認の有無、実行した検査を明記し、解決済みの指摘を現行課題として残さないでください。
