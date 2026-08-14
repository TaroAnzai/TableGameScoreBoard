const timestamp = Date.now().toString();
const jstDate = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);

output.groupName = `Maestro Group ${timestamp}`;
output.email = `maestro-${timestamp}@example.com`;
output.createdAtLabel = `作成日: ${jstDate}`;
