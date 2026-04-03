[Root](../../../CLAUDE.md) > [src](../../) > [lib](../) > **billing**

# Billing Module

Freeze-settle billing ledger with three operating modes: OFF, SHADOW, ENFORCE.

## Module Purpose

Manages user balance, cost estimation, freeze/settle lifecycle for all billable tasks (image, video, voice, text, lip-sync, voice-design). Integrates with the task system to track per-task costs.

## Entry & Exports

- **Entry**: `src/lib/billing/index.ts`
- Key exports: `prepareTaskBilling`, `settleTaskBilling`, `rollbackTaskBilling`, `addBalance`, `getBalance`, `getBillingMode`, billing wrappers (`withImageBilling`, `withVideoBilling`, etc.)

## Architecture

```
Task Created -> prepareTaskBilling() -> BalanceFreeze (pending)
Task Running -> worker executes AI call
Task Completed -> settleTaskBilling() -> BalanceTransaction + BalanceFreeze (settled)
Task Failed -> rollbackTaskBilling() -> BalanceFreeze (rolled_back)
```

## Key Files

| File | Purpose |
|------|---------|
| `mode.ts` | Billing mode resolution (OFF/SHADOW/ENFORCE from env) |
| `cost.ts` | Cost calculation per task type, model, and quantity |
| `ledger.ts` | Balance read/write, atomic operations |
| `service.ts` | Core freeze/settle/rollback orchestration, billing wrappers |
| `task-policy.ts` | Determines which task types are billable |
| `reporting.ts` | Cost aggregation for projects and users |
| `runtime-usage.ts` | Runtime usage tracking |
| `currency.ts` | Currency constants |
| `money.ts` | Decimal arithmetic helpers |
| `errors.ts` | `InsufficientBalanceError` |
| `types.ts` | Type definitions |

## Key Dependencies

- **Prisma**: `UserBalance`, `BalanceFreeze`, `BalanceTransaction` models
- **Task types**: `src/lib/task/types.ts` for `TaskBillingInfo`
- **Standards**: `standards/pricing/image-video.pricing.json` for pricing catalog

## Data Model

- `UserBalance`: Per-user balance with frozen amount tracking
- `BalanceFreeze`: Pending cost reservations with idempotency keys
- `BalanceTransaction`: Settled cost records with full audit trail

## Testing

- **Unit**: `tests/unit/billing/` (cost, mode, service, task-policy, ledger, runtime-usage)
- **Integration**: `tests/integration/billing/` (API contract, ledger, service, submitter, worker lifecycle)
- **Concurrency**: `tests/concurrency/billing/` (ledger concurrent safety)
- **Coverage threshold**: 80% (branches, functions, lines, statements) -- enforced in `vitest.config.ts`
- **Run**: `npm run test:billing` (runs all tiers with coverage)

## Changelog

| Date | Action |
|------|--------|
| 2026-04-01 | Initial CLAUDE.md generated |
