[Root](../../../CLAUDE.md) > [src](../../) > [lib](../) > **model-gateway**

# Model Gateway Module

Model routing layer and OpenAI-compatible protocol adapter for unified multi-provider access.

## Module Purpose

Routes model requests to the correct provider and protocol. Supports both native provider SDKs and OpenAI-compatible endpoints. Handles template-based image/video generation for OpenAI-compatible providers.

## Key Files

| File | Purpose |
|------|---------|
| `index.ts` | Module exports |
| `router.ts` | Model routing logic (provider resolution, protocol selection) |
| `llm.ts` | LLM-specific gateway operations |
| `types.ts` | Gateway type definitions |
| `openai-compat/index.ts` | OpenAI-compatible protocol adapter |
| `openai-compat/chat.ts` | Chat completion adapter |
| `openai-compat/responses.ts` | Response parsing |
| `openai-compat/common.ts` | Shared utilities |
| `openai-compat/image.ts` | Image generation adapter |
| `openai-compat/video.ts` | Video generation adapter |
| `openai-compat/template-image.ts` | Image generation template rendering |
| `openai-compat/template-video.ts` | Video generation template rendering |

## Key Dependencies

- `src/lib/api-config.ts` -- Provider credentials and custom provider configs
- `src/lib/model-config-contract.ts` -- `provider::modelId` key parsing
- `src/lib/llm/` -- LLM provider implementations

## Testing

- Unit: `tests/unit/model-gateway/` (llm, router, openai-compat-responses, template-renderer, template-image-output-urls, template-video-external-id)

## Changelog

| Date | Action |
|------|--------|
| 2026-04-01 | Initial CLAUDE.md generated |
