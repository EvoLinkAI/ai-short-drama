[Root](../../../CLAUDE.md) > [src](../../) > [lib](../) > **assistant-platform**

# Assistant Platform Module

In-app AI assistant with a skills-based framework for user guidance.

## Module Purpose

Provides an in-app conversational AI assistant that helps users configure API keys, understand features, and troubleshoot issues. Uses a skills registry for structured responses.

## Key Files

| File | Purpose |
|------|---------|
| `index.ts` | Module entry and exports |
| `runtime.ts` | Assistant conversation runtime |
| `registry.ts` | Skills registry (available assistant capabilities) |
| `system-prompts.ts` | System prompt generation for the assistant |
| `types.ts` | Type definitions |
| `errors.ts` | Error types |
| `skills/api-config-template.ts` | Skill: guide users through API configuration |
| `skills/tutorial.ts` | Skill: platform tutorial and onboarding |

## API

- `POST /api/user/assistant/chat` -- Chat endpoint for the assistant

## Testing

- Unit: `tests/unit/assistant-platform/` (registry, runtime, skills-api-config-template, system-prompts)

## Changelog

| Date | Action |
|------|--------|
| 2026-04-01 | Initial CLAUDE.md generated |
