/**
 * EvoLink Voice Management — delete custom voices.
 *
 * Endpoint: POST /v1/audio/voices (action: delete)
 * Auth:     Bearer <evolink-api-key>
 */

import { EVOLINK_API_BASE } from './constants'

interface ManageResponse {
  request_id?: string
  code?: string
  message?: string
}

function str(v: unknown): string { return typeof v === 'string' ? v.trim() : '' }

export async function deleteEvolinkVoice(params: {
  apiKey: string
  voiceId: string
}): Promise<{ requestId?: string }> {
  const apiKey = str(params.apiKey)
  const voiceId = str(params.voiceId)
  if (!apiKey) throw new Error('EVOLINK_API_KEY_REQUIRED')
  if (!voiceId) throw new Error('EVOLINK_VOICE_ID_REQUIRED')

  // TODO: EvoLink docs do not document a delete voice API at /v1/audio/voices.
  // This endpoint may need updating once EvoLink publishes the async delete API.
  const response = await fetch(`${EVOLINK_API_BASE}/audio/voices`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'qwen-voice-design',
      input: {
        action: 'delete',
        voice: voiceId,
      },
    }),
  })

  const raw = await response.text().catch(() => '')
  let data: ManageResponse = {}
  try { data = raw ? JSON.parse(raw) as ManageResponse : {} } catch { /* non-JSON body */ }

  if (!response.ok) {
    const code = str(data.code)
    const message = str(data.message)
    throw new Error(`EVOLINK_VOICE_DELETE_FAILED(${response.status}): ${code || message || raw.slice(0, 100) || 'unknown error'}`)
  }

  return { requestId: str(data.request_id) || undefined }
}
