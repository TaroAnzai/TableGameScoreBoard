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
output.email = `maestro-${timestamp}@example.com`;
output.createdAtLabel = `作成日: ${jstDateForCreation}`;
output.expiresAtLabel = `有効期限: ${jstDate}`;
