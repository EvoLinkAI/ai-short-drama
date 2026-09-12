#!/usr/bin/env bash
# =============================================================================
# smoke-h3-one-shot.sh — Architect ACCEPTANCE **R10** (WAVE10_H3_WIRING_ACCEPTANCE)
#
# GATED one-shot for local.comfy.minimax_h3 (ShotSpec → HTTP /prompt → artifact).
#
# DEFAULT BEHAVIOUR: does **NOT** run live Comfy / does **NOT** touch AutoDL.
# CI must **never** invoke this script (or must leave V11_H3_SMOKE_EXECUTE unset).
#
# Live path requires a human-opened SSH tunnel + ready instance, then ALL of:
#   export V11_H3_SMOKE_EXECUTE=1          # explicit arm
#   export V11_LOCAL_COMFY_RENDER=true
#   export V11_COMFY_USE_FIXTURE=false
#   export V11_COMFY_BASE_URL=http://127.0.0.1:6006   # or :8188 if that is the tunnel
#   export V11_H3_REFERENCE_IMAGE=hero_frame.png      # LoadImage name on Comfy
# Optional:
#   export V11_H3_SMOKE_DRY_RUN=1          # assert-ready + print plan only (still no submit)
#
# Aligns: H3_CONTROL_PLANE_WIRING_NEXT.md R10; H3W-01…06 when fully executed.
# Forbidden: prisma db push, paid cloud APIs, starting/stealing AutoDL from here.
# =============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "smoke-h3-one-shot: ROOT=$ROOT"
echo "smoke-h3-one-shot: R10 gated entry (default = no live)"

EXECUTE="${V11_H3_SMOKE_EXECUTE:-0}"
case "${EXECUTE}" in
  1|true|TRUE|yes|YES) ;;
  *)
    echo "smoke-h3-one-shot: SKIP live — V11_H3_SMOKE_EXECUTE not set."
    echo "smoke-h3-one-shot: (CI-safe exit 0; set V11_H3_SMOKE_EXECUTE=1 only on a human-armed machine)"
    exit 0
    ;;
esac

RENDER="${V11_LOCAL_COMFY_RENDER:-false}"
FIXTURE="${V11_COMFY_USE_FIXTURE:-true}"
BASE="${V11_COMFY_BASE_URL:-${COMFY_BASE_URL:-http://127.0.0.1:6006}}"
BASE="${BASE%/}"
REF="${V11_H3_REFERENCE_IMAGE:-}"

if [[ "$RENDER" != "true" && "$RENDER" != "1" ]]; then
  echo "smoke-h3-one-shot: FAIL — V11_LOCAL_COMFY_RENDER must be true when EXECUTE=1"
  exit 1
fi
if [[ "$FIXTURE" == "true" || "$FIXTURE" == "1" || "$FIXTURE" == "yes" ]]; then
  echo "smoke-h3-one-shot: FAIL — V11_COMFY_USE_FIXTURE must be false for live H3"
  exit 1
fi
if [[ "$BASE" != http://127.0.0.1:* && "$BASE" != http://localhost:* && "$BASE" != http://[::1]:* ]]; then
  echo "smoke-h3-one-shot: FAIL — BASE_URL must be loopback (got $BASE); use SSH -L tunnel"
  exit 1
fi
if [[ -z "$REF" ]]; then
  echo "smoke-h3-one-shot: FAIL — set V11_H3_REFERENCE_IMAGE to a LoadImage filename on Comfy"
  exit 1
fi

echo "smoke-h3-one-shot: flags OK (EXECUTE + RENDER + !FIXTURE + loopback)"
echo "smoke-h3-one-shot: BASE=$BASE REF=$REF tier=local.comfy.minimax_h3"

if [[ ! -x scripts/comfy/assert-h3-ready.sh && ! -f scripts/comfy/assert-h3-ready.sh ]]; then
  echo "smoke-h3-one-shot: FAIL — missing scripts/comfy/assert-h3-ready.sh"
  exit 1
fi

if ! bash scripts/comfy/assert-h3-ready.sh; then
  echo "smoke-h3-one-shot: FAIL — assert-h3-ready (tunnel / Comfy down)"
  exit 1
fi

PLAN=$(cat <<PLAN
# Planned live one-shot (not auto-submitted unless runner exists):
#   generatorKey=local.comfy.minimax_h3
#   preflightOk=true (caller must have passed Continuity / locks)
#   referenceImageName=$REF
#   usePollUntil=true
#   artifactOutDir=artifacts/comfy-h3-smoke/<shotKey>/
# Invoke from app/tests once wiring lands, e.g.:
#   npx tsx scripts/comfy/smoke-h3-one-shot.ts   # optional TS runner — add later
PLAN
)
echo "$PLAN"

if [[ "${V11_H3_SMOKE_DRY_RUN:-0}" == "1" || "${V11_H3_SMOKE_DRY_RUN:-}" == "true" ]]; then
  echo "smoke-h3-one-shot: DRY_RUN=1 — assert-ready passed; no /prompt submit"
  exit 0
fi

# Optional TS/Node runner if present in worktree after apply; never invent paid calls.
RUNNER_TS="scripts/comfy/smoke-h3-one-shot.ts"
RUNNER_JS="scripts/comfy/smoke-h3-one-shot.mjs"
if [[ -f "$RUNNER_TS" ]]; then
  echo "smoke-h3-one-shot: launching $RUNNER_TS"
  exec npx --yes tsx "$RUNNER_TS"
fi
if [[ -f "$RUNNER_JS" ]]; then
  echo "smoke-h3-one-shot: launching $RUNNER_JS"
  exec node "$RUNNER_JS"
fi

echo "smoke-h3-one-shot: ARMED + ready, but no TS/JS runner file yet."
echo "smoke-h3-one-shot: exit 0 after gate — wire startLocalComfyTakes(minimax_h3) as $RUNNER_TS when ready."
echo "smoke-h3-one-shot: will NOT submit /prompt from this shell stub (fail-safe)."
exit 0
