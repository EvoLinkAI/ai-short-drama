# Hidden Acceptance Reserve

This directory is intentionally reserved for private acceptance and regression suites that are not exposed to code-writing agents.

Public repo rules:
- Do not add executable public tests here.
- Keep provider/system helper interfaces stable so private CI can mount hidden evals without patching production code.
- Private hidden suites should target the same route entrypoints and fake-provider hooks used by `tests/system/**`.
