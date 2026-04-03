/**
 * EvoLink Suno Persona Creation — async submit + poll wrapper.
 *
 * Endpoint: POST https://api.evolink.ai/v1/audios/generations
 * Model: suno-persona
 * Async task model — uses submitAndWaitAudioTask from audio-task.ts
 */

import { submitAndWaitAudioTask, extractPersonaId, type PollOptions } from './audio-task'

// ---- Types ----

export interface SunoPersonaParams {
  /** Completed Suno music task ID */
  source_task_id: string
  /** UUID of specific song from that task */
  result_id: string
  /** Persona name */
  name: string
  /** Musical style description */
  description: string
  /** Optional vocal start time in seconds (>= 0, must pair with vocal_end) */
  vocal_start?: number
  /** Optional vocal end time in seconds (> vocal_start, window 10–30s) */
  vocal_end?: number
  /** Optional style tags */
  style?: string
}

export interface SunoPersonaResult {
  success: boolean
  taskId?: string
  personaId?: string
  error?: string
}

// ---- UUID validation ----

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// ---- Validation ----

export function validateSunoPersonaParams(params: SunoPersonaParams): string | null {
  if (!params.source_task_id || params.source_task_id.trim().length === 0) {
    return 'source_task_id is required'
  }
  if (!params.result_id || params.result_id.trim().length === 0) {
    return 'result_id is required'
  }
  if (!UUID_RE.test(params.result_id)) {
    return `result_id must be a valid UUID (got "${params.result_id}")`
  }
  if (!params.name || params.name.trim().length === 0) {
    return 'name is required'
  }
  if (!params.description || params.description.trim().length === 0) {
    return 'description is required'
  }

  const hasStart = params.vocal_start !== undefined
  const hasEnd = params.vocal_end !== undefined

  if (hasStart !== hasEnd) {
    return 'vocal_start and vocal_end must both be present or both absent'
  }

  if (hasStart && hasEnd) {
    const start = params.vocal_start as number
    const end = params.vocal_end as number

    if (start < 0) {
      return `vocal_start must be >= 0 (got ${start})`
    }
    if (end <= start) {
      return `vocal_end must be > vocal_start (got end=${end}, start=${start})`
    }
    const window = end - start
    if (window < 10 || window > 30) {
      return `vocal window (vocal_end - vocal_start) must be 10–30 seconds (got ${window}s)`
    }
  }

  return null
}

// ---- Main ----

/**
 * Create a Suno Persona from a completed music task.
 * Submits an async task and polls until completion.
 * Timeout default: 60_000 ms (1 min).
 */
export async function createSunoPersona(
  params: SunoPersonaParams,
  apiKey: string,
  pollOpts?: PollOptions,
): Promise<SunoPersonaResult> {
  const validationError = validateSunoPersonaParams(params)
  if (validationError) {
    return { success: false, error: `VALIDATION_ERROR: ${validationError}` }
  }

  const modelParams: Record<string, unknown> = {
    source_task_id: params.source_task_id,
    result_id: params.result_id,
    name: params.name,
    description: params.description,
  }
  if (params.vocal_start !== undefined) modelParams.vocal_start = params.vocal_start
  if (params.vocal_end !== undefined) modelParams.vocal_end = params.vocal_end
  if (params.style !== undefined) modelParams.style = params.style

  const body: Record<string, unknown> = {
    model: 'suno-persona',
    model_params: modelParams,
  }

  try {
    const result = await submitAndWaitAudioTask(body, apiKey, {
      timeout: 60_000,
      ...pollOpts,
    })

    const personaId = extractPersonaId(result)
    if (!personaId) {
      return {
        success: false,
        taskId: result.id,
        error: 'EVOLINK_SUNO_PERSONA_NO_PERSONA_ID_IN_RESULT',
      }
    }

    return { success: true, taskId: result.id, personaId }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { success: false, error: message }
  }
}
