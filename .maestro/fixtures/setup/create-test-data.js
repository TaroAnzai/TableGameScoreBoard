/* global MAESTRO_DEV_API_URL, MAESTRO_FIXTURE_NAME_PREFIX, MAESTRO_FIXTURE_EMAIL_PREFIX, APP_SCHEME, FIXTURE_LABEL, FIXTURE_GROUP_COUNT, FIXTURE_PLAYER_COUNT, FIXTURE_SECOND_GROUP_PLAYER_COUNT, FIXTURE_CREATE_GAME, FIXTURE_CREATE_EXTRA_TABLE, FIXTURE_ADD_INVALID_LINK, http, json, output */

// Maestro runScript does not reliably support module imports. Keep this fixture
// self-contained. Each calling YAML explicitly states the data graph it needs.
const required = {
  MAESTRO_DEV_API_URL,
  MAESTRO_FIXTURE_NAME_PREFIX,
  MAESTRO_FIXTURE_EMAIL_PREFIX,
  APP_SCHEME,
  FIXTURE_LABEL,
  FIXTURE_GROUP_COUNT,
  FIXTURE_PLAYER_COUNT,
};
for (const [key, value] of Object.entries(required)) {
  if (typeof value !== 'string' || value.trim() === '') throw new Error(`${key} must be set`);
}

const parseCount = (name, value) => {
  const count = Number(value);
  if (!Number.isInteger(count) || count < 0) throw new Error(`${name} must be a non-negative integer`);
  return count;
};

const parseBoolean = (name, value) => {
  if (value === undefined || value === 'false') return false;
  if (value === 'true') return true;
  throw new Error(`${name} must be "true" or "false"`);
};

const groupCount = parseCount('FIXTURE_GROUP_COUNT', FIXTURE_GROUP_COUNT);
const playerCount = parseCount('FIXTURE_PLAYER_COUNT', FIXTURE_PLAYER_COUNT);
const secondGroupPlayerCount = typeof FIXTURE_SECOND_GROUP_PLAYER_COUNT === 'undefined'
  ? playerCount
  : parseCount('FIXTURE_SECOND_GROUP_PLAYER_COUNT', FIXTURE_SECOND_GROUP_PLAYER_COUNT);
const shouldCreateGame = parseBoolean('FIXTURE_CREATE_GAME', FIXTURE_CREATE_GAME);
const shouldCreateExtraTable = parseBoolean('FIXTURE_CREATE_EXTRA_TABLE', FIXTURE_CREATE_EXTRA_TABLE);
const shouldAddInvalidLink = parseBoolean('FIXTURE_ADD_INVALID_LINK', FIXTURE_ADD_INVALID_LINK);

if (groupCount < 1 || groupCount > 2) throw new Error('FIXTURE_GROUP_COUNT must be 1 or 2');
if (playerCount > 4 || secondGroupPlayerCount > 4) throw new Error('Fixture player count cannot exceed 4');
if (shouldCreateGame && (playerCount !== 4 || (groupCount === 2 && secondGroupPlayerCount !== 4))) {
  throw new Error('A normal-table Game fixture requires exactly 4 players in each group');
}

const api = MAESTRO_DEV_API_URL.replace(/\/$/, '');
const runId = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
const fixture = { groupKey: undefined };
output.fixture = fixture;

const request = (method, path, body) => {
  const response = http[method](`${api}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`${method.toUpperCase()} ${path} failed (HTTP ${response.status})`);
  return response.body ? json(response.body) : undefined;
};

const requireString = (resource, field) => {
  const value = resource && resource[field];
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Fixture response did not contain ${field}`);
  }
  return value;
};

const findAccessKey = (resource, linksField, accessLevel) => {
  if (!resource) throw new Error(`Fixture response did not contain ${linksField}`);

  const legacyField = `${accessLevel.toLowerCase()}_link`;
  if (typeof resource[legacyField] === 'string' && resource[legacyField].length > 0) {
    return resource[legacyField];
  }

  const matchingLink = Array.isArray(resource[linksField])
    ? resource[linksField].find(
        (item) => item && String(item.access_level).toUpperCase() === accessLevel,
      )
    : undefined;
  if (matchingLink && typeof matchingLink.short_key === 'string' && matchingLink.short_key.length > 0) {
    return matchingLink.short_key;
  }

  return undefined;
};

