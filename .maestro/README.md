# Maestro E2E

`mahjong-full-journey.yaml` は、最初に `new-group-registration-test.yaml` を実行し、テスト対象のグループを作成してアプリへ登録します。

グループ作成API（`http://localhost:6080`）、Metro（`npm start`）、Android の開発ビルドを起動してから実行します。グループ名、プレイヤー名、大会名などのテストデータは `scripts/create-group-fixture.js` が実行ごとにまとめて設定します。

```sh
maestro test .maestro/mahjong-full-journey.yaml
```
