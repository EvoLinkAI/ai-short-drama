import { toFetchableUrl } from '@/lib/storage/utils'
import { decodeWavBuffer, mergeWavBuffers, getWavDurationFromBuffer, splitTextByLimit } from '@/lib/audio'

export const BAILIAN_TTS_MODEL_ID = 'qwen3-tts-vd-2026-01-26'
const BAILIAN_TTS_ENDPOINT = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation'
const BAILIAN_TTS_MAX_CHARS = 600

export interface BailianTTSInput {
  text: string
  voiceId: string
  languageType?: string
  modelId?: string
}

export interface BailianTTSResult {
  success: boolean
  audioData?: Buffer
  audioDuration?: number
  audioUrl?: string
  requestId?: string
  error?: string
  characters?: number
}

interface BailianTTSResponse {
  request_id?: string
  code?: string
  message?: string
  output?: {
    audio?: {
      data?: string
      url?: string
      id?: string
      expires_at?: number
    }
  }
  usage?: {
    characters?: number
  }
}

interface BailianTTSSegmentResult {
  audioBuffer: Buffer
  audioUrl?: string
  requestId?: string
  characters: number
}

function readTrimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

async function parseBailianTTSResponse(response: Response): Promise<BailianTTSResponse> {
  const raw = await response.text()
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('BAILIAN_TTS_RESPONSE_INVALID')
    }
    return parsed as BailianTTSResponse
  } catch {
    throw new Error('BAILIAN_TTS_RESPONSE_INVALID_JSON')
  }
}

async function readAudioBufferFromResponseAudio(audio: NonNullable<BailianTTSResponse['output']>['audio']): Promise<{
  audioBuffer: Buffer
  audioUrl?: string
}> {
  const audioDataBase64 = readTrimmedString(audio?.data)
  const audioUrl = readTrimmedString(audio?.url)

  if (audioDataBase64) {
    return {
      audioBuffer: Buffer.from(audioDataBase64, 'base64'),
      audioUrl: audioUrl || undefined,
    }
  }
  if (!audioUrl) {
    throw new Error('BAILIAN_TTS_AUDIO_MISSING')
  }

  const audioResponse = await fetch(toFetchableUrl(audioUrl))
  if (!audioResponse.ok) {
    throw new Error(`BAILIAN_TTS_AUDIO_DOWNLOAD_FAILED(${audioResponse.status})`)
  }
  const arrayBuffer = await audioResponse.arrayBuffer()
  return {
    audioBuffer: Buffer.from(arrayBuffer),
    audioUrl,
  }
}

async function synthesizeSegment(params: {
  text: string
  voiceId: string
  languageType: string
  modelId: string
  apiKey: string
}): Promise<BailianTTSSegmentResult> {
  const response = await fetch(BAILIAN_TTS_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: params.modelId,
      input: {
        text: params.text,
        voice: params.voiceId,
        language_type: params.languageType,
      },
    }),
  })
  const data = await parseBailianTTSResponse(response)
  if (!response.ok) {
    const code = readTrimmedString(data.code)
    const message = readTrimmedString(data.message)
    throw new Error(`BAILIAN_TTS_FAILED(${response.status}): ${code || message || 'unknown error'}`)
  }

  const outputAudio = data.output?.audio
  if (!outputAudio) {
    throw new Error('BAILIAN_TTS_OUTPUT_AUDIO_MISSING')
  }

  const audio = await readAudioBufferFromResponseAudio(outputAudio)
  const characters = typeof data.usage?.characters === 'number' && Number.isFinite(data.usage.characters)
    ? data.usage.characters
    : 0

  return {
    audioBuffer: audio.audioBuffer,
    audioUrl: audio.audioUrl,
    requestId: readTrimmedString(data.request_id) || undefined,
    characters,
  }
}

export async function synthesizeWithBailianTTS(
  input: BailianTTSInput,
  apiKey: string,
): Promise<BailianTTSResult> {
  const text = readTrimmedString(input.text)
  const voiceId = readTrimmedString(input.voiceId)
  const languageType = readTrimmedString(input.languageType) || 'Chinese'
  const modelId = readTrimmedString(input.modelId) || BAILIAN_TTS_MODEL_ID

  if (!apiKey.trim()) {
    return { success: false, error: 'BAILIAN_API_KEY_REQUIRED' }
  }
  if (!text) {
    return { success: false, error: 'BAILIAN_TTS_TEXT_REQUIRED' }
  }
  if (!voiceId) {
    return { success: false, error: 'BAILIAN_TTS_VOICE_ID_REQUIRED' }
  }

  const segments = splitTextByLimit(text, BAILIAN_TTS_MAX_CHARS)
  if (segments.length === 0) {
    return { success: false, error: 'BAILIAN_TTS_TEXT_REQUIRED' }
  }

  try {
    const buffers: Buffer[] = []
    let totalCharacters = 0
    let lastRequestId: string | undefined
    let firstAudioUrl: string | undefined

    for (const segment of segments) {
      const result = await synthesizeSegment({
        text: segment,
        voiceId,
        languageType,
        modelId,
        apiKey,
      })
      buffers.push(result.audioBuffer)
      totalCharacters += result.characters
      if (!firstAudioUrl && result.audioUrl) {
        firstAudioUrl = result.audioUrl
      }
      if (result.requestId) {
        lastRequestId = result.requestId
      }
    }

    const mergedAudio = mergeWavBuffers(buffers)
    return {
      success: true,
      audioData: mergedAudio,
      audioDuration: getWavDurationFromBuffer(mergedAudio),
      audioUrl: segments.length === 1 ? firstAudioUrl : undefined,
      requestId: lastRequestId,
      characters: totalCharacters,
    }
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'BAILIAN_TTS_UNKNOWN_ERROR',
    }
  }
}
