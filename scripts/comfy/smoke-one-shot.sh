#!/usr/bin/env bash
# Wave10 Phase B one-shot — gated on assert-ready. Not for Phase A.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

if [[ "${V11_LOCAL_COMFY_RENDER:-false}" != "true" && "${V11_LOCAL_COMFY_RENDER:-0}" != "1" ]]; then
  echo "smoke-one-shot: V11_LOCAL_COMFY_RENDER must be true"
  exit 1
fi

if ! bash scripts/comfy/assert-ready.sh; then
  echo "smoke-one-shot: can_smoke=no — install Comfy/weights first (see docs/runbooks/comfy-install-8gb.md)"
  exit 1
fi

echo "smoke-one-shot: Phase B runner not executed in Phase A slice (fixtures only)."
exit 0
