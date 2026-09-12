#!/usr/bin/env bash
# Wave10 Phase B probe — does NOT install Comfy. Reports can_smoke.
# Usage: bash scripts/comfy/assert-ready.sh
set -euo pipefail

BASE_URL="${V11_COMFY_BASE_URL:-${COMFY_BASE_URL:-http://127.0.0.1:8188}}"
BASE_URL="${BASE_URL%/}"
OUT_DIR="${COMFY_READY_OUT_DIR:-.}"
READY_FILE="${OUT_DIR%/}/COMFY_READY"

echo "assert-ready: probing ${BASE_URL}/system_stats"

if ! command -v curl >/dev/null 2>&1; then
  echo "COMFY_READY=0"
  echo "can_smoke=no"
  echo "reason=curl_missing"
  echo 0 >"${READY_FILE}" 2>/dev/null || true
  exit 1
fi

HTTP_CODE="$(curl -sS -o /tmp/comfy-system-stats.json -w '%{http_code}' \
  --connect-timeout 2 --max-time 5 \
  "${BASE_URL}/system_stats" || true)"

if [[ "${HTTP_CODE}" != "200" ]]; then
  echo "COMFY_READY=0"
  echo "can_smoke=no"
  echo "reason=server_down_or_http_${HTTP_CODE}"
  echo 0 >"${READY_FILE}" 2>/dev/null || true
  exit 1
fi

echo "COMFY_READY=1"
echo "can_smoke=yes"
echo 1 >"${READY_FILE}" 2>/dev/null || true
exit 0
