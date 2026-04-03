[Root](../../../CLAUDE.md) > [src](../../) > [lib](../) > **logging**

# Logging Module

Structured logging system with semantic actions, field redaction, and file output.

## Module Purpose

Provides a unified, structured logging framework used throughout the application. Supports scoped loggers, semantic action logging (auth, billing, task lifecycle), sensitive field redaction, and configurable output (console, file, JSON).

## Key Files

| File | Purpose |
|------|---------|
| `core.ts` | Core logger factory, `createScopedLogger()`, `logInfo/logError/logWarn` |
| `semantic.ts` | Semantic action loggers (`logAuthAction`, `logTaskAction`, etc.) |
| `config.ts` | Log level, format, and output configuration from env |
| `context.ts` | Logging context (request ID, user ID) propagation |
| `file-writer.ts` | File-based log output to `/logs/` directory |
| `redact.ts` | Sensitive field redaction (keys from `LOG_REDACT_KEYS` env) |
| `types.ts` | Type definitions |

## Configuration

| Env Variable | Description |
|-------------|-------------|
| `LOG_UNIFIED_ENABLED` | Enable unified logging (true/false) |
| `LOG_LEVEL` | Log level: ERROR, WARN, INFO, DEBUG |
| `LOG_FORMAT` | Output format: json, text |
| `LOG_DEBUG_ENABLED` | Enable debug-level output |
| `LOG_AUDIT_ENABLED` | Enable audit trail logging |
| `LOG_SERVICE` | Service name tag |
| `LOG_REDACT_KEYS` | Comma-separated list of sensitive field names to redact |

## Testing

- Unit: `tests/unit/helpers/logging-core.test.ts`

## Changelog

| Date | Action |
|------|--------|
| 2026-04-01 | Initial CLAUDE.md generated |
