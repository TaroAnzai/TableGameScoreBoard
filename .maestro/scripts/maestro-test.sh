#!/usr/bin/env bash
set -euo pipefail

# Run this script from the project root.
ENV_FILE=".env"
CONFIG_FILE=".maestro/config.yaml"

if [[ -f "$ENV_FILE" ]]; then
  # Export .env values for Maestro scripts. Values passed from config.yaml below
  # use explicit -e arguments and therefore take precedence over these values.
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
  echo "Loaded environment variables from ${ENV_FILE}."
fi

if [[ ! -f "$CONFIG_FILE" ]]; then
  echo "Error: $CONFIG_FILE was not found. Run this script from the project root." >&2
  exit 1
fi

if ! command -v maestro >/dev/null 2>&1; then
  echo "Error: maestro command was not found in PATH." >&2
  exit 1
fi

if [[ $# -eq 0 ]]; then
  echo "Usage: $0 <flow-or-directory> [maestro test options...]" >&2
  echo "Example: $0 .maestro/p0/access-control.yaml" >&2
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

CONTROL_URL="http://127.0.0.1:9099"

reset_network() {
  curl -s -X POST "$CONTROL_URL/mode/normal" > /dev/null || true
}

cleanup() {
  echo
  echo "Resetting network mode..."
  reset_network
}

trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

# 前回の失敗で異常モードが残っていても必ずリセット
reset_network

maestro test \
  --config "$CONFIG_FILE" \
  "${ENV_ARGS[@]}" \
  "$@"
