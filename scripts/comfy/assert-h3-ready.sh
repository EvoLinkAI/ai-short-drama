#!/usr/bin/env bash
# H3 readiness probe via loopback tunnel. Does NOT download weights or touch AutoDL SSH.
set -euo pipefail
BASE="${V11_COMFY_BASE_URL:-${COMFY_BASE_URL:-http://127.0.0.1:6006}}"
BASE="${BASE%/}"

echo "assert-h3-ready: probing $BASE"

if [[ "$BASE" != http://127.0.0.1:* && "$BASE" != http://localhost:* ]]; then
  echo "COMFY_H3_READY=0"
  echo "reason=non_loopback_base_url"
  exit 1
fi

code=$(curl -s -o /tmp/comfy_h3_stats.json -w "%{http_code}" "$BASE/system_stats" || true)
if [[ "$code" != "200" ]]; then
  echo "COMFY_H3_READY=0"
  echo "reason=system_stats_http_$code"
  echo "hint=open SSH tunnel first; do not start AutoDL from this script"
  exit 1
fi

# Optional: object_info hint that MiniMax node exists (best-effort)
if curl -sf "$BASE/object_info/MiniMaxH3ImageToVideo" >/dev/null 2>&1; then
  echo "node=MiniMaxH3ImageToVideo present"
else
  echo "warn=MiniMaxH3ImageToVideo object_info not confirmed (Comfy version / custom nodes)"
fi

echo "COMFY_H3_READY=1"
echo "can_smoke=yes_if_weights_present"
echo "note=weight presence must be verified on remote FS (/root/autodl-tmp/V11_VIDEO_NODE); this script does not SSH"
exit 0