const accessKey = (resource, linksField, accessLevel) => {
  const key = findAccessKey(resource, linksField, accessLevel);
  if (key) return key;

  const availableLevels = Array.isArray(resource[linksField])
    ? resource[linksField].map((item) => item && item.access_level).filter(Boolean).join(', ')
    : 'none';
  throw new Error(
    `Fixture response did not contain a ${accessLevel} key in ${linksField} `
      + `(available access levels: ${availableLevels || 'none'})`,
  );
};

const link = (resource, key) => `${APP_SCHEME}://mahjong/${resource}/${key}`;

const createGroup = (suffix = '') => {
  const groupName = `${MAESTRO_FIXTURE_NAME_PREFIX} ${FIXTURE_LABEL}${suffix} ${runId}`;
  const emailSuffix = suffix.trim().replace(/\s+/g, '-').toLowerCase();
  const email = `${MAESTRO_FIXTURE_EMAIL_PREFIX}+${FIXTURE_LABEL}${emailSuffix}-${runId}@example.com`;
  const invitation = request('post', '/api/groups/request-link', {
    name: groupName, email, timezone: 'Asia/Tokyo', recaptcha_token: '',
  });
  const token = requireString(invitation, 'token');
  const group = request('post', '/api/groups', { token });
  if (typeof group.id !== 'number') throw new Error('Fixture group response did not contain id');
  const ownerKey = accessKey(group, 'group_links', 'OWNER');
  // Save before resolving optional child links so cleanup can remove a partial
  // fixture if a later response is incomplete.
  if (!fixture.groupKey) fixture.groupKey = ownerKey;
  if (!Array.isArray(fixture.groupKeys)) fixture.groupKeys = [];
  fixture.groupKeys.push(ownerKey);
  const result = {
    id: group.id,
    key: ownerKey,
    name: group.name || groupName,
    ownerLink: link('group', ownerKey),
    editLink: link('group', accessKey(group, 'group_links', 'EDIT')),
    viewLink: link('group', accessKey(group, 'group_links', 'VIEW')),
  };
  return result;
};

const createTournament = (group, suffix = '') => {
  const name = `${MAESTRO_FIXTURE_NAME_PREFIX} 大会${suffix} ${runId}`;
  // Match the V2 endpoint used by the application. Its response wraps the
  // created resource in `tournament`.
  const payload = request('post', `/api/v2/groups/${group.key}/tournaments`, {
    name,
    rate: 1,
    initial_tables: [],
  });
  const tournament = payload && payload.tournament;
  if (!tournament) throw new Error('Tournament fixture response did not contain tournament');
  if (typeof tournament.id !== 'number') throw new Error('Fixture tournament response did not contain id');
  const ownerKey = accessKey(tournament, 'tournament_links', 'OWNER');
  return {
    id: tournament.id, key: ownerKey, name: tournament.name || name,
    ownerLink: link('tournament', ownerKey),
    editLink: link('tournament', accessKey(tournament, 'tournament_links', 'EDIT')),
    viewLink: link('tournament', accessKey(tournament, 'tournament_links', 'VIEW')),
  };
};

const createPlayers = (group, count = 4) => {
  const directions = ['東', '南', '西', '北'];
  return directions.slice(0, count).map((direction) => {
    const name = `${direction}${MAESTRO_FIXTURE_NAME_PREFIX}${runId}`;
    const player = request('post', `/api/groups/${group.key}/players`, { name });
    if (typeof player.id !== 'number') throw new Error('Fixture player response did not contain id');
    return { id: player.id, name };
  });
};

const addTournamentPlayers = (tournament, players) => {
  if (players.length === 0) return;
  request('post', `/api/v2/tournaments/${tournament.key}/participants:batch-add`, {
    participants: players.map((player) => ({ player_id: player.id })),
  });
};

