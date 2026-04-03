[Root](../../../CLAUDE.md) > [src](../../) > [lib](../) > **generators**

# Generators Module

Multi-provider media generation factory for images, videos, and audio.

## Module Purpose

Provides a unified interface for media generation across multiple AI providers. Factory pattern routes to provider-specific implementations based on the `provider::modelId` key format.

## Entry & Factory

- **Factory**: `src/lib/generators/factory.ts`
  - `createImageGenerator(provider, modelId?)` -- returns `ImageGenerator`
  - `createVideoGenerator(provider)` -- returns `VideoGenerator`
  - `createAudioGenerator(provider)` -- returns `AudioGenerator`

## Supported Providers

| Provider Key | Image | Video | Audio |
|-------------|-------|-------|-------|
| `fal` | FalBananaGenerator | FalVideoGenerator | -- |
| `google` | GoogleGeminiImageGenerator, GoogleImagenGenerator, GoogleGeminiBatchImageGenerator | GoogleVeoVideoGenerator | -- |
| `ark` | ArkSeedreamGenerator | ArkSeedanceVideoGenerator | -- |
| `gemini-compatible` | GeminiCompatibleImageGenerator | GoogleVeoVideoGenerator | -- |
| `openai-compatible` | OpenAICompatibleImageGenerator | OpenAICompatibleVideoGenerator | -- |
| `bailian` | BailianImageGenerator | BailianVideoGenerator | BailianAudioGenerator |
| `siliconflow` | SiliconFlowImageGenerator | SiliconFlowVideoGenerator | SiliconFlowAudioGenerator |
| `minimax` | -- | MinimaxVideoGenerator | -- |
| `vidu` | -- | ViduVideoGenerator | -- |

## Key Files

| File | Purpose |
|------|---------|
| `factory.ts` | Provider routing factory |
| `base.ts` | Abstract base classes: `ImageGenerator`, `VideoGenerator`, `AudioGenerator` |
| `fal.ts` | Fal.ai provider (image + video) |
| `ark.ts` | Volcengine Ark provider (Seedream + Seedance) |
| `minimax.ts` | MiniMax video provider |
| `vidu.ts` | Vidu video provider |
| `official.ts` | Bailian + SiliconFlow official providers |
| `resolution-adapter.ts` | Resolution normalization across providers |
| `image/google.ts` | Google Gemini + Imagen image generators |
| `image/gemini-compatible.ts` | Gemini-compatible image generator |
| `image/openai-compatible.ts` | OpenAI-compatible image generator |
| `video/google.ts` | Google Veo video generator |
| `video/openai-compatible.ts` | OpenAI-compatible video generator |
| `audio/bailian.ts` | Bailian TTS audio generator |
| `audio/index.ts` | Audio generator exports |

## Key Dependencies

- **API config**: `src/lib/api-config.ts` for provider key resolution and API key retrieval
- **Storage**: Generated media is uploaded to storage via `src/lib/storage/`
- **Model config**: `src/lib/model-config-contract.ts` for `provider::modelId` parsing

## Testing

- Unit: `tests/unit/generators/` (factory, fal video presets, provider smoke, openai-compatible)
- Integration: `tests/integration/provider/` (fal, openai-compat contract tests)

## Changelog

| Date | Action |
|------|--------|
| 2026-04-01 | Initial CLAUDE.md generated |
