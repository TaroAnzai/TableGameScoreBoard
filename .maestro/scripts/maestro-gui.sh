#!/usr/bin/env bash
set -euo pipefail

# Run this script from the project root.
CONFIG_FILE=".maestro/config.yaml"

if [[ ! -f "$CONFIG_FILE" ]]; then
  echo "Error: $CONFIG_FILE was not found. Run this script from the project root." >&2
  exit 1
fi

if ! command -v maestro >/dev/null 2>&1; then
  echo "Error: maestro command was not found in PATH." >&2
  exit 1
fi

ENV_ARGS=()

# Read all simple scalar values directly under the top-level `env:` block
# and convert them to Maestro CLI arguments: -e KEY=VALUE
while IFS=$'\t' read -r key value; do
  [[ -z "$key" ]] && continue

  value="${value%$'\r'}"

  # Support simple quoted YAML scalar values.
  if [[ ${#value} -ge 2 ]]; then
    if [[ "${value:0:1}" == '"' && "${value: -1}" == '"' ]]; then
      value="${value:1:${#value}-2}"
    elif [[ "${value:0:1}" == "'" && "${value: -1}" == "'" ]]; then
      value="${value:1:${#value}-2}"
    fi
  fi

  ENV_ARGS+=("-e" "${key}=${value}")
done < <(
  awk '
    /^env:[[:space:]]*$/ {
      in_env = 1
      next
    }

    in_env && /^[^[:space:]#]/ {
      exit
    }

    in_env && /^[[:space:]]+[A-Za-z_][A-Za-z0-9_]*:[[:space:]]*/ {
      line = $0
      sub(/^[[:space:]]+/, "", line)

      key = line
      sub(/:.*/, "", key)

      value = line
      sub(/^[^:]+:[[:space:]]*/, "", value)

      print key "\t" value
    }
  ' "$CONFIG_FILE"
)

if [[ ${#ENV_ARGS[@]} -eq 0 ]]; then
  echo "Error: no environment variables were found under env: in $CONFIG_FILE." >&2
  exit 1
fi

ENV_COUNT=$((${#ENV_ARGS[@]} / 2))
echo "Loaded ${ENV_COUNT} Maestro environment variables from ${CONFIG_FILE}."

exec "$HOME/.local/opt/maestro-studio/MaestroStudio.AppImage" --no-sandbox "$@"
