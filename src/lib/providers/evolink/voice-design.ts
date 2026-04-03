/**
 * EvoLink Voice Design — create custom voiceId via AI voice design.
 *
 * Endpoint: POST /v1/audios/generations (async, task-based)
 * Auth:     Bearer <evolink-api-key>
 *
 * Request body is flat:
 *   { model, voice_prompt, preview_text, preferred_name, language,
 *     sample_rate, response_format, target_model }
 */

import { logInfo } from '@/lib/logging/core'
import { submitAndWaitAudioTask, extractVoiceId, extractAudioUrl } from './audio-task'
import { EVOLINK_TTS_MODEL_ID } from './tts'

export interface EvolinkVoiceDesignInput {
  voicePrompt: string
  previewText: string
  preferredName?: string
  language?: 'zh' | 'en' | 'ja' | 'ko' | 'de' | 'fr' | 'it' | 'ru' | 'pt' | 'es'
}

export interface EvolinkVoiceDesignResult {
  success: boolean
  voiceId?: string
  targetModel?: string
  audioBase64?: string
  audioUrl?: string
  sampleRate?: number
  responseFormat?: string
  usageCount?: number
  requestId?: string
  error?: string
  errorCode?: string
}

export async function createEvolinkVoiceDesign(
  input: EvolinkVoiceDesignInput,
  apiKey: string,
): Promise<EvolinkVoiceDesignResult> {
  if (!apiKey) {
    return { success: false, error: 'EVOLINK_API_KEY_REQUIRED' }
  }

  const requestBody: Record<string, unknown> = {
    model: 'qwen-voice-design',
    voice_prompt: input.voicePrompt,
    preview_text: input.previewText,
    preferred_name: input.preferredName || 'custom_voice',
    language: input.language || 'zh',
    sample_rate: 24000,
    response_format: 'wav',
    target_model: EVOLINK_TTS_MODEL_ID,  // voice design target must match TTS model version
  }

  logInfo('[EvolinkVoiceDesign] Request:', { model: requestBody.model, language: requestBody.language })

  try {
    const result = await submitAndWaitAudioTask(requestBody, apiKey)

    const voiceId = extractVoiceId(result)
    if (!voiceId) {
      return {
        success: false,
        error: 'EVOLINK_VOICE_DESIGN_VOICE_ID_MISSING',
        requestId: result.id,
      }
    }

    const previewAudioUrl = extractAudioUrl(result)
    const rd = result.result_data

    return {
      success: true,
      voiceId,
      targetModel: rd && typeof rd.target_model === 'string' ? rd.target_model : 'qwen3-tts-vd-2026-01-26',
      audioUrl: previewAudioUrl,
      sampleRate: rd && typeof rd.sample_rate === 'number' ? rd.sample_rate : undefined,
      responseFormat: rd && typeof rd.response_format === 'string' ? rd.response_format : undefined,
      usageCount: undefined,
      requestId: result.id,
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Network request failed'
    return { success: false, error: message }
  }
}

export function validateVoicePrompt(voicePrompt: string): { valid: boolean; error?: string } {
  if (!voicePrompt || voicePrompt.trim().length === 0) {
    return { valid: false, error: 'Voice prompt cannot be empty' }
  }
  if (voicePrompt.length > 2048) {
    return { valid: false, error: 'Voice prompt cannot exceed 2048 characters' }
  }
  return { valid: true }
}

export function validatePreviewText(previewText: string): { valid: boolean; error?: string } {
  if (!previewText || previewText.trim().length === 0) {
    return { valid: false, error: 'Preview text cannot be empty' }
  }
  if (previewText.length < 5) {
    return { valid: false, error: 'Preview text must be at least 5 characters' }
  }
  if (previewText.length > 1024) {
    return { valid: false, error: 'Preview text cannot exceed 1024 characters' }
  }
  return { valid: true }
}
