[Root](../CLAUDE.md) > **scripts**

# Scripts & Guards Module

Operational scripts, static analysis guards, and data migration tools.

## Module Purpose

Provides 25+ guard scripts that enforce architecture invariants at commit time, plus migration scripts, diagnostic tools, and operational utilities.

## Directory Structure

```
scripts/
  guards/                  -- Static analysis guard scripts (25+)
  migrations/              -- Data migration scripts
  migrations/reports/      -- Migration execution reports
  *.ts                     -- Operational scripts
```

## Guard Scripts (Architecture Enforcement)

Guards run as part of `npm run test:guards` and pre-commit hooks.

| Guard | Purpose |
|-------|---------|
| `api-route-contract-guard.mjs` | Validates API route handler signatures and patterns |
| `no-api-direct-llm-call.mjs` | Prevents direct LLM calls from API routes (must use workers) |
| `no-hardcoded-model-capabilities.mjs` | No hardcoded model capability checks |
| `no-model-key-downgrade.mjs` | Prevents model key format regression |
| `no-provider-guessing.mjs` | No provider inference from model IDs |
| `no-media-provider-bypass.mjs` | All media must go through storage abstraction |
| `no-internal-task-sync-fallback.mjs` | No synchronous task execution fallbacks |
| `no-server-mirror-state.mjs` | No server-side state mirroring |
| `no-multiple-sources-of-truth.mjs` | Single source of truth enforcement |
| `no-duplicate-endpoint-entry.mjs` | No duplicate API endpoint declarations |
| `file-line-count-guard.mjs` | File size limits |
| `image-reference-normalization-guard.mjs` | Media reference consistency |
| `task-submit-compensation-guard.mjs` | Billing compensation on task submission |
| `task-loading-guard.mjs` | Task loading pattern compliance |
| `task-target-states-no-polling-guard.mjs` | SSE over polling enforcement |
| `test-route-coverage-guard.mjs` | Test coverage per API route |
| `test-tasktype-coverage-guard.mjs` | Test coverage per task type |
| `test-behavior-quality-guard.mjs` | Test quality standards |
| `test-behavior-route-coverage-guard.mjs` | Behavioral test route coverage |
| `test-behavior-tasktype-coverage-guard.mjs` | Behavioral test task-type coverage |
| `changed-file-test-impact-guard.mjs` | Changed files must have test coverage |
| `locale-navigation-guard.mjs` | i18n navigation pattern compliance |
| `prompt-i18n-guard.mjs` | Prompt zh/en parity |
| `prompt-semantic-regression.mjs` | Prompt semantic regression detection |
| `prompt-ab-regression.mjs` | Prompt A/B regression detection |
| `prompt-json-canary-guard.mjs` | Prompt JSON output format validation |

## Operational Scripts

| Script | Purpose |
|--------|---------|
| `watchdog.ts` | Worker health monitor, restarts stalled tasks |
| `bull-board.ts` | Bull Board admin panel (Express, port 3010) |
| `task-error-stats.ts` | Task error aggregation statistics |
| `diagnose-project.ts` | Project state diagnostic tool |
| `billing-cleanup-pending-freezes.ts` | Clean up stale billing freezes |
| `billing-reconcile-ledger.ts` | Reconcile billing ledger |
| `media-safety-backup.ts` | Media backup utility |
| `media-backfill-refs.ts` | Backfill media object references |
| `media-build-unreferenced-index.ts` | Find unreferenced media objects |
| `media-archive-legacy-refs.ts` | Archive legacy media references |

## Migration Scripts

| Script | Purpose |
|--------|---------|
| `migrations/migrate-model-config-contract.ts` | Model config key format migration |
| `migrations/migrate-capability-selections.ts` | Capability selection format migration |
| `migrations/migrate-gateway-route-openai-compat.ts` | Gateway route migration |
| `migrations/migrate-custom-pricing-v2.ts` | Custom pricing v2 migration |
| `migrations/migrate-graph-artifacts-unique-index.ts` | Graph artifact index migration |
| `migrations/migrate-release-blockers.ts` | Release blocker migration |
| `migrate-image-urls-contract.ts` | Image URL format migration |
| `migrate-local-to-minio.ts` | Local storage to MinIO migration |

## Changelog

| Date | Action |
|------|--------|
| 2026-04-01 | Initial CLAUDE.md generated |
