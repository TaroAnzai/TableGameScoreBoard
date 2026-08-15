/* global output */
const timestamp = Date.now().toString();
const jstDate = new Date(Date.now() + 9 * 60 * 60 * 1000)
  .toISOString()
  .slice(0, 16)
  .replace('T', ' ');
const jstDateForCreation = new Date(Date.now() + 9 * 60 * 60 * 1000)
  .toISOString()
  .slice(0, 10)
  .replace('T', ' ');
output.groupName = `Maestro Group ${timestamp}`;
output.editedGroupName = `MaestroGroupEdited${timestamp}`;
output.email = `maestro-${timestamp}@example.com`;
output.createdAtLabel = `作成日: ${jstDateForCreation}`;
output.expiresAtLabel = `有効期限: ${jstDate}`;
output.player1 = `東テスト${timestamp}`;
output.player2 = `南テスト${timestamp}`;
output.player3 = `西テスト${timestamp}`;
output.player4 = `北テスト${timestamp}`;
output.tournamentName = `Maestro大会${timestamp}`;
output.editedTournamentName = `Maestro大会編集済み${timestamp}`;
output.tournamentMemo = `Maestro編集確認${timestamp}`;
output.tableName = '卓1';
output.editedTableName = `編集済み卓${timestamp}`;
