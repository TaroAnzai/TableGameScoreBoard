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
- Parent test flows should preferably remain around 10–15 steps.
- Subflows should preferably remain within 20–25 steps.
- The parent flow should make the overall test scenario understandable without opening every subflow.

## Flow organization

- Parent test flows should remain directly under their test directory.

  - Example: `.maestro/tests/p0/access-control.yaml`
  - Example: `.maestro/tests/p1/stats-period.yaml`

- Test-specific subflows should be placed in a subdirectory next to the parent flow, using the parent flow filename without the `.yaml` extension.

  - Parent: `.maestro/tests/p1/stats-period.yaml`
  - Subflow: `.maestro/tests/p1/stats-period/select-period.yaml`
  - Subflow: `.maestro/tests/p1/stats-period/change-group.yaml`

- Test-specific subflows are intended to be executed only through `runFlow`, not as standalone tests.
- Do not configure recursive Maestro flow discovery in a way that causes test-specific subflows to be executed as standalone tests.
- Reusable flows shared by multiple tests should be placed under `.maestro/flows/common/`.
- Test-specific behavior should not be moved into `.maestro/flows/common/` merely to reduce the number of steps.
- Prefer descriptive flow names that indicate the operation being performed.
- Keep assertions close to the operation they verify unless separating them creates a clearer logical test unit.

## App launch

- When a test flow needs to launch the app at the beginning, do not use `launchApp` directly.
- Use the common safe-launch flow instead:

```yaml
# 安全な立ち上げ launchApp 代替
- runFlow:
    file: ../../flows/common/launch-app-check.yaml
    env:
      APP_ID: ${APP_ID}
```

- When creating or modifying an existing Maestro flow whose first app-start operation is `launchApp`, replace it with the common safe-launch flow above.
- Preserve setup operations that must run before the app launch, such as fixture creation in `onFlowStart`.
- Adjust the relative path to `launch-app-check.yaml` according to the location of the calling flow.
- Do not introduce a new direct `launchApp` command unless there is a specific test requirement that cannot be handled by the common safe-launch flow.

## Refactoring existing flows

When creating or modifying Maestro tests:

1. Check whether the flow exceeds approximately 25 steps.
2. If it does, identify logical groups of operations and extract appropriate subflows.
3. Place test-specific subflows in the directory associated with their parent test flow.
4. Do not change test behavior solely for the purpose of reducing step count.
5. Replace a direct initial `launchApp` with the common safe-launch flow.
6. Reuse an existing common flow when an equivalent shared operation already exists.
7. Avoid unnecessary duplication between test flows and common flows.
8. Keep relative `runFlow` paths correct after moving or splitting files.
9. Ensure that parent test flows remain directly executable from their test directory.
10. Do not modify `.maestro/config.yaml` as part of flow splitting unless explicitly requested.
