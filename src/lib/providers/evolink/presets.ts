/**
 * EvoLink preset model list — single source of truth.
 *
 * Consumed by:
 *   - src/lib/api-config.ts                      (getUserModels injection)
 *   - src/app/api/user/api-config/route.ts        (GET response preset injection)
 *   - src/app/api/user/models/route.ts            (GET response preset injection)
 */

import type { UnifiedModelType } from '@/lib/model-config-contract'

export interface EvolinkModelPreset {
  type: UnifiedModelType
  modelId: string
  name: string
}

export const EVOLINK_MODEL_PRESETS: EvolinkModelPreset[] = [
  { type: 'llm', modelId: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro' },
  { type: 'llm', modelId: 'gpt-5.4', name: 'GPT-5.4' },
  { type: 'llm', modelId: 'gemini-3.1-flash-lite-preview', name: 'Gemini 3.1 Flash Lite' },
  { type: 'llm', modelId: 'gemini-3.0-flash-preview', name: 'Gemini 3.0 Flash' },
  { type: 'llm', modelId: 'claude-opus-4-6', name: 'Claude Opus 4.6' },
  { type: 'llm', modelId: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6' },
  { type: 'image', modelId: 'gemini-3.1-flash-image-preview', name: 'NanoBanana 2' },
  { type: 'image', modelId: 'gemini-3-pro-image-preview', name: 'NanoBanana Pro' },
  { type: 'image', modelId: 'seedream-5.0-lite', name: 'Seedream 5.0 Lite' },
  { type: 'image', modelId: 'z-image-turbo', name: 'Z-Image-Turbo' },
  { type: 'image', modelId: 'gpt-image-2', name: 'GPT Image 2' },
  { type: 'image', modelId: 'gpt-image-2-beta', name: 'GPT Image 2 Beta' },
  { type: 'video', modelId: 'kling-o3-image-to-video', name: 'Kling O3' },
  { type: 'video', modelId: 'kling-v3-image-to-video', name: 'Kling V3' },
  { type: 'video', modelId: 'wan2.6-image-to-video', name: 'Wan 2.6 I2V' },
  { type: 'video', modelId: 'wan2.6-image-to-video-flash', name: 'Wan 2.6 I2V Flash' },
  { type: 'video', modelId: 'seedance-1.5-pro', name: 'Seedance 1.5 Pro' },
  { type: 'video', modelId: 'seedance-2.0', name: 'Seedance 2.0' },
  { type: 'audio', modelId: 'qwen3-tts-vd', name: 'Qwen3 TTS VD' },
  { type: 'audio', modelId: 'qwen-voice-design', name: 'Qwen Voice Design' },
  { type: 'audio', modelId: 'suno-v5-beta', name: 'Suno V5' },
  { type: 'audio', modelId: 'suno-v4.5plus-beta', name: 'Suno V4.5+' },
  { type: 'audio', modelId: 'suno-persona', name: 'Suno Persona' },
  { type: 'lipsync', modelId: 'videoretalk', name: 'VideoRetalk Lip Sync' },
]
