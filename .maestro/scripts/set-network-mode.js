/* global MODE http */
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
*/

const mode = MODE;

const validModes = ['normal', 'offline', '500'];

if (!validModes.includes(mode)) {
  throw new Error(`Invalid network mode: ${mode}. Valid modes: ${validModes.join(', ')}`);
}

const url = `http://127.0.0.1:9099/mode/${mode}`;

const response = http.post(url, {
  body: '',
});

if (!response.ok) {
  throw new Error(
    `Failed to set network mode to "${mode}". ` + `HTTP ${response.status}: ${response.body}`,
  );
}

console.log(`Network mode changed to: ${mode}`);
