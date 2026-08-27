/* global MAESTRO_FIXTURE_EMAIL_PREFIX PENDING_GROUP_A_NAME PENDING_GROUP_B_NAME output */

const runId = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
output.pendingGroups = {
  runId,
  groupAName: `${PENDING_GROUP_A_NAME} ${runId}`,
  groupBName: `${PENDING_GROUP_B_NAME} ${runId}`,
  groupAEmail: `${MAESTRO_FIXTURE_EMAIL_PREFIX}+pending-a-${runId}@example.com`,
  groupBEmail: `${MAESTRO_FIXTURE_EMAIL_PREFIX}+pending-b-${runId}@example.com`,
};
output.fixture = {};
