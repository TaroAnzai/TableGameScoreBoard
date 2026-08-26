# Maestro E2E Guidelines

## Flow size

- Maestro flows should generally contain no more than 25 steps so that execution progress remains easy to inspect in the terminal.
- If a flow would exceed 25 steps, split it into meaningful subflows and invoke them with `runFlow`.
- Split flows by logical responsibility, such as:

  - screen setup/navigation
  - data entry
  - actions
  - assertions
  - cleanup

- Do not split mechanically every 25 steps.
- Avoid creating very small subflows unless they are reused or represent a clear logical unit.
- Parent P0/P1 test flows should preferably remain around 10–15 steps.
- Subflows should preferably remain within 20–25 steps.
- Reusable flows should be placed under `.maestro/flows/common/`.
- Test-specific subflows should stay near the corresponding P0/P1 test.
- The parent flow should make the overall test scenario understandable without opening every subflow.

## App launch

- When a flow needs to launch the app at the beginning, do not use `launchApp` directly.
- Use the common safe-launch flow instead:

```yaml
# 安全な立ち上げ launchApp 代替
- runFlow:
    file: ../../flows/common/launch-app-check.yaml
    env:
      APP_ID: ${APP_ID}
```

- When creating or modifying an existing Maestro flow whose first app-start operation is `launchApp`, replace it with the common safe-launch flow above.
- Preserve any setup commands that must run before the app launch, such as fixture creation in `onFlowStart`.
- Adjust the relative path to `launch-app-check.yaml` when necessary according to the location of the calling flow.
- Do not introduce a new direct `launchApp` command unless there is a specific test requirement that cannot be handled by the common safe-launch flow.

## Flow organization

- Shared operations used by multiple tests should be extracted into reusable flows under `.maestro/flows/common/`.
- Test-specific behavior should not be moved into `common` merely to reduce the number of steps.
- Prefer descriptive flow names that indicate the operation being performed.
- A parent test flow should describe the test scenario at a glance through meaningful `runFlow` calls.
- Keep assertions close to the operation they verify unless separating them creates a clearer logical test unit.

## Refactoring existing flows

When modifying Maestro tests:

1. Check whether the flow exceeds approximately 25 steps.
2. If it does, identify logical groups of operations and extract appropriate subflows.
3. Do not change the test behavior solely for the purpose of reducing step count.
4. Replace a direct initial `launchApp` with the common safe-launch flow.
5. Reuse an existing common flow when an equivalent operation already exists.
6. Avoid unnecessary duplication between P0/P1 tests and common flows.
7. Keep relative `runFlow` paths correct after moving or splitting files.
