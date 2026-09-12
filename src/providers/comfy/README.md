# src/providers/comfy

Wave10 **out-of-process** ComfyUI HTTP client (GPL boundary).

## License / process boundary

- **In-repo:** thin HTTP client, workflow JSON templates, recorded fixtures, adapters.
- **Out of repo:** ComfyUI upstream source, custom nodes tree, model weights, torch.
- Do **not** vendor ComfyUI GPL into this git tree.

## Base URL

- Env: `V11_COMFY_BASE_URL` (alias `COMFY_BASE_URL`)
- Default: `http://127.0.0.1:8188` (loopback only for live)

## Flags

| Flag | Default | Meaning |
| --- | --- | --- |
| `V11_LOCAL_COMFY_RENDER` | `false` | Live HTTP allowed only when true **and** fixture off |
| `V11_COMFY_USE_FIXTURE` | `true` (unset → true) | Never hit network; use `tests/fixtures/comfy/` |

## Tiers

- Default smoke: `local.comfy.wan22_5b` (8GB + offload)
- Alt: `local.comfy.ltx`
- **Refuse** default submit: `local.comfy.wan22_14b`

## Phases

- **Phase A:** fixture contract tests (CTR-01–05) — no GPU / no install
- **Phase B:** after `scripts/comfy/assert-ready.sh` → `can_smoke=yes`
