/* global CLIENT_ID MODE TOKEN http */
/*
- runScript:
  file: ../../scripts/set-network-mode.js
  env:
    MODE: normal
- runScript:
    file: ../../scripts/set-network-mode.js
    env:
      MODE: offline
- runScript:
    file: ../../scripts/set-network-mode.js
    env:
      MODE: 500
- runScript:
    file: ../../scripts/set-network-mode.js
    env:
      MODE: expired
      TOKEN: request-link-token
- runScript:
    file: ../../scripts/set-network-mode.js
    env:
      MODE: expired
      CLIENT_ID: request-client-id
- runScript:
    file: ../../scripts/set-network-mode.js
    env:
      MODE: pending-reset
*/

const mode = MODE;

const networkModes = ['normal', 'offline', '500'];
const validModes = [...networkModes, 'expired', 'pending-reset'];

if (!validModes.includes(mode)) {
  throw new Error(`Invalid network mode: ${mode}. Valid modes: ${validModes.join(', ')}`);
}

let url;
let body = '';
let headers;

if (mode === 'expired') {
  const token = typeof TOKEN === 'string' ? TOKEN.trim() : '';
  const clientId = typeof CLIENT_ID === 'string' ? CLIENT_ID.trim() : '';

  if ((token === '' && clientId === '') || (token !== '' && clientId !== '')) {
    throw new Error('MODE=expired requires exactly one non-empty TOKEN or CLIENT_ID');
  }

  url = 'http://127.0.0.1:9099/pending-status/expired';
  body = JSON.stringify(token !== '' ? { token } : { client_id: clientId });
  headers = { 'Content-Type': 'application/json' };
} else if (mode === 'pending-reset') {
  url = 'http://127.0.0.1:9099/pending-status/reset';
  body = '{}';
  headers = { 'Content-Type': 'application/json' };
} else {
  url = `http://127.0.0.1:9099/mode/${mode}`;
}

const response = http.post(url, {
  body,
  ...(headers ? { headers } : {}),
});

if (!response.ok) {
  throw new Error(
    `Failed to set network mode to "${mode}". ` + `HTTP ${response.status}: ${response.body}`,
  );
}

if (networkModes.includes(mode)) {
  console.log(`Network mode changed to: ${mode}`);
} else if (mode === 'expired') {
  console.log('Pending status expiration target added');
} else {
  console.log('Pending status expiration targets reset');
}
