/**
 * EvoLink Audio — high-level audio generation entry point.
 */

import {
  assertOfficialModelRegistered,
  type OfficialModelModality,
} from '@/lib/providers/official/model-registry'
import { getProviderConfig } from '@/lib/api-config'
import type { GenerateResult } from '@/lib/generators/base'
import { ensureEvolinkCatalogRegistered } from './catalog'
import { synthesizeWithEvolinkTTS } from './tts'
import type { EvolinkGenerateRequestOptions } from './types'

export interface EvolinkAudioGenerateParams {
  userId: string
  text: string
  voice?: string
  rate?: number
  options: EvolinkGenerateRequestOptions
}

function assertRegistered(modelId: string): void {
  ensureEvolinkCatalogRegistered()
  assertOfficialModelRegistered({
    provider: 'evolink',
    modality: 'audio' satisfies OfficialModelModality,
    modelId,
  })
}

function str(v: unknown): string { return typeof v === 'string' ? v.trim() : '' }

export async function generateEvolinkAudio(params: EvolinkAudioGenerateParams): Promise<GenerateResult> {
  assertRegistered(params.options.modelId)
  const voiceId = str(params.voice)
  const text = str(params.text)
  if (!voiceId) throw new Error('EVOLINK_VOICE_ID_REQUIRED')
  if (!text) throw new Error('EVOLINK_TEXT_REQUIRED')

  const { apiKey } = await getProviderConfig(params.userId, params.options.provider)
  const result = await synthesizeWithEvolinkTTS({
    text,
    voiceId,
    modelId: params.options.modelId,
  }, apiKey)

  if (!result.success || !result.audioData) {
    throw new Error(result.error || 'EVOLINK_AUDIO_SYNTHESIZE_FAILED')
  }

  const fallbackDataUrl = `data:audio/wav;base64,${result.audioData.toString('base64')}`
  const audioUrl = result.audioUrl || fallbackDataUrl

  return {
    success: true,
    audioUrl,
    requestId: result.requestId,
  }
}