const createTable = (tournament, name, players = []) => {
  const table = request('post', `/api/tournaments/${tournament.key}/tables`, { name, type: 'NORMAL' });
  if (typeof table.id !== 'number') throw new Error('Fixture table response did not contain id');
  // Tables currently expose VIEW and EDIT links, but no OWNER link. EDIT is
  // the mutation key used for participant, game, and table deletion APIs.
  const editKey = accessKey(table, 'table_links', 'EDIT');
  if (players.length) {
    request('post', `/api/tables/${editKey}/players`, {
      players: players.map((player, index) => ({ player_id: player.id, seat_position: index + 1 })),
    });
  }
  return {
    id: table.id, key: editKey, name: table.name || name,
    editLink: link('table', editKey),
    viewLink: link('table', accessKey(table, 'table_links', 'VIEW')),
  };
};

const addGame = (table, players) => {
  const game = request('post', `/api/tables/${table.key}/games`, {
    scores: players.map((player, index) => ({ player_id: player.id, score: [100, -100, 0, 0][index] })),
  });
  if (!game || typeof game.id !== 'number') {
    throw new Error('Fixture game response did not contain id');
  }
  return game;
};

const assignBasicGraph = (numberOfPlayers) => {
  const group = createGroup();
  const tournament = createTournament(group);
  const players = createPlayers(group, numberOfPlayers);
  addTournamentPlayers(tournament, players);
  const table = createTable(tournament, `${MAESTRO_FIXTURE_NAME_PREFIX} 卓 ${runId}`, players);
  Object.assign(fixture, {
    groupId: group.id, groupName: group.name, groupOwnerLink: group.ownerLink, groupEditLink: group.editLink, groupViewLink: group.viewLink,
    tournamentId: tournament.id, tournamentName: tournament.name, tournamentOwnerLink: tournament.ownerLink, tournamentEditLink: tournament.editLink, tournamentViewLink: tournament.viewLink,
    tableId: table.id, tableName: table.name, tableEditLink: table.editLink, tableViewLink: table.viewLink,
    players,
  });
  players.forEach((player, index) => {
    fixture[`player${index + 1}`] = player.name;
  });
  return { group, tournament, table, players };
};

const primary = assignBasicGraph(playerCount);

if (shouldCreateGame) {
  const game = addGame(primary.table, primary.players);
  fixture.gameId = game.id;
}

if (shouldCreateExtraTable) {
  const directTable = createTable(primary.tournament, `${MAESTRO_FIXTURE_NAME_PREFIX} 直接削除卓 ${runId}`);
  fixture.directDeleteTableName = directTable.name;
  fixture.directDeleteTableLink = directTable.editLink;
}

if (shouldAddInvalidLink) {
  fixture.invalidFormatLink = `${APP_SCHEME}://mahjong/table/not-a-valid-share-key`;
  fixture.invalidFormatError = 'ページを取得できませんでした';
}

if (groupCount === 2) {
  const second = createGroup(' B');
  const secondTournament = createTournament(second, ' B');
  const secondPlayers = createPlayers(second, secondGroupPlayerCount);
  addTournamentPlayers(secondTournament, secondPlayers);
  const secondTable = createTable(
    secondTournament,
    `${MAESTRO_FIXTURE_NAME_PREFIX} 卓 B ${runId}`,
    secondPlayers,
  );
  let secondGame;
  if (shouldCreateGame) secondGame = addGame(secondTable, secondPlayers);

  fixture.groupBName = second.name;
  fixture.groupBId = second.id;
  fixture.groupBOwnerLink = second.ownerLink;
  fixture.groupBEditLink = second.editLink;
  fixture.groupBViewLink = second.viewLink;
  fixture.tournamentBName = secondTournament.name;
  fixture.tournamentBId = secondTournament.id;
  fixture.tournamentBOwnerLink = secondTournament.ownerLink;
  fixture.tournamentBEditLink = secondTournament.editLink;
  fixture.tournamentBViewLink = secondTournament.viewLink;
  fixture.tableBId = secondTable.id;
  fixture.tableBName = secondTable.name;
  fixture.tableBEditLink = secondTable.editLink;
  fixture.tableBViewLink = secondTable.viewLink;
  fixture.gameBId = secondGame && secondGame.id;

  // Backward-compatible aliases used by the statistics flow.
  fixture.statsGroupBName = second.name;
  fixture.statsGroupBLink = second.ownerLink;
  fixture.statsGroupBUniquePlayer = secondPlayers[0] && secondPlayers[0].name;
  fixture.statsGroupAName = primary.group.name;
  fixture.statsGroupALink = primary.group.ownerLink;
}
