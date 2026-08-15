# Maestro E2E

`mahjong-full-journey.yaml` は、編集権限を持つ登録済みのテスト専用グループを使います。
テストデータの衝突を避けるため、空のグループで実行してください。

Metro（`npm start`）と Android の開発ビルドを起動してから、次のように実行します。

```sh
maestro test \
  -e APP_ID=com.anzaihome.mahjongapp.dev \
  -e APP_SCHEME=mahjongapp-dev \
  -e GROUP_NAME=Maestroテストグループ \
  -e PLAYER_1=東テスト \
  -e PLAYER_2=南テスト \
  -e PLAYER_3=西テスト \
  -e PLAYER_4=北テスト \
  -e TOURNAMENT_NAME=Maestro大会 \
  -e EDITED_TOURNAMENT_NAME=Maestro大会編集済み \
  -e TOURNAMENT_MEMO=Maestro編集確認 \
  -e CREATE_PLAYER_1=true \
  -e CREATE_PLAYER_2=true \
  -e CREATE_PLAYER_3=true \
  -e CREATE_PLAYER_4=true \
  .maestro/mahjong-full-journey.yaml
```

4名がすでにグループに存在する場合は、対応する `CREATE_PLAYER_n` を `false` にすると作成処理を省略できます。本番ビルドを対象にする場合は `APP_ID=com.anzaihome.mahjongapp` と `APP_SCHEME=mahjongapp` を指定します。
