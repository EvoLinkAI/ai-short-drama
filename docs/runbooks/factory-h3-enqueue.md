# Factory H3 enqueue checklist

> Wave11-A · checklist only · **tunnel already open** prerequisite  
> Do **not** use this doc to start AutoDL / rent GPU / download weights.

## Prerequisites (human / ops — not Bot)

- [ ] SSH tunnel to Comfy already listening on loopback (e.g. `http://127.0.0.1:6006`)
- [ ] Comfy instance already running with MiniMax H3 I2V graph available
- [ ] Reference image already present in Comfy **input** directory (`referenceImageName`)
- [ ] Worktree has Wave10 H3 wiring + this Wave11-A enqueue applied
- [ ] Official I2V workflow path (not deprecated stub) per R12 / `OFFICIAL_I2V_ALIGN`

**Out of scope:** starting AutoDL instances, SSH how-to, weight downloads, paid cloud tiers.

## Env (live only — after tunnel is open)

```bash
export V11_COMFY_USE_FIXTURE=false
export V11_LOCAL_COMFY_RENDER=true
export V11_COMFY_BASE_URL=http://127.0.0.1:6006
# optional: export V11_H3_REFERENCE_IMAGE=hero_frame.png
```

## Enqueue checklist

1. [ ] ShotSpec locked + ContinuityLock + required HumanLocks present
2. [ ] `assertGenerateAllowed` / `enqueueH3Take` preflight would pass (or run unit gate first)
3. [ ] `generatorKey` = `local.comfy.minimax_h3` only (no `cn.*` / `global.*`)
4. [ ] Call `enqueueH3Take({ shotSpec, takeManifestId, preflight, referenceImageName, useFixture: false }, deps)`
5. [ ] Confirm Take + Attempt `SUCCEEDED` + `contentSha256`
6. [ ] Artifacts under `artifacts/comfy-h3-smoke/<shotKey>/` when live `/view` succeeds
7. [ ] Optional: Wave7 G2 technical probe (`calibrated=false`); do **not** claim G3 / eight-layer publish PASS

## Fail-closed reminders

| Condition | Expected |
| --- | --- |
| Preflight red | **Zero** Comfy `submit` (W11A-01) |
| Missing live reference image | `COMFY_I2V_REF_*` / INVALID_INPUT — no silent stub |
| Paid / non-H3 generatorKey | Refuse at enqueue shell (W11A-08) |

## Unit gate (no instance)

```bash
npx vitest run tests/unit/e2e/v11-h3-enqueue-preflight.test.ts
```

## Related

- `docs/runbooks/comfy-h3-remote-tunnel.md` — tunnel wiring (ops)
- Wave10 H3 wiring acceptance · Wave11 design checklist §1 · `H3_REAL_REF_INPUT_GATE` (if present)
