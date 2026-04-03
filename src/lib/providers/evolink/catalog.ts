import { registerOfficialModel } from '@/lib/providers/official/model-registry'
import type { OfficialModelModality } from '@/lib/providers/official/model-registry'

const EVOLINK_CATALOG: Readonly<Record<OfficialModelModality, readonly string[]>> = {
  llm: [],
  image: [],
  video: [],
  audio: [
    'qwen3-tts-vd',
    'qwen3-tts-vd-2026-01-26',  // legacy ID — kept for backward compat
    'qwen-voice-design',
    'suno-v5-beta',
    'suno-v4.5plus-beta',
    'suno-v4.5all-beta',
    'suno-v4.5-beta',
    'suno-v4-beta',
    'suno-persona',
  ],
}

let initialized = false

export function ensureEvolinkCatalogRegistered(): void {
  if (initialized) return
  initialized = true
  for (const modality of Object.keys(EVOLINK_CATALOG) as OfficialModelModality[]) {
    for (const modelId of EVOLINK_CATALOG[modality]) {
      registerOfficialModel({ provider: 'evolink', modality, modelId })
    }
  }
}

export function listEvolinkCatalogModels(modality: OfficialModelModality): readonly string[] {
  ensureEvolinkCatalogRegistered()
  return EVOLINK_CATALOG[modality]
}
