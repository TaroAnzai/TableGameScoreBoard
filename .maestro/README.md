# Maestro E2E tests

Run every Maestro test through `scripts/maestro-test.sh` from the project root. It loads the root `.env` first, then passes non-secret Maestro settings from `config.yaml`, and always restores the local network-mode controller on exit.

```text
.maestro/
├── config.yaml
├── tests/               # independently runnable test cases
│   ├── p0/              # critical permissions, score, and saved-link tests
│   ├── p1/              # deletion, pending-group, and statistics tests
│   ├── p2/              # settings, navigation, and invalid-link tests
│   └── journeys/        # reserved for non-duplicated long journeys (currently empty)
├── flows/common/        # small reusable UI operations only
├── fixtures/setup/      # API-backed server-data setup scripts
├── fixtures/teardown/   # API-backed cleanup scripts
└── scripts/             # test runner, GUI launcher, and network-mode control
```

`config.yaml` contains only Maestro settings such as `APP_ID`, fixture naming prefixes, and fixed UI calendar values. API URLs and administrator credentials remain only in the root `.env`; do not copy them into `config.yaml` or print them. The runner keeps the existing local names: `MAESTRO_DEV_API_URL`, `MAESTRO_DEV_ADMIN`, and `MAESTRO_DEV_ADMIN_PASSWORD`.

## Fixtures and cleanup

Tests that need server data call `fixtures/setup/create-test-data.js` in `onFlowStart`. Each call declares the graph directly with `FIXTURE_GROUP_COUNT`, `FIXTURE_PLAYER_COUNT`, `FIXTURE_CREATE_GAME`, `FIXTURE_CREATE_EXTRA_TABLE`, and `FIXTURE_ADD_INVALID_LINK`, so the created data can be understood from the test YAML alone. `FIXTURE_LABEL` is used only for unique names. The script assigns `output.fixture.groupKey` immediately after creating the first group and records every created group in `output.fixture.groupKeys`; all UI values are returned under `output.fixture.*`.

The setup options mean:

- `FIXTURE_GROUP_COUNT`: number of groups. Every group receives one tournament and one normal table.
- `FIXTURE_PLAYER_COUNT`: players created in the first group and registered with its tournament and table.
- `FIXTURE_SECOND_GROUP_PLAYER_COUNT`: player count for the second group when two groups are requested.
- `FIXTURE_CREATE_GAME`: creates one game with four scores in every requested group; therefore each group must have four players.
- `FIXTURE_CREATE_EXTRA_TABLE`: creates an additional empty table for direct-deletion checks.
- `FIXTURE_ADD_INVALID_LINK`: exposes a nonexistent table link and its expected error label under `output.fixture`.

Those tests call `fixtures/teardown/delete-group.js` from `onFlowComplete`. It logs in using the root `.env` credentials and issues `DELETE /api/admin/groups/{group_key}`. The backend owns cascading logical deletion of tournaments, tables, and games. Missing fixture keys print `cleanup skipped`; a 404 from deletion is treated as already cleaned up. Authentication and other API failures remain visible without exposing credentials.

Do not create a giant shared fixture. A test with no server-data dependency must not add setup or teardown hooks. `flows/common` is only for reusable UI fragments such as language selection, opening the app, dismissing the save prompt, and clearing saved links—not an entire scenario.

## Running tests

```bash
# P0 / P1 / P2 directories
.maestro/scripts/maestro-test.sh .maestro/tests/p0
.maestro/scripts/maestro-test.sh .maestro/tests/p1
.maestro/scripts/maestro-test.sh .maestro/tests/p2

# One test
.maestro/scripts/maestro-test.sh .maestro/tests/p0/access-control.yaml

# Tag filtering (Maestro CLI)
.maestro/scripts/maestro-test.sh .maestro/tests --include-tags=p0
```

Start the development build, Metro, API, and (when needed) the local network controller before running. The score-input test changes the controller with `scripts/set-network-mode.js`; `maestro-test.sh` resets it to `normal` before and after every run, including interrupt/error exits.

`pending-groups.yaml` currently exercises app-local pending storage plus server-side approval/expiry. The published API available to this repository has no endpoint for seeding that storage or controlling approval/expiry, so it intentionally has no fabricated API fixture. It requires its dedicated pending-state test environment until the backend exposes a supported test-control API; its labels are retained in `config.yaml` only as display settings.

Run static validation before relying on a new fixture: check YAML syntax, every `runFlow`/`runScript` path, JavaScript syntax, and all output references. If setup fails after group creation, `onFlowComplete` still uses the early `output.fixture.groupKey` to remove the partial fixture.
