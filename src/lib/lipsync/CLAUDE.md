[Root](../../../CLAUDE.md) > [src](../../) > [lib](../) > **lipsync**

# Lipsync Module

Lip-sync video generation from audio + image, supporting multiple providers.

## Module Purpose

Generates lip-synced video by combining a character image with voice audio. Supports multiple providers with automatic fallback.

## Key Files

| File | Purpose |
|------|---------|
| `index.ts` | Module entry, provider dispatch |
| `types.ts` | Type definitions |
| `preprocess.ts` | Audio/image preprocessing before lip-sync |
| `providers/bailian.ts` | Alibaba Bailian lip-sync provider |
| `providers/fal.ts` | Fal.ai lip-sync provider |
| `providers/vidu.ts` | Vidu lip-sync provider |

## Testing

- Unit: `tests/unit/lipsync-bailian.test.ts`, `tests/unit/lipsync-preprocess.test.ts`

## Changelog

| Date | Action |
|------|--------|
| 2026-04-01 | Initial CLAUDE.md generated |
