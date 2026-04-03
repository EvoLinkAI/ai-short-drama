# Behavior Test Standard

## Scope
- `tests/integration/api/contract/**/*.test.ts`
- `tests/integration/provider/**/*.test.ts`
- `tests/integration/chain/**/*.test.ts`
- `tests/system/**/*.test.ts`
- `tests/regression/**/*.test.ts`
- `tests/unit/worker/**/*.test.ts`

## Must-have
- Assert observable results: response payload/status, persisted fields, or queue/job payload.
- Include at least one concrete-value assertion for each key business branch.
- Cover at least one failure branch for each critical route/handler.

## Forbidden patterns
- Source-text contract assertions (for example checking route code contains `apiHandler`, `submitTask`, `maybeSubmitLLMTask`).
- Using only weak call assertions like `toHaveBeenCalled()` as the primary proof.
- Structural tests that pass without executing route/worker logic.

## Minimum assertion quality
- Prefer `toHaveBeenCalledWith(...)` with `objectContaining(...)` on critical fields.
- Validate exact business fields (`description`, `imageUrl`, `referenceImages`, `aspectRatio`, `taskId`, `async`).
- For async task chains, validate queue selection and job metadata (`jobId`, `priority`, `type`).

## Regression rule
- One historical bug must map to at least one dedicated regression test case.
- Bug fix without matching behavior regression test is incomplete.
- Provider or gateway protocol changes must add a provider contract test or update an existing localhost fake-provider scenario.
