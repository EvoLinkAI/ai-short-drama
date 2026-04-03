[Root](../../../CLAUDE.md) > [src](../../) > [lib](../) > **llm**

# LLM Module

Multi-provider LLM gateway supporting chat completion, streaming, and vision across multiple AI providers.

## Module Purpose

Provides a unified interface for LLM text generation (chat and streaming) and vision (image understanding) across multiple providers. Handles provider-specific protocols, reasoning capabilities, and stream processing.

## Entry & Exports

- **Entry**: `src/lib/llm/index.ts`

## Key Files

| File | Purpose |
|------|---------|
| `index.ts` | Module exports |
| `chat-completion.ts` | Non-streaming chat completion |
| `chat-stream.ts` | Streaming chat completion |
| `vision.ts` | Vision (image understanding) calls |
| `runtime.ts` | LLM runtime configuration |
| `runtime-shared.ts` | Shared runtime utilities |
| `types.ts` | Type definitions |
| `utils.ts` | Helper utilities |
| `stream-helpers.ts` | Stream processing utilities |
| `stream-timeout.ts` | Stream timeout handling |
| `completion-parts.ts` | Response parsing (think tags, reasoning) |
| `reasoning-capability.ts` | Model reasoning capability detection |
| `providers/ark.ts` | Volcengine Ark LLM provider |
| `providers/google.ts` | Google AI (Gemini) LLM provider |
| `providers/openai-compat.ts` | OpenAI-compatible LLM provider |

## Key Dependencies

- **AI SDK**: `ai` package (Vercel AI SDK) for streaming
- **Provider SDKs**: `@ai-sdk/google`, `@ai-sdk/openai`, `@google/genai`
- **API Config**: `src/lib/api-config.ts` for provider credentials
- **Model Gateway**: `src/lib/model-gateway/` for protocol routing

## Testing

- Unit: `tests/unit/llm/` (ark-llm-thinking, chat-completion, chat-stream, completion-parts, reasoning-capability)

## Changelog

| Date | Action |
|------|--------|
| 2026-04-01 | Initial CLAUDE.md generated |
