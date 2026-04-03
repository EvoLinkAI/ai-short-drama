/**
 * EvoLink Suno Music Generation — async submit + poll wrapper.
 *
 * Endpoint: POST https://api.evolink.ai/v1/audios/generations
 * Async task model — uses submitAndWaitAudioTask from audio-task.ts
 */

import { submitAndWaitAudioTask, extractAudioUrl, type PollOptions, type AudioTaskResult } from './audio-task'

// ---- Types ----

export type SunoModel =
  | 'suno-v5-beta'
  | 'suno-v4.5plus-beta'
  | 'suno-v4.5all-beta'
  | 'suno-v4.5-beta'
  | 'suno-v4-beta'

export interface SunoMusicParams {
  model: SunoModel
  custom_mode: boolean
  instrumental: boolean
  prompt?: string
  style?: string
  title?: string
  negative_tags?: string
  vocal_gender?: 'm' | 'f'
  style_weight?: number
  weirdness_constraint?: number
  audio_weight?: number
  persona_id?: string
  persona_model?: 'style_persona' | 'voice_persona'
  callback_url?: string
}

export interface SunoSong {
  audio_url: string
  title?: string
  result_id?: string
  duration?: number
  [key: string]: unknown
}

export interface SunoMusicResult {
  success: boolean
  taskId?: string
  songs?: SunoSong[]
  error?: string
}

// ---- Validation ----

const V4_MODELS = new Set<SunoModel>(['suno-v4-beta'])
function isV4(model: SunoModel): boolean {
  return V4_MODELS.has(model)
}

export function validateSunoMusicParams(params: SunoMusicParams): string | null {
  if (!params.model) return 'model is required'

  const { custom_mode, instrumental, model } = params

  // Simple mode
  if (!custom_mode) {
    if (!params.prompt || params.prompt.trim().length === 0) {
      return 'prompt is required in simple mode (custom_mode=false)'
    }
    if (params.prompt.length > 500) {
      return `prompt exceeds 500 chars in simple mode (got ${params.prompt.length})`
    }
  }

  // Custom mode
  if (custom_mode) {
    if (!params.style || params.style.trim().length === 0) {
      return 'style is required in custom mode'
    }
    if (!params.title || params.title.trim().length === 0) {
      return 'title is required in custom mode'
    }
    if (!instrumental) {
      if (!params.prompt || params.prompt.trim().length === 0) {
        return 'prompt (lyrics) is required in custom mode when instrumental=false'
      }
      const maxLyrics = isV4(model) ? 3000 : 5000
      if (params.prompt.length > maxLyrics) {
        return `prompt (lyrics) exceeds ${maxLyrics} chars for model ${model} (got ${params.prompt.length})`
      }
    }
    const maxStyle = isV4(model) ? 200 : 1000
    if (params.style.length > maxStyle) {
      return `style exceeds ${maxStyle} chars for model ${model} (got ${params.style.length})`
    }
  }

  // title max 80
  if (params.title && params.title.length > 80) {
    return `title exceeds 80 chars (got ${params.title.length})`
  }

  // voice_persona requires v5
  if (params.persona_model === 'voice_persona' && model !== 'suno-v5-beta') {
    return `persona_model=voice_persona requires model=suno-v5-beta (got ${model})`
  }

  // persona_model requires persona_id
  if (params.persona_model && !params.persona_id?.trim()) {
    return `persona_id is required when persona_model is set (got persona_model=${params.persona_model})`
  }

  // 0-1 range checks
  const rangeFields: Array<keyof SunoMusicParams> = ['style_weight', 'weirdness_constraint', 'audio_weight']
  for (const field of rangeFields) {
    const val = params[field]
    if (val !== undefined && typeof val === 'number') {
      if (val < 0 || val > 1) {
        return `${field} must be between 0 and 1 (got ${val})`
      }
    }
  }

  return null
}

// ---- Song extraction ----

function extractSongs(result: AudioTaskResult): SunoSong[] {
  const rd = result.result_data
  if (rd && Array.isArray(rd.songs)) {
    return (rd.songs as unknown[]).filter(
      (s): s is SunoSong =>
        typeof s === 'object' && s !== null && typeof (s as Record<string, unknown>).audio_url === 'string',
    )
  }
  // Fallback: single audio_url
  const url = extractAudioUrl(result)
  if (url) return [{ audio_url: url }]
  return []
}

// ---- Main ----

/**
 * Generate music via EvoLink Suno API.
 * Submits an async task and polls until completion.
 * Timeout default: 300_000 ms (5 min).
 */
export async function generateSunoMusic(
  params: SunoMusicParams,
  apiKey: string,
  pollOpts?: PollOptions,
): Promise<SunoMusicResult> {
  const validationError = validateSunoMusicParams(params)
  if (validationError) {
    return { success: false, error: `VALIDATION_ERROR: ${validationError}` }
  }

  const { model, custom_mode, instrumental, prompt, style, title, ...rest } = params

  const body: Record<string, unknown> = {
    model,
    custom_mode,
    instrumental,
    ...(prompt !== undefined && { prompt }),
    ...(style !== undefined && { style }),
    ...(title !== undefined && { title }),
    ...Object.fromEntries(
      Object.entries(rest).filter(([, v]) => v !== undefined),
    ),
  }

  try {
    const result = await submitAndWaitAudioTask(body, apiKey, {
      timeout: 300_000,
      ...pollOpts,
    })

    const songs = extractSongs(result)
    if (songs.length === 0) {
      return {
        success: false,
        taskId: result.id,
        error: 'EVOLINK_SUNO_NO_SONGS_IN_RESULT',
      }
    }

    return { success: true, taskId: result.id, songs }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { success: false, error: message }
  }
}
