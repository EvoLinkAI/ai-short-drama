# Comfy H3 remote tunnel (wiring only)

1. On AutoDL: Comfy listen `127.0.0.1:6006` (or 8188).
2. Local: `ssh -CNg -L 6006:127.0.0.1:6006 -p <port> root@<host>`
3. Factory env:
   - `V11_COMFY_USE_FIXTURE=false`
   - `V11_LOCAL_COMFY_RENDER=true`
   - `V11_COMFY_BASE_URL=http://127.0.0.1:6006`
4. `scripts/comfy/assert-h3-ready.sh`
5. `generatorKey=local.comfy.minimax_h3` + reference image on Comfy input
6. Shut down AutoDL when done (ops bot / user — not this patch).
