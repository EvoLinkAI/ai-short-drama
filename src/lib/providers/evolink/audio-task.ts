/**
 * EvoLink Audio Task — unified async submit + poll for all audio APIs.
 *
 * All 4 EvoLink audio APIs share the same endpoint and async model:
 *   - Qwen3 TTS VD (model: "qwen3-tts-vd")
 *   - Qwen Voice Design (model: "qwen-voice-design")
 *   - Suno Music Generation (model: "suno-v5-beta" etc.)
 *   - Suno Persona Creation (model: "suno-persona")
 *
 * Submit:  POST https://api.evolink.ai/v1/audios/generations
 * Poll:    GET  https://api.evolink.ai/v1/tasks/{taskId}
 */

import { createScopedLogger } from '@/lib/logging/core'

const logger = createScopedLogger({ module: 'evolink-audio-task' })

const AUDIO_GENERATIONS_ENDPOINT = 'https://api.evolink.ai/v1/audios/generations'
const TASK_QUERY_ENDPOINT = 'https://api.evolink.ai/v1/tasks'

// ---- Types ----

export interface AudioTaskSubmitResponse {
  id: string
  model: string
  status: string
  progress: number
  created: number
  object?: string
  type?: string
  task_info?: {
    can_cancel?: boolean
    estimated_time?: number
  }
  usage?: {
    billing_rule?: string
    credits_reserved?: number
    user_group?: string
  }
}

export interface AudioTaskResult {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  model?: string
  /** Model-specific result data (voice ID, audio URLs, songs, persona, etc.) */
  result_data?: Record<string, unknown>
  /** Legacy field — some tasks return URLs here */
  results?: string[]
  error?: { code?: string; message?: string }
  created?: number
  usage?: Record<string, unknown>
}

export interface PollOptions {
  /** Max wait time in ms (default: 180_000 = 3 min) */
  timeout?: number
  /** Polling interval in ms (default: 3000) */
  interval?: number
  /** Progress callback */
  onProgress?: (progress: number, status: string) => void
  /** Abort signal for early cancellation */
  signal?: AbortSignal
}

// ---- Helpers ----

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

// ---- Submit ----

/**
 * Submit an audio generation task to EvoLink.
 * All audio APIs share `POST /v1/audios/generations`.
 */
