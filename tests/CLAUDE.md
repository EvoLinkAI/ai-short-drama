[Root](../CLAUDE.md) > **tests**

# Tests Module

Multi-tier test suite covering unit, integration, system, regression, concurrency, and contract testing.

## Module Purpose

Comprehensive test infrastructure for the aidrama-studio platform. Tests are organized by tier with increasing scope and resource requirements.

## Directory Structure

```
tests/
  setup/            -- Test bootstrap (env, global setup/teardown)
  helpers/          -- Shared test utilities (auth, fixtures, mocks, DB reset)
  fixtures/         -- Test data (billing cases, etc.)
  contracts/        -- Requirements matrix, route/task-type catalogs
  unit/             -- Pure logic tests (no DB, mocked deps)
  integration/      -- Tests requiring real database
    api/            -- API route contract + specific tests
    billing/        -- Billing lifecycle tests
    chain/          -- End-to-end generation chain tests
    provider/       -- External provider contract tests
    task/           -- Task system integration
    run-runtime/    -- Workflow run integration
  system/           -- Full end-to-end workflows
  regression/       -- Specific bug regression cases
  concurrency/      -- Concurrency safety tests (billing)
  hidden/           -- Internal/sensitive tests
```

## Test Framework

- **Runner**: Vitest with `forks` pool (single fork for isolation)
- **Timeout**: 30s per test, 60s for hooks
- **Coverage**: v8 provider, billing module threshold 80%

## Key Commands

| Command | Scope |
|---------|-------|
| `npm run test:unit:all` | All unit tests |
| `npm run test:integration:api` | API contract tests |
| `npm run test:integration:chain` | Generation chain tests |
| `npm run test:billing` | Full billing suite with coverage |
| `npm run test:system` | System-level E2E tests |
| `npm run test:regression:cases` | Regression cases |
| `npm run test:guards` | Static analysis guard scripts |
| `npm run test:all` | Complete test suite |
| `npm run test:behavior:full` | Behavioral test suite (guards + unit + API + provider + chain) |

## Environment Variables

| Variable | Purpose |
|---------|---------|
| `BILLING_TEST_BOOTSTRAP` | `0` for unit (no DB), `1` for integration (with DB) |
| `SYSTEM_TEST_BOOTSTRAP` | `1` for system tests |

## Test Helpers

- `tests/helpers/auth.ts` -- Mock auth sessions
- `tests/helpers/fixtures.ts` -- Standard test fixtures
- `tests/helpers/db-reset.ts` -- Database cleanup between tests
- `tests/helpers/fakes/` -- Fake LLM, media, providers, scenario server
- `tests/helpers/billing-fixtures.ts` -- Billing-specific test data

## Contracts

- `tests/contracts/route-catalog.ts` -- Complete API route catalog
- `tests/contracts/task-type-catalog.ts` -- All task type definitions
- `tests/contracts/route-behavior-matrix.ts` -- Expected behavior per route
- `tests/contracts/tasktype-behavior-matrix.ts` -- Expected behavior per task type
- `tests/contracts/requirements-matrix.test.ts` -- Requirements compliance validation

## Changelog

| Date | Action |
|------|--------|
| 2026-04-01 | Initial CLAUDE.md generated |
