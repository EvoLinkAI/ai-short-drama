/**
 * EvoLink TTS — wraps Qwen3 TTS via EvoLink unified async API.
 *
 * Endpoint: POST /v1/audios/generations (async, task-based)
 * Auth:     Bearer <evolink-api-key>
 *
 * Request body is flat (no nesting):
 *   { model, prompt, voice, language_type }
 */

import { mergeWavBuffers, getWavDurationFromBuffer, splitTextByLimit } from '@/lib/audio'
import { submitAndWaitAudioTask, extractAudioUrl } from './audio-task'

/** Kept for backward compatibility — callers may reference this constant. */
export const EVOLINK_TTS_MODEL_ID = 'qwen3-tts-vd-2026-01-26'

/** Model ID accepted by the /v1/audios/generations endpoint. */
const TTS_API_MODEL = 'qwen3-tts-vd'
const TTS_MAX_CHARS = 600

export interface EvolinkTTSInput {
  text: string
  voiceId: string
  languageType?: string
  modelId?: string
}

export interface EvolinkTTSResult {
  success: boolean
  audioData?: Buffer
  audioDuration?: number
  audioUrl?: string
  requestId?: string
  error?: string
  characters?: number
}

function str(v: unknown): string { return typeof v === 'string' ? v.trim() : '' }

// ---- segment synthesis ----

async function synthesizeSegment(params: {
  text: string
  voiceId: string
  languageType: string
  modelId: string
  apiKey: string
}): Promise<{ audioBuffer: Buffer; audioUrl?: string; requestId?: string; characters: number }> {
  const result = await submitAndWaitAudioTask(
    {
      model: params.modelId,
      prompt: params.text,
      voice: params.voiceId,
      language_type: params.languageType,
    },
    params.apiKey,
  )

  const audioUrl = extractAudioUrl(result)
  if (!audioUrl) throw new Error('EVOLINK_TTS_AUDIO_URL_MISSING')

  const res = await fetch(audioUrl)
  if (!res.ok) throw new Error(`EVOLINK_TTS_AUDIO_DOWNLOAD_FAILED(${res.status})`)
  const audioBuffer = Buffer.from(await res.arrayBuffer())

  const usage = result.usage
  const characters =
    usage && typeof usage.characters === 'number' && Number.isFinite(usage.characters)
      ? (usage.characters as number)
      : params.text.length

  return {
    audioBuffer,
    audioUrl,
    requestId: result.id,
    characters,
  }
}

// ---- public API ----

export async function synthesizeWithEvolinkTTS(
  input: EvolinkTTSInput,
  apiKey: string,
): Promise<EvolinkTTSResult> {
  const text = str(input.text)
  const voiceId = str(input.voiceId)
  const languageType = str(input.languageType) || 'Chinese'
  const rawModelId = str(input.modelId)
  const modelId = rawModelId === 'qwen3-tts-vd-2026-01-26' ? TTS_API_MODEL : (rawModelId || TTS_API_MODEL)

  if (!apiKey?.trim()) return { success: false, error: 'EVOLINK_API_KEY_REQUIRED' }
  if (!text) return { success: false, error: 'EVOLINK_TTS_TEXT_REQUIRED' }
  if (!voiceId) return { success: false, error: 'EVOLINK_TTS_VOICE_ID_REQUIRED' }

  const segments = splitTextByLimit(text, TTS_MAX_CHARS)
  if (segments.length === 0) return { success: false, error: 'EVOLINK_TTS_TEXT_REQUIRED' }

  try {
    const buffers: Buffer[] = []
    let totalCharacters = 0
    let lastRequestId: string | undefined
    let firstAudioUrl: string | undefined

    for (const segment of segments) {
      const result = await synthesizeSegment({ text: segment, voiceId, languageType, modelId, apiKey })
      buffers.push(result.audioBuffer)
      totalCharacters += result.characters
      if (!firstAudioUrl && result.audioUrl) firstAudioUrl = result.audioUrl
      if (result.requestId) lastRequestId = result.requestId
    }

    const merged = mergeWavBuffers(buffers)
    return {
      success: true,
      audioData: merged,
      audioDuration: getWavDurationFromBuffer(merged),
      audioUrl: segments.length === 1 ? firstAudioUrl : undefined,
      requestId: lastRequestId,
      characters: totalCharacters,
    }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'EVOLINK_TTS_UNKNOWN_ERROR' }
  }
}
