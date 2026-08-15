# Maestro E2E

`mahjong-full-journey.yaml` は、最初に `new-group-registration-test.yaml` を実行し、テスト対象のグループを作成してアプリへ登録します。

`cache-invalidation-journey.yaml` は、グループ・大会・記録用紙の作成と名称変更後に、遷移元の一覧へ最新値が反映されることを検証します。作成時と更新時のキャッシュ更新を個別に検出するため、各リソースは作成直後に一度上位画面へ戻って確認してから名称を変更します。

グループ作成API（`http://localhost:6080`）、Metro（`npm start`）、Android の開発ビルドを起動してから実行します。グループ名、プレイヤー名、大会名などのテストデータは `scripts/create-group-fixture.js` が実行ごとにまとめて設定します。

```sh
maestro test .maestro/mahjong-full-journey.yaml
maestro test .maestro/cache-invalidation-journey.yaml
```