export async function submitAudioTask(
  body: Record<string, unknown>,
  apiKey: string,
): Promise<AudioTaskSubmitResponse> {
  if (!apiKey?.trim()) throw new Error('EVOLINK_API_KEY_REQUIRED')
  if (!body.model) throw new Error('EVOLINK_AUDIO_MODEL_REQUIRED')

  const response = await fetch(AUDIO_GENERATIONS_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const raw = await response.text()
  let data: Record<string, unknown>
  try {
    data = JSON.parse(raw) as Record<string, unknown>
  } catch {
    throw new Error(`EVOLINK_AUDIO_SUBMIT_INVALID_JSON: ${raw.slice(0, 200)}`)
  }

  if (!response.ok) {
    const errObj = data.error as { code?: string; message?: string } | undefined
    const errMsg = errObj?.message || errObj?.code || str(data.message) || `HTTP ${response.status}`
    throw new Error(`EVOLINK_AUDIO_SUBMIT_FAILED(${response.status}): ${errMsg}`)
  }

  const taskId = str(data.id)
  if (!taskId) {
    throw new Error('EVOLINK_AUDIO_SUBMIT_NO_TASK_ID')
  }

  logger.info('Audio task submitted', {
    taskId,
    model: str(data.model),
    status: str(data.status),
  })

  return {
    id: taskId,
    model: str(data.model),
    status: str(data.status) || 'pending',
    progress: typeof data.progress === 'number' ? data.progress : 0,
    created: typeof data.created === 'number' ? data.created : 0,
    object: str(data.object) || undefined,
    type: str(data.type) || undefined,
    task_info: data.task_info as AudioTaskSubmitResponse['task_info'],
    usage: data.usage as AudioTaskSubmitResponse['usage'],
  }
}

// ---- Poll ----

/**
 * Poll a single audio task status.
 * Returns the full task result including model-specific `result_data`.
 */
export async function queryAudioTaskStatus(
  taskId: string,
  apiKey: string,
): Promise<AudioTaskResult> {
  const response = await fetch(
    `${TASK_QUERY_ENDPOINT}/${encodeURIComponent(taskId)}`,
    {
      headers: { Authorization: `Bearer ${apiKey}` },
    },
  )

  const raw = await response.text()
  if (!response.ok) {
    throw new Error(`EVOLINK_AUDIO_QUERY_FAILED(${response.status}): ${raw.slice(0, 200)}`)
  }

  let data: Record<string, unknown>
  try {
    data = JSON.parse(raw) as Record<string, unknown>
  } catch {
    throw new Error(`EVOLINK_AUDIO_QUERY_INVALID_JSON(task=${taskId}): ${raw.slice(0, 200)}`)
  }
  const status = str(data.status).toLowerCase()

  return {
    id: str(data.id) || taskId,
    status: (['pending', 'processing', 'completed', 'failed'].includes(status)
      ? status
      : 'pending') as AudioTaskResult['status'],
    progress: typeof data.progress === 'number' ? data.progress : 0,
    model: str(data.model) || undefined,
    result_data: (data.result_data && typeof data.result_data === 'object')
      ? data.result_data as Record<string, unknown>
      : undefined,
    results: Array.isArray(data.results) ? (data.results as unknown[]).filter(x => typeof x === 'string') as string[] : undefined,
    error: (data.error && typeof data.error === 'object')
      ? data.error as { code?: string; message?: string }
      : undefined,
    created: typeof data.created === 'number' ? data.created : undefined,
    usage: (data.usage && typeof data.usage === 'object')
      ? data.usage as Record<string, unknown>
      : undefined,
  }
}

/**
 * Poll an audio task until completed or failed.
 */
export async function pollAudioTaskUntilDone(
  taskId: string,
  apiKey: string,
  opts: PollOptions = {},
): Promise<AudioTaskResult> {
  const timeout = opts.timeout ?? 180_000
  const interval = opts.interval ?? 3_000
  const deadline = Date.now() + timeout

  while (Date.now() < deadline) {
    if (opts.signal?.aborted) {
      throw new Error('EVOLINK_AUDIO_POLL_ABORTED')
    }

    const result = await queryAudioTaskStatus(taskId, apiKey)

    if (result.status === 'completed') {
      logger.info('Audio task completed', { taskId })
      return result
    }

    if (result.status === 'failed') {
      const errMsg = result.error?.message || result.error?.code || 'task failed'
      throw new Error(`EVOLINK_AUDIO_TASK_FAILED: ${errMsg}`)
    }

    opts.onProgress?.(result.progress, result.status)

    await new Promise(resolve => setTimeout(resolve, interval))
  }

  throw new Error(`EVOLINK_AUDIO_POLL_TIMEOUT: task ${taskId} did not complete within ${timeout}ms`)
}

// ---- Submit + Wait convenience ----

/**
 * Submit an audio task and wait for completion.
 * Returns the full task result with model-specific data.
 */
export async function submitAndWaitAudioTask(
  body: Record<string, unknown>,
  apiKey: string,
  opts: PollOptions = {},
): Promise<AudioTaskResult> {
  const submitted = await submitAudioTask(body, apiKey)

  // Use estimated_time to set a reasonable timeout if not specified
  const estimatedMs = (submitted.task_info?.estimated_time ?? 120) * 1000
  const effectiveTimeout = opts.timeout ?? Math.min(Math.max(estimatedMs * 2, 60_000), 600_000)

  return await pollAudioTaskUntilDone(submitted.id, apiKey, {
    ...opts,
    timeout: effectiveTimeout,
  })
}

// ---- Result helpers ----

/** Extract first URL from result_data or results array */
export function extractAudioUrl(result: AudioTaskResult): string | undefined {
  // Try result_data first (new format)
  const rd = result.result_data
  if (rd) {
    // TTS: result_data.audio_url or result_data.audio
    if (typeof rd.audio_url === 'string') return rd.audio_url
    if (typeof rd.audio === 'string') return rd.audio
    // Suno songs: result_data.songs[0].audio_url
    if (Array.isArray(rd.songs) && rd.songs.length > 0) {
      const song = rd.songs[0]
      if (song && typeof song === 'object' && typeof (song as Record<string, unknown>).audio_url === 'string') {
        return (song as Record<string, unknown>).audio_url as string
      }
    }
  }
  // Fallback: results array
  if (Array.isArray(result.results) && typeof result.results[0] === 'string') {
    return result.results[0]
  }
  return undefined
}

/** Extract voice ID from voice design result */
export function extractVoiceId(result: AudioTaskResult): string | undefined {
  const rd = result.result_data
  if (rd && typeof rd.voice === 'string') return rd.voice
  return undefined
}

/** Extract persona ID from persona creation result */
export function extractPersonaId(result: AudioTaskResult): string | undefined {
  const rd = result.result_data
  if (rd && typeof rd.persona_id === 'string') return rd.persona_id
  return undefined
}
